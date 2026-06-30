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

    // Injeksi data prioritas ke objek guruMapels agar mudah dibaca di Service
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
        // Kita kirim $prioritasPagi sebagai array ke service
        $gaEngine = new GeneticAlgorithmService($params, $guruMapels, $kelas, $prioritasPagi);

        $gaEngine->onGenerationComplete = function($generasi, $fitness) {
            echo "data: " . json_encode([
                'type' => 'progress',
                'generation' => $generasi,
                'fitness' => $fitness
            ]) . "\n\n";
            if (ob_get_level() > 0) ob_flush(); flush();
        };

        $hasil = $gaEngine->generate();

        if (!empty($hasil['jadwal'])) {
            DB::beginTransaction();
            try {
                DB::table('t_jadwals')->where('tahun_ajaran_id', $params['tahun_ajaran_id'])->delete();

                $insertData = [];
                $kodeJadwalMap = [];
                foreach ($hasil['jadwal'] as $gen) {
                    $kunci = $gen['kelas_id'] . '_' . $gen['mapel_id'];
                    if (!isset($kodeJadwalMap[$kunci])) $kodeJadwalMap[$kunci] = 'JDW-' . Str::random(6);

                    $insertData[] = [
                        'kode_jadwal' => $kodeJadwalMap[$kunci],
                        't_list_guru_mapel_id' => $gen['t_list_guru_mapel_id'],
                        'mapel_id' => $gen['mapel_id'],
                        'kelas_id' => $gen['kelas_id'],
                        'hari' => $gen['hari'],
                        'jam_mulai' => $gen['jam_mulai'],
                        'jam_selesai' => $gen['jam_selesai'],
                        'tahun_ajaran_id' => $params['tahun_ajaran_id'],
                        'created_at' => now(), 'updated_at' => now()
                    ];
                }
                DB::table('t_jadwals')->insert($insertData);
                DB::commit();
                echo "data: " . json_encode(['type' => 'done', 'message' => 'Berhasil!']) . "\n\n";
            } catch (\Exception $e) {
                DB::rollBack();
                echo "data: " . json_encode(['type' => 'error', 'message' => $e->getMessage()]) . "\n\n";
            }
        }
    }, 200, ['Content-Type' => 'text/event-stream', 'Cache-Control' => 'no-cache', 'Connection' => 'keep-alive']);
    }
}
