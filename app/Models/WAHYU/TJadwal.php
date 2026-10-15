<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class TJadwal extends Model
{
    protected $guarded = ['id'];

    public static function getJadwalByTahunAjaran($tahunAjaran){
      $data = TJadwal::select([
        't_jadwals.*',
        'm_gurus.nama_guru',
        'm_mapels.nama_mapel',
        'm_kelas.nama_kelas'
    ])
    ->leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->leftJoin('m_gurus', 't_list_guru_mapels.guru_id', '=', 'm_gurus.id')
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id') // Diambil dari t_list_guru_mapels
    ->leftJoin('m_kelas', 't_jadwals.kelas_id', '=', 'm_kelas.id')
    ->where('t_jadwals.tahun_ajaran_id', $tahunAjaran)
    ->orderBy('m_kelas.nama_kelas', 'asc')
    ->orderByRaw("FIELD(t_jadwals.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat')")
    ->orderBy('t_jadwals.jam_mulai', 'asc')
    ->get();

    return $data;
    }

    public static function cekJadwal($kelasId,$tahunAjaran,$jadwal,$hariIni,$jamSekarang){

        $data = TJadwal::where('kelas_id', $kelasId)
        ->where('tahun_ajaran_id', $tahunAjaran)
        ->where('kode_jadwal', $jadwal)
        ->where('hari', $hariIni)
        ->where('jam_mulai', '<=', $jamSekarang)
        ->where('jam_selesai', '>=', $jamSekarang)
        ->exists();
        return $data;
    }

public static function jadwalKelas($kelasID, $tahunAjaran, $mapel)
{
    $guruId = Auth::user()->guru->id;

    $data = TJadwal::select('t_jadwals.*','m_mapels.kode_mapel')
    ->leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->leftJoin('m_gurus', 't_list_guru_mapels.nip', '=', 'm_gurus.nip')
    ->leftJoin('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
    ->leftJoin('t_guru_penggantis', function($join) use ($guruId) {
        $join->on('t_jadwals.kode_jadwal', '=', 't_guru_penggantis.kode_jadwal')
             ->where('t_guru_penggantis.guru_id_pengganti', $guruId)
             ->where('t_guru_penggantis.status', 'diterima');
    })
    ->where('t_list_gurus.kelas_id', $kelasID)
    ->where('m_mapels.kode_mapel', $mapel)
    ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaran)
    ->where(function($query) use ($guruId) {
        // Bisa diakses jika dia guru pengampu asli ATAU guru pengganti yang disetujui
        $query->where('t_list_gurus.guru_id', $guruId)
              ->orWhere('t_guru_penggantis.guru_id_pengganti', $guruId);
    })
    ->get();

    return $data;
}


    public static function getJadwalByGuru($guruId, $tahunAjaran){
        $data = TJadwal::select([
            't_jadwals.*',
            'm_gurus.nama_guru',
            'm_mapels.nama_mapel',
            'm_kelas.nama_kelas'
        ])
        ->leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
        ->leftJoin('m_gurus', 't_list_guru_mapels.guru_id', '=', 'm_gurus.id') // Tambahan relasi ke tabel guru
        ->leftJoin('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
        ->leftJoin('m_kelas', 't_jadwals.kelas_id', '=', 'm_kelas.id')
        ->where('t_list_guru_mapels.guru_id', $guruId)
        ->where('t_jadwals.tahun_ajaran_id', $tahunAjaran)
        ->orderByRaw("FIELD(t_jadwals.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat')") // Wajib pakai orderByRaw untuk sintaks SQL native
        ->orderBy('t_jadwals.jam_mulai', 'asc')
        ->get();

        return $data;
    }

}
