<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class TListSiswa extends Model
{
    protected $guarded = ['id'];

    public static function getSiswaByTahunAjaran($tahunAjaran,$kelasId){
        $data = TListSiswa::leftJoin('m_siswas', 't_list_siswas.siswa_id', '=', 'm_siswas.id')
        ->where('t_list_siswas.kelas_id', $kelasId)
        ->where('t_list_siswas.tahun_ajaran_id', $tahunAjaran)
        ->select(
            'm_siswas.nisn',
            'm_siswas.nama_siswa',
            'm_siswas.id as siswa_id',
            'm_siswas.jenis_kelamin',
            'm_siswas.tempat_lahir',
            'm_siswas.tanggal_lahir',
            't_list_siswas.kelas_id'
        )
        ->get();
        return $data;
    }

    public static function getWaliKelas($tahunAjaran){
        $data = TListSiswa::select(
        'm_siswas.nisn',
        'm_siswas.nama_siswa',
        'm_siswas.jenis_kelamin',
        't_list_siswas.kelas_id',
        'm_kelas.nama_kelas'
    )
    ->leftJoin('m_siswas', 't_list_siswas.siswa_id', '=', 'm_siswas.id')
    ->leftJoin('m_kelas', 't_list_siswas.kelas_id', '=', 'm_kelas.id')
    ->where('m_kelas.id_wali_kelas', Auth::user()->guru->id)
    ->where('t_list_siswas.tahun_ajaran_id', $tahunAjaran)
    ->get();
    return $data;
    }
}
