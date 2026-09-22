<?php

namespace App\Http\Controllers\Helper;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DevController extends Controller
{
    // 1. Cek Bentrok Jadwal berdasarkan Tahun Ajaran
    public function cekBentrokJadwal(Request $request)
    {
        $tahunAjaranId = $request->input('tahun_ajaran_id', 1); // Default ke ID 1 jika tidak dikirim

        $sql = "SELECT j1.hari, j1.jam_mulai, g.nama_guru AS nama_guru, k1.nama_kelas AS kelas_1, k2.nama_kelas AS kelas_2
                FROM t_jadwals j1
                JOIN t_jadwals j2 ON j1.t_list_guru_mapel_id = j2.t_list_guru_mapel_id
                    AND j1.hari = j2.hari
                    AND j1.jam_mulai = j2.jam_selesai
                    AND j1.kelas_id <> j2.kelas_id
                JOIN t_list_guru_mapels gm ON j1.t_list_guru_mapel_id = gm.id
                JOIN t_list_gurus lg ON gm.t_list_guru_id = lg.id
                JOIN m_kelas k1 ON j1.kelas_id = k1.id
                JOIN m_kelas k2 ON j2.kelas_id = k2.id
                JOIN m_gurus g ON g.id = lg.guru_id
                WHERE j1.tahun_ajaran_id = ?;";

        $data = DB::select($sql, [$tahunAjaranId]);

        return response()->json([
            "data" => $data,
            "success" => true
        ]);
    }

    // 2. Cek Target Jam Mengajar Guru (Sudah ada filter tahun ajaran, dipastikan aman)
    public function cekTargetJamMengajar(Request $request)
    {
        $sql = "SELECT SUM(t_list_guru_mapels.beban_jam) AS total_beban_jam
                FROM t_list_gurus
                JOIN t_list_guru_mapels ON t_list_gurus.id = t_list_guru_mapels.t_list_guru_id
                WHERE t_list_gurus.nip = ? AND t_list_gurus.tahun_ajaran_id = ?;";

        $result = DB::select($sql, [$request->nip, $request->tahun_ajaran_id]);

        return response()->json([
            "data" => $result,
            "success" => true
        ]);
    }

    // 3. Cek Beban Jam Mengajar Per Kelas berdasarkan Tahun Ajaran
    public function cekBebanJamMengajarPerKelas(Request $request)
    {
        $tahunAjaranId = $request->input('tahun_ajaran_id', 1);

        $sql = "SELECT
                    k.nama_kelas,
                    COUNT(j.id) AS total_jam_terjadwal,
                    CASE
                        WHEN COUNT(j.id) = 57 THEN 'Lengkap (57 Jam)'
                        ELSE CONCAT('Belum Pas: ', COUNT(j.id), ' Jam')
                    END AS status_kapasitas
                FROM m_kelas k
                LEFT JOIN t_jadwals j ON k.id = j.kelas_id AND j.tahun_ajaran_id = ?
                GROUP BY k.id, k.nama_kelas
                ORDER BY k.nama_kelas ASC;";

        $result = DB::select($sql, [$tahunAjaranId]);

        return response()->json([
            "data" => $result,
            "success" => true
        ]);
    }
}
