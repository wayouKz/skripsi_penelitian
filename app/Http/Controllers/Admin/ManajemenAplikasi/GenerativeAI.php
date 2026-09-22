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

        if (!$fokus) {
            return response()->json(['message' => 'Data target (fokus) tidak valid.'], 400);
        }

        $waktuSekarang = Carbon::now('Asia/Makassar');
        $hariIni = $waktuSekarang->locale('id')->isoFormat('dddd');
        $jamSekarang = $waktuSekarang->format('H:i:s');

        $guruSibuk = DB::table('t_jadwals')
            ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
            ->join('m_tahun_ajarans', 't_jadwals.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
            ->where('m_tahun_ajarans.status', 'active')
            ->where('t_jadwals.hari', $hariIni)
            ->whereTime('t_jadwals.jam_mulai', '<=', $jamSekarang)
            ->whereTime('t_jadwals.jam_selesai', '>=', $jamSekarang)
            ->pluck('t_list_guru_mapels.nip');

        $guruTersedia = MGuru::whereNotIn('m_gurus.nip', $guruSibuk)
            ->join('t_list_guru_mapels', 'm_gurus.nip', '=', 't_list_guru_mapels.nip')
            ->join('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
            ->select('m_gurus.nama_guru', 'm_mapels.nama_mapel')
            ->get()
            ->groupBy('nama_guru')
            ->map(function ($items, $nama_guru) {
                return [
                    'nama' => $nama_guru,
                    'mapel_diampu' => $items->pluck('nama_mapel')->unique()->values()->toArray()
                ];
            })->values()->toJson();

        $prompt = "Anda adalah asisten penjadwalan. Rekomendasikan 1 guru untuk menggantikan kelas kosong.
        - Kelas: {$fokus['nama_kelas']}
        - Mapel yang kosong: {$fokus['nama_mapel']}
        - Guru asli yang absen: {$fokus['nama_guru']}
        - Daftar Guru Tersedia: {$guruTersedia}

        Aturan:
        1. Pilih guru dengan 'mapel_diampu' yang paling relevan/serumpun dengan mapel yang kosong.
        2. Berikan skor kecocokan dalam persentase (misal: '90%').
        3. WAJIB berikan respons HANYA berupa JSON polos tanpa format markdown (jangan gunakan ```json).
        4. Format output persis seperti ini: {\"nama\": \"Nama Guru Terpilih\", \"matchScore\": \"XX%\", \"alasan\": \"Alasan singkat kenapa cocok\"}";

        $cacheKey = 'rekomendasi-ai-' . Str::slug($fokus['nama_kelas'] . '-' . $fokus['nama_mapel']);

    try {

        $hasilAI = Cache::remember($cacheKey, 3600, function () use ($gemini, $prompt) {

            $aiResponse = $gemini->generateResponse($prompt);

            // Bersihkan formatting markdown jika AI membandel
            $cleanJsonString = trim(str_replace(['```json', '```'], '', $aiResponse));
            $decoded = json_decode($cleanJsonString, true);

            // Validasi jika JSON decode gagal
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception("Format balasan AI tidak valid");
            }

            // Return ini akan otomatis disimpan ke dalam Cache
            return $decoded;
        });

        // 6. Kembalikan respons sesuai format yang dibaca oleh React (rekomendasiAI.kandidat)
        return response()->json([
            'kandidat' => [ $hasilAI ]
        ]);

    } catch (\Exception $e) {
        // Opsional: Jika terjadi error, hapus cache yang mungkin gagal terbentuk
        Cache::forget($cacheKey);

      $errorMessage = $e->getMessage();

    // Jika error karena server Gemini sedang sibuk/penuh
    if (str_contains($errorMessage, 'high demand') || str_contains($errorMessage, '503')) {
        $pesan = "Server AI sedang sibuk melayani banyak permintaan. Silakan coba lagi dalam beberapa menit. Jika masih tidak berhasil, hubungi tim IT.";
    }
    // Jika error karena limit kuota 20 per menit
    elseif (str_contains($errorMessage, 'Quota exceeded')) {
        $pesan = "Limit permintaan AI tercapai. Silakan tunggu sekitar 1 menit sebelum mencoba lagi.";
    }
    // Error lainnya
    else {
        $pesan = "Gagal memuat rekomendasi: AI mengalami kendala teknis.";
    }

    return response()->json([
        'message' => $pesan
    ], 500);
    }
    }
}
