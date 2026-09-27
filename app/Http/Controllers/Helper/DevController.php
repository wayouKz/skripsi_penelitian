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

    $sql = "SELECT DISTINCT
    mk.nama_kelas,
    tj1.hari,
    mg1.nama_guru AS guru_pertama,
    mm1.nama_mapel AS mapel_pertama,
    tj1.jam_mulai AS mulai_1,
    tj1.jam_selesai AS selesai_1,
    mg2.nama_guru AS guru_kedua,
    mm2.nama_mapel AS mapel_kedua,
    tj2.jam_mulai AS mulai_2,
    tj2.jam_selesai AS selesai_2
FROM t_jadwals tj1
-- Gabungkan dengan tabel yang sama untuk mencari bentrok di kelas & hari yang sama
INNER JOIN t_jadwals tj2
    ON tj1.kelas_id = tj2.kelas_id
    AND tj1.hari = tj2.hari
    AND tj1.kode_jadwal <> tj2.kode_jadwal -- Pastikan bukan blok jadwal yang sama
-- Logika irisan jam (overlapping time)
    AND tj1.jam_mulai < tj2.jam_selesai
    AND tj1.jam_selesai > tj2.jam_mulai
-- Join pendukung untuk menampilkan nama-nama yang mudah dibaca
INNER JOIN m_kelas mk ON mk.id = tj1.kelas_id
INNER JOIN t_list_guru_mapels tgm1 ON tgm1.id = tj1.t_list_guru_mapel_id
INNER JOIN t_list_gurus tg1 ON tg1.id = tgm1.t_list_guru_id
INNER JOIN m_gurus mg1 ON mg1.id = tg1.guru_id
INNER JOIN m_mapels mm1 ON mm1.id = tgm1.mapel_id

INNER JOIN t_list_guru_mapels tgm2 ON tgm2.id = tj2.t_list_guru_mapel_id
INNER JOIN t_list_gurus tg2 ON tg2.id = tgm2.t_list_guru_id
INNER JOIN m_gurus mg2 ON mg2.id = tg2.guru_id
INNER JOIN m_mapels mm2 ON mm2.id = tgm2.mapel_id
-- POSISI WHERE YANG BENAR: Diletakkan sebelum ORDER BY
WHERE tj1.tahun_ajaran_id = ?
ORDER BY
    mk.nama_kelas ASC,
    tj1.hari ASC,
    tj1.jam_mulai ASC;";

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

    public function cekJadwalPerMapel($mapelId){
        $data = DB::table('t_jadwals')
        ->join('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
        ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
        ->join('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
        ->join('m_gurus', 't_list_gurus.guru_id', '=', 'm_gurus.id')
        ->join('m_kelas', 't_jadwals.kelas_id', '=', 'm_kelas.id')
        ->join('m_tahun_ajarans', 't_jadwals.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
        ->where('t_jadwals.mapel_id', $mapelId)
        ->get();

        return view('dev.jadwalPerMapel', compact('data'));
    }

    public function ambilJadwal(){
        $sql = "SELECT
    t_jadwals.kode_jadwal,
    t_jadwals.t_list_guru_mapel_id,
    m_kelas.nama_kelas,
    m_gurus.nama_guru,
    m_mapels.nama_mapel,
    t_jadwals.hari,
    MIN(t_jadwals.jam_mulai) AS jam_mulai_blok,
    MAX(t_jadwals.jam_selesai) AS jam_selesai_blok,
    COUNT(*) AS jumlah_jam_pelajaran
FROM t_jadwals
INNER JOIN m_kelas ON m_kelas.id = t_jadwals.kelas_id
INNER JOIN t_list_guru_mapels ON t_list_guru_mapels.id = t_jadwals.t_list_guru_mapel_id
INNER JOIN t_list_gurus ON t_list_gurus.id = t_list_guru_mapels.t_list_guru_id
INNER JOIN m_gurus ON m_gurus.id = t_list_gurus.guru_id
INNER JOIN m_mapels ON m_mapels.id = t_list_guru_mapels.mapel_id
GROUP BY
    t_jadwals.kode_jadwal,
    m_kelas.nama_kelas,
    t_jadwals.t_list_guru_mapel_id,
    m_gurus.nama_guru,
    m_mapels.nama_mapel, -- Kolom ini ditambahkan ke GROUP BY
    t_jadwals.hari
ORDER BY
    m_kelas.nama_kelas ASC,
    t_jadwals.hari DESC,
    t_jadwals.kode_jadwal ASC;";

        $data = DB::select($sql);
        return response()->json([
            "data" => $data,
            "success" => true
        ]);
    }

    public function cekGuruMengajar(Request $request){
        $tahun_ajaran = $request->input('tahun_ajaran_id');
        $sql = "SELECT
    j1.hari,
    j1.jam_mulai,
    j1.jam_selesai,
    g.nama_guru AS nama_guru,
    k1.nama_kelas AS kelas_pertama,
    k2.nama_kelas AS kelas_kedua,
    mp1.nama_mapel AS mapel_di_kelas_pertama,
    mp2.nama_mapel AS mapel_di_kelas_kedua
FROM t_jadwals j1
INNER JOIN m_kelas k1 ON k1.id = j1.kelas_id
INNER JOIN t_list_guru_mapels tgm1 ON tgm1.id = j1.t_list_guru_mapel_id
INNER JOIN t_list_gurus tg1 ON tg1.id = tgm1.t_list_guru_id
INNER JOIN m_gurus g ON g.id = tg1.guru_id
INNER JOIN m_mapels mp1 ON mp1.id = tgm1.mapel_id

INNER JOIN t_jadwals j2 ON j2.hari = j1.hari
    AND j2.kelas_id <> j1.kelas_id
    AND j2.jam_mulai = j1.jam_mulai
INNER JOIN t_list_guru_mapels tgm2 ON tgm2.id = j2.t_list_guru_mapel_id
INNER JOIN t_list_gurus tg2 ON tg2.id = tgm2.t_list_guru_id AND tg2.guru_id = tg1.guru_id
INNER JOIN m_kelas k2 ON k2.id = j2.kelas_id
INNER JOIN m_mapels mp2 ON mp2.id = tgm2.mapel_id

-- Tambahkan pengecualian untuk mapel Penjaskes di sini
WHERE LOWER(mp1.nama_mapel) NOT LIKE '%penjaskes%'
  AND LOWER(mp1.nama_mapel) NOT LIKE '%olahraga%'
  AND LOWER(mp2.nama_mapel) NOT LIKE '%penjas%'
  AND LOWER(mp2.nama_mapel) NOT LIKE '%olahraga%'

GROUP BY
    j1.hari,
    j1.jam_mulai,
    j1.jam_selesai,
    g.nama_guru,
    k1.nama_kelas,
    k2.nama_kelas,
    mp1.nama_mapel,
    mp2.nama_mapel
ORDER BY
    j1.hari ASC,
    j1.jam_mulai ASC,
    g.nama_guru ASC;";

        $data = DB::select($sql);
        return response()->json([
            "data" => $data,
            "success" => true
        ]);
    }
}

