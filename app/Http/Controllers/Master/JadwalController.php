<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\SlotWaktu;
use App\Services\GeneticAlgorithmService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
class JadwalController extends Controller
{
     public function index(){
        return Inertia::render('Admin/Master/GenerateJadwal/GenerateJadwal');
    }

public function generate(Request $request)
    {
        ini_set('max_execution_time', 0);
        set_time_limit(0);
        ini_set('memory_limit', '1024M');

        $params = $request->all();
        $slotWaktu = $request->input('slot_waktu', []);
        $prioritasPagi = $request->input('prioritas_pagi', []);

        $guruMapels = DB::table('t_list_guru_mapels')
            ->leftJoin('t_list_gurus', function ($join) use ($params) {
                $join->on('t_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
                     ->where('t_list_gurus.tahun_ajaran_id', $params['tahun_ajaran_id']);
            })
            ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
            ->leftJoin('m_gurus', 't_list_gurus.guru_id', '=', 'm_gurus.id')
            ->select(
                't_list_gurus.guru_id',
                't_list_guru_mapels.id',
                't_list_guru_mapels.nip',
                't_list_guru_mapels.mapel_id',
                't_list_guru_mapels.beban_jam',
                't_list_gurus.id as t_list_guru_id',
                't_list_gurus.kelas_id',
                'm_mapels.nama_mapel',
                'm_gurus.nama_guru'
            )
            ->whereNotNull('t_list_gurus.kelas_id')
            ->distinct()
            ->get();

        $guruMapels = $guruMapels->map(function ($item) use ($prioritasPagi) {
            $item->is_prioritas_pagi = false;
            $item->nama_guru = $item->nama_guru ?? 'None';
            $item->nama_mapel = $item->nama_mapel ?? 'Unknown Mapel';

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
            ini_set('zlib.output_compression', 'Off');
            if (function_exists('apache_setenv')) {
                apache_setenv('no-gzip', '1');
            }

            while (ob_get_level() > 0) {
                ob_end_flush();
            }

            // echo str_repeat(" ", 4096) . "\n\n";
            flush();

            try {
                Log::info('Mulai proses Generate Jadwal (GA).', [
                    'tahun_ajaran_id' => $params['tahun_ajaran_id'] ?? null
                ]);

                echo "data: " . json_encode([
                    'type' => 'progress',
                    'generation' => 0,
                    'fitness' => 0,
                    'message' => 'Memulai inisialisasi populasi awal...'
                ]) . "\n\n";
                flush();

                $waktuMulai = microtime(true);
                $gaEngine = new GeneticAlgorithmService($params, $guruMapels, $kelas, $prioritasPagi);

                // Callback untuk progress biasa (generasi & fitness)
                $gaEngine->onGenerationComplete = function($generasi, $fitness) {
                    echo "data: " . json_encode([
                        'type' => 'progress',
                        'generation' => $generasi,
                        'fitness' => $fitness
                    ]) . "\n\n";
                    flush();
                };

                // Callback BARU: Streaming struktur kromosom setiap kali ditemukan best kromosom baru
                $gaEngine->onNewBest = function($generasi, $fitness, $kromosom) {
                    echo "data: " . json_encode([
                        'type' => 'new_best',
                        'generation' => $generasi,
                        'fitness' => $fitness,
                        'kromosom' => $kromosom
                        
                    ]) . "\n\n";
                    flush();
                };

                $gaEngine->onLog = function($logData) {
                    echo "data: " . json_encode([
                        'type' => 'log_update',
                        'log'  => $logData
                    ]) . "\n\n";
                    flush();
                };
                $hasil = $gaEngine->generate();
                $durasi = round(microtime(true) - $waktuMulai, 2);

                if (!empty($hasil['jadwal'])) {
                    echo "data: " . json_encode([
                        'type' => 'progress',
                        'message' => 'Proses algoritma selesai, menyimpan jadwal ke database...'
                    ]) . "\n\n";
                    flush();

                    DB::beginTransaction();
                    DB::table('t_jadwals')->where('tahun_ajaran_id', $params['tahun_ajaran_id'])->delete();

                    $insert = [];
                    $now = now();
                    $kodeJadwalPerBlock = [];

                    foreach ($hasil['jadwal'] as $jadwal) {
                        $blockKey = $jadwal['t_list_guru_mapel_id'] . '-' . $jadwal['kelas_id'] . '-' . $jadwal['mapel_id'];

                        if (!isset($kodeJadwalPerBlock[$blockKey])) {
                            $kodeJadwalPerBlock[$blockKey] = 'JDWL-' . strtoupper(Str::random(10));
                        }

                        $insert[] = [
                            'kode_jadwal'          => $kodeJadwalPerBlock[$blockKey],
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
                    }

                    $chunks = array_chunk($insert, 500);
                    foreach ($chunks as $chunk) {
                        DB::table('t_jadwals')->insert($chunk);
                    }

                    DB::commit();

                    echo "data: " . json_encode([
                        'type' => 'done',
                        'message' => "Berhasil! Waktu eksekusi: $durasi detik.",
                        'best_kromosom' => $hasil['best_kromosom'] ?? []
                    ]) . "\n\n";
                    flush();

                } else {
                    Log::warning('Jadwal gagal dibuat (array jadwal kosong).');
                    echo "data: " . json_encode([
                        'type' => 'error',
                        'message' => 'Algoritma selesai tetapi gagal menghasilkan jadwal.'
                    ]) . "\n\n";
                    flush();
                }

            } catch (\Exception $e) {
                if (DB::transactionLevel() > 0) {
                    DB::rollBack();
                }

                $detailError = $e->getMessage() . ' di baris ' . $e->getLine() . ' pada ' . basename($e->getFile());
                Log::error('Critical Error Generate Jadwal: ' . $e->getMessage());

                echo "data: " . json_encode(['type' => 'error', 'message' => "Terjadi Kesalahan: $detailError"]) . "\n\n";
                flush();
            }

        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, must-revalidate',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
//     public function generate(Request $request)
// {
//    ini_set('max_execution_time', 0);
//     set_time_limit(0);

//     ini_set('memory_limit', '1024M');
//     $params = $request->all();

//     $slotWaktu = $request->input('slot_waktu', []);
//     // $simpanSlot = SlotWaktu::createOrUpdate([],[
//     //     'slot_waktu' => $jsonSlot
//     // ]);
//     $prioritasPagi = $request->input('prioritas_pagi', []); // Diharapkan array of object

// $guruMapels = DB::table('t_list_guru_mapels')
//         ->leftJoin('t_list_gurus', function ($join) use ($params) {
//             $join->on('t_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
//                  ->where('t_list_gurus.tahun_ajaran_id', $params['tahun_ajaran_id']);
//         })
//         ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
//         ->leftJoin('m_gurus', 't_list_gurus.guru_id', '=', 'm_gurus.id')
//         ->select(
//             't_list_gurus.guru_id',
//             't_list_guru_mapels.id',
//             't_list_guru_mapels.nip',
//             't_list_guru_mapels.mapel_id',
//             't_list_guru_mapels.beban_jam',
//             't_list_gurus.id as t_list_guru_id',
//             't_list_gurus.kelas_id',
//             'm_mapels.nama_mapel',
//             'm_gurus.nama_guru'
//         )
//         // Tambahkan kondisi agar kelas_id dan mapel_id bersifat unik / tidak ganda
//         ->whereNotNull('t_list_gurus.kelas_id')
//         ->distinct() // Menghindari baris duplikat yang tidak sengaja ter-join
//         ->get();
//     $guruMapels = $guruMapels->map(function ($item) use ($prioritasPagi) {
//         $item->is_prioritas_pagi = false;

//         // Handle jika nama_guru atau nama_mapel bernilai null akibat Left Join
//         $item->nama_guru = $item->nama_guru ?? 'None';
//         $item->nama_mapel = $item->nama_mapel ?? 'Unknown Mapel';

//         foreach ($prioritasPagi as $p) {
//             if ($item->nip === $p['nip'] && $item->kelas_id === (int)$p['kelas_id']) {
//                 $item->is_prioritas_pagi = true;
//                 break;
//             }
//         }
//         return $item;
//     });
//     // dd($guruMapels);
//     $kelas = DB::table('m_kelas')->get();

//    return response()->stream(function () use ($params, $guruMapels, $kelas, $prioritasPagi) {

//     // 1. Matikan kompresi Zlib
//     ini_set('zlib.output_compression', 'Off');
//     if (function_exists('apache_setenv')) {
//         apache_setenv('no-gzip', '1');
//     }

//     // 2. Hancurkan SEMUA lapisan output buffer PHP bawaan secara paksa
//     while (ob_get_level() > 0) {
//         ob_end_flush();
//     }

//     echo str_repeat(" ", 4096) . "\n\n";
//     flush();

//     // 3. WRAP KESELURUHAN PROSES DENGAN TRY-CATCH
//     try {
//         // Catat ke log file Laravel (storage/logs/laravel.log) untuk histori backend
//         \Illuminate\Support\Facades\Log::info('Mulai proses Generate Jadwal (GA).', [
//             'tahun_ajaran_id' => $params['tahun_ajaran_id'] ?? null
//         ]);

//         echo "data: " . json_encode([
//             'type' => 'progress',
//             'generation' => 0,
//             'fitness' => 0,
//             'message' => 'Memulai inisialisasi populasi awal...'
//         ]) . "\n\n";
//         flush();

//         $waktuMulai = microtime(true); // Pelacak durasi eksekusi
//         $gaEngine = new GeneticAlgorithmService($params, $guruMapels, $kelas, $prioritasPagi);

//         $gaEngine->onGenerationComplete = function($generasi, $fitness) {
//             echo "data: " . json_encode([
//                 'type' => 'progress',
//                 'generation' => $generasi,
//                 'fitness' => $fitness
//             ]) . "\n\n";
//             flush();

//             // Opsional: Log per 50 generasi agar log tidak terlalu penuh
//             if ($generasi % 50 === 0) {
//                 \Illuminate\Support\Facades\Log::debug("GA Progress - Gen: $generasi, Fitness: $fitness");
//             }
//         };

//         // Mulai Generate Algoritma
//         $hasil = $gaEngine->generate();
//         $durasi = round(microtime(true) - $waktuMulai, 2);

//         \Illuminate\Support\Facades\Log::info("GA Selesai dalam $durasi detik.", ['status' => $hasil['status'] ?? 'unknown']);
//         // \Illuminate\Support\Facades\Log::info("Jadwal: " . json_encode($hasil['jadwal']) . "totalData" . count($hasil['jadwal']));

//         // 4. CEK APAKAH JADWAL BENAR-BENAR TERBENTUK
//         if (!empty($hasil['jadwal'])) {
//             echo "data: " . json_encode([
//                 'type' => 'progress',
//                 'message' => 'Proses algoritma selesai, menyimpan jadwal ke database...'
//             ]) . "\n\n";
//             flush();

//             DB::beginTransaction();
//             DB::table('t_jadwals')->where('tahun_ajaran_id', $params['tahun_ajaran_id'])->delete();

//             $insert = [];
//             $now = now();
//             $kodeJadwalPerBlock = [];

//             foreach ($hasil['jadwal'] as $jadwal) {
//                 $blockKey = $jadwal['t_list_guru_mapel_id'] . '-' . $jadwal['kelas_id'] . '-' . $jadwal['mapel_id'];

//                 if (!isset($kodeJadwalPerBlock[$blockKey])) {
//                     $kodeJadwalPerBlock[$blockKey] = 'JDWL-' . strtoupper(Str::random(10));
//                 }

//                 $insert[] = [
//                     'kode_jadwal'          => $kodeJadwalPerBlock[$blockKey],
//                     'tahun_ajaran_id'      => $params['tahun_ajaran_id'],
//                     'hari'                 => $jadwal['hari'],
//                     'jam_mulai'            => $jadwal['jam_mulai'],
//                     'jam_selesai'          => $jadwal['jam_selesai'],
//                     'kelas_id'             => $jadwal['kelas_id'],
//                     'mapel_id'             => $jadwal['mapel_id'],
//                     't_list_guru_mapel_id' => $jadwal['t_list_guru_mapel_id'],
//                     'created_at'           => $now,
//                     'updated_at'           => $now,
//                 ];
//             }

//             $chunks = array_chunk($insert, 500);
//             foreach ($chunks as $chunk) {
//                 DB::table('t_jadwals')->insert($chunk);
//             }

//             DB::commit();
//             \Illuminate\Support\Facades\Log::info('Jadwal berhasil disimpan ke database.');

//             echo "data: " . json_encode([
//                 'type' => 'done',
//                 'message' => "Berhasil! Waktu eksekusi: $durasi detik."
//             ]) . "\n\n";
//             flush();

//         } else {
//             // 5. JIKA JADWAL KOSONG (Algoritma Gagal Mendapatkan Solusi)
//             \Illuminate\Support\Facades\Log::warning('Jadwal gagal dibuat (array jadwal kosong).');
//             echo "data: " . json_encode([
//                 'type' => 'error',
//                 'message' => 'Algoritma selesai tetapi gagal menghasilkan jadwal. Kemungkinan parameter jam berbenturan.'
//             ]) . "\n\n";
//             flush();
//         }

//     } catch (\Exception $e) {
//         // 6. TANGKAP SEMUA ERROR (Algoritma maupun Database)
//         if (DB::transactionLevel() > 0) {
//             DB::rollBack();
//         }

//         // Tampilkan error detail ke frontend
//         $detailError = $e->getMessage() . ' di baris ' . $e->getLine() . ' pada ' . basename($e->getFile());

//         // Tulis error super detail ke laravel.log
//         \Illuminate\Support\Facades\Log::error('Critical Error Generate Jadwal: ' . $e->getMessage(), [
//             'file' => $e->getFile(),
//             'line' => $e->getLine(),
//             'trace' => $e->getTraceAsString()
//         ]);

//         echo "data: " . json_encode(['type' => 'error', 'message' => "Terjadi Kesalahan: $detailError"]) . "\n\n";
//         flush();
//     }

// }, 200, [
//     'Content-Type' => 'text/event-stream',
//     'Cache-Control' => 'no-cache, must-revalidate',
//     'Connection' => 'keep-alive',
//     'X-Accel-Buffering' => 'no',
// ]);
//     }


}
