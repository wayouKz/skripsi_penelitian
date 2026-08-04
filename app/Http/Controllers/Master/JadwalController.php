<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Services\GeneticAlgorithmService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class JadwalController extends Controller
{
     public function index(){
        return Inertia::render('Admin/Master/GenerateJadwal/GenerateJadwal');
    }

    public function generate(Request $request)
{
    set_time_limit(300);
    ini_set('memory_limit', '512M');
    $params = $request->all();
    $prioritasPagi = $request->input('prioritas_pagi', []); // Diharapkan array of object

    $guruMapels = DB::table('t_list_guru_mapels')
        ->join('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
        ->where('t_list_gurus.tahun_ajaran_id', $params['tahun_ajaran_id'])
        ->select(
            't_list_guru_mapels.id',
            't_list_guru_mapels.nip',
            't_list_guru_mapels.mapel_id',
            't_list_guru_mapels.beban_jam',
            't_list_gurus.id as t_list_guru_id',
            't_list_gurus.kelas_id'
        )
        ->get();

    $guruMapels = $guruMapels->map(function ($item) use ($prioritasPagi) {
        $item->is_prioritas_pagi = false;
        foreach ($prioritasPagi as $p) {
            if ($item->nip === $p['nip'] && $item->kelas_id === (int)$p['kelas_id']) {
                $item->is_prioritas_pagi = true;
                break;
            }
        }
        return $item;
    });
    $kelas = DB::table('m_kelas')->get();

    return response()->stream(function () use ($params, $guruMapels, $kelas, $prioritasPagi) {

        // 1. Matikan kompresi Zlib (karena kompresi akan menahan data sampai proses selesai)
        ini_set('zlib.output_compression', 'Off');
        if (function_exists('apache_setenv')) {
            apache_setenv('no-gzip', '1');
        }

        // 2. Hancurkan SEMUA lapisan output buffer PHP bawaan secara paksa
        while (ob_get_level() > 0) {
            ob_end_flush();
        }

        echo str_repeat(" ", 4096) . "\n\n";
        flush();

        echo "data: " . json_encode([
            'type' => 'progress',
            'generation' => 0,
            'fitness' => 0,
            'message' => 'Memulai inisialisasi populasi awal...'
        ]) . "\n\n";
        flush();

        $gaEngine = new GeneticAlgorithmService($params, $guruMapels, $kelas, $prioritasPagi);
        $gaEngine->onGenerationComplete = function($generasi, $fitness) {
                echo "data: " . json_encode([
                    'type' => 'progress',
                    'generation' => $generasi,
                    'fitness' => $fitness
                ]) . "\n\n";
                flush();
        };

        $hasil = $gaEngine->generate();

       if (!empty($hasil['jadwal'])) {
        try {
            // 1. WAJIB ADA: Mulai transaksi database
            DB::beginTransaction();

            // 2. Hapus jadwal lama berdasarkan tahun ajaran
            DB::table('t_jadwals')->where('tahun_ajaran_id', $params['tahun_ajaran_id'])->delete();

            $insert = [];

            // Buat satu kode batch yang sama untuk sesi generate ini (bukan random 100 karakter per baris)

            $now = now();
            $kodeJadwalPerBlock = [];

            foreach ($hasil['jadwal'] as $jadwal) {
                $blockKey = $jadwal['t_list_guru_mapel_id'] . '-' . $jadwal['kelas_id'] . '-' . $jadwal['mapel_id'];

                // Jika kode jadwal untuk kelas/blok ini belum dibuat, buat baru
                if (!isset($kodeJadwalPerBlock[$blockKey])) {
                    $kodeJadwalPerBlock[$blockKey] = 'JDWL-' . strtoupper(Str::random(10));
                }

                $insert[] = [
                    'kode_jadwal'          => $kodeJadwalPerBlock[$blockKey], // Sama untuk blok/kelas yang sama
                    'tahun_ajaran_id'      => $params['tahun_ajaran_id'],
                    'hari'                 => $jadwal['hari'],
                    'jam_mulai'            => $jadwal['jam_mulai'],
                    'jam_selesai'          => $jadwal['jam_selesai'],
                    'kelas_id'             => $jadwal['kelas_id'],
                    'mapel_id'             => $jadwal['mapel_id'],
                    't_list_guru_mapel_id' => $jadwal['t_list_guru_mapel_id'],
                    'created_at'           => $now,
                    'updated_at'           => $now,
                ];

                echo "data: " . json_encode([
                    'type' => 'progress',
                    'message' => 'Menyimpan jadwal ke database...'
                ]) . "\n\n";
                flush();
            }
            // 3. Gunakan array_chunk (pecah per 500 baris) agar tidak jebol di MySQL
            $chunks = array_chunk($insert, 500);
            foreach ($chunks as $chunk) {
                DB::table('t_jadwals')->insert($chunk);
            }

            // 4. Commit transaksi jika semua chunk berhasil
            DB::commit();

            echo "data: " . json_encode(['type' => 'done', 'message' => 'Berhasil!']) . "\n\n";
            flush();

        } catch (\Exception $e) {
            // Rollback jika ada error
            DB::rollBack();

            $detailError = $e->getMessage() . ' di baris ' . $e->getLine();

            echo "data: " . json_encode(['type' => 'error', 'message' => $detailError]) . "\n\n";
            flush();
        }
}

    // 6. Pastikan header anti-buffering ini tetap ada
    }, 200, [
        'Content-Type' => 'text/event-stream',
        'Cache-Control' => 'no-cache, must-revalidate',
        'Connection' => 'keep-alive',
        'X-Accel-Buffering' => 'no',
    ]);
    }

    public function pdf(Request $request){
        return response()->view('pdf.jadwal.jadwal', [
            'tahun_ajaran_id' => $request->input('tahun_ajaran_id'),
            'kelas' => $request->input('kelas'),
        ])->header('Content-Type', 'application/pdf');
    }
}
