<?php

namespace App\Http\Controllers\Admin\ManajemenAplikasi;

use App\Http\Controllers\Controller;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MKelas;
use App\Services\GeminiAI;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GenerativeAI extends Controller
{
public function RecomendationGuru(Request $request)
{
    $gemini = new GeminiAI();

    $fokus = $request->input('fokus');
    $tanggal = $request->input('tanggal', Carbon::now('Asia/Makassar')->format('Y-m-d'));

    if (!$fokus || !isset($fokus['nama_kelas'], $fokus['nama_mapel'])) {
        return response()->json(['message' => 'Data target (fokus) tidak valid.'], 400);
    }

    $waktuSekarang = Carbon::now('Asia/Makassar');
    $hariTarget = $fokus['hari'] ?? $waktuSekarang->locale('id')->isoFormat('dddd');

    $jamMulaiTarget = !empty($fokus['jam_sesi']) ? explode('-', $fokus['jam_sesi'])[0] : $waktuSekarang->format('H:i:s');
    $jamSelesaiTarget = !empty($fokus['jam_sesi']) ? explode('-', $fokus['jam_sesi'])[1] : $waktuSekarang->format('H:i:s');

    // 1. Ambil ID guru yang sibuk mengajar berdasarkan jadwal
    $guruSibukJadwal = DB::table('t_jadwals')
        ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
        ->join('m_tahun_ajarans', 't_jadwals.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
        ->where('m_tahun_ajarans.status', 'active')
        ->where('t_jadwals.hari', $hariTarget)
        ->whereTime('t_jadwals.jam_mulai', '<=', trim($jamSelesaiTarget))
        ->whereTime('t_jadwals.jam_selesai', '>=', trim($jamMulaiTarget))
        ->pluck('t_list_guru_mapels.guru_id'); // Pastikan mengambil ID guru

    // 2. Ambil ID guru yang sudah absen/berhalangan pada tanggal tersebut
    // Sesuaikan 'guru_id' dengan kolom yang benar di database Anda
    $guruAbsenHariIni = DB::table('t_absen_gurus')
        ->whereDate('waktu_absen', '=', $tanggal)
        ->whereNotNull('guru_id')
        ->pluck('guru_id');

    // Gabungkan ID guru yang dilarang dan bersihkan duplikat
    $guruDilarang = $guruSibukJadwal->merge($guruAbsenHariIni)->unique()->toArray();

    // 3. Ambil guru yang benar-benar free
    $guruTersedia = MGuru::whereNotIn('m_gurus.id', $guruDilarang)
        ->join('t_list_guru_mapels', 'm_gurus.id', '=', 't_list_guru_mapels.guru_id') // Sesuaikan relasi jika menggunakan ID atau NIP
        ->join('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
        ->select('m_gurus.id', 'm_gurus.nama_guru', 'm_mapels.nama_mapel')
        ->get()
        ->groupBy('nama_guru')
        ->map(function ($items, $nama_guru) {
            return [
                'guru_id' => $items->first()->id,
                'nama' => $nama_guru,
                'mapel_diampu' => $items->pluck('nama_mapel')->unique()->values()->toArray()
            ];
        })->values();

    // Jika tidak ada guru tersedia
    if ($guruTersedia->isEmpty()) {
        return response()->json([
            'message' => 'Tidak ada guru yang tersedia pada jam dan hari tersebut.'
        ], 422);
    }

    $fokusJson = json_encode($fokus);
    $guruTersediaJson = $guruTersedia->toJson();

    $prompt = "Anda adalah asisten penjadwalan. Rekomendasikan 1 guru untuk menggantikan kelas kosong.
- Kelas: {$fokus['nama_kelas']}
- Mapel yang kosong: {$fokus['nama_mapel']}
- Guru asli yang absen: {$fokus['nama_guru']}
- Daftar Guru Tersedia (Free): {$guruTersediaJson}

Aturan:
1. Pilih guru dengan 'mapel_diampu' yang paling relevan/serumpun dengan mapel yang kosong.
2. Berikan skor kecocokan dalam persentase (misal: '90%').
3. WAJIB berikan respons HANYA berupa JSON polos tanpa teks pengantar atau format markdown.
4. Format output persis seperti ini:
{
  \"guru_id\": \"ID Guru Terpilih\",
  \"nama\": \"Nama Guru Terpilih\",
  \"matchScore\": \"XX%\",
  \"alasan\": \"Alasan singkat kenapa cocok\",
  \"nama_mapel\": \"Mapel utama yang diampu guru terpilih\",
  \"fokus_permintaan\": {$fokusJson}
}";

    // Gunakan cache singkat (misal 2 menit) atau hapus jika ingin real-time murni
    $cacheKey = 'rekomendasi-ai-' . Str::slug($fokus['nama_kelas'] . '-' . $fokus['nama_mapel'] . '-' . $tanggal . '-' . $jamMulaiTarget);

    try {
        $hasilAI = Cache::remember($cacheKey, 120, function () use ($gemini, $prompt) {
            $aiResponse = $gemini->generateResponse($prompt);

            // Bersihkan respons menggunakan Regex untuk mengambil bagian JSON saja jika AI menyisipkan teks lain
            if (preg_match('/\{[\s\S]*\}/', $aiResponse, $matches)) {
                $cleanJsonString = $matches[0];
            } else {
                $cleanJsonString = trim(str_replace(['```json', '```'], '', $aiResponse));
            }

            $decoded = json_decode($cleanJsonString, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception("Format balasan AI tidak valid: " . json_last_error_msg());
            }

            return $decoded;
        });

        return response()->json([
            'kandidat' => [ $hasilAI ]
        ]);

    } catch (\Exception $e) {
        Cache::forget($cacheKey);
        $errorMessage = $e->getMessage();

        if (str_contains($errorMessage, 'high demand') || str_contains($errorMessage, '503')) {
            $pesan = "Server AI sedang sibuk melayani banyak permintaan. Silakan coba lagi dalam beberapa menit.";
        } elseif (str_contains($errorMessage, 'Quota exceeded')) {
            $pesan = "Limit permintaan AI tercapai. Silakan tunggu sekitar 1 menit.";
        } else {
            $pesan = "Gagal memuat rekomendasi: " . $errorMessage;
        }

        return response()->json([
            'message' => $pesan
        ], 500);
    }
}
}
