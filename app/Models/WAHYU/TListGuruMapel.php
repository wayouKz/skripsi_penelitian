<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class TListGuruMapel extends Model
{
    protected $guarded = ['id'];

    public function GuruMapel()
    {
        return $this->belongsTo(MGuru::class, 'nip', 'nip');
    }

    public static function MapelGuruKelas($kelasID, $tahunAjaran){
        $data = TListGuruMapel::select(
            'm_mapels.nama_mapel',
                'm_mapels.kode_mapel',
                't_jadwals.kode_jadwal',
        )
        ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
        ->leftJoin('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
        ->join('t_jadwals', 't_list_guru_mapels.id', '=', 't_jadwals.t_list_guru_mapel_id')
        ->where('t_list_gurus.kelas_id', $kelasID)
        ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaran)
        ->where('t_list_gurus.nip', Auth::user()->nip)
        ->groupBy('t_jadwals.kode_jadwal' ,'m_mapels.nama_mapel', 'm_mapels.kode_mapel')
        ->get();
        return $data;
    }
}