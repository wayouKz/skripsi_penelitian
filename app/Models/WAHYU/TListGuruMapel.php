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

 public static function MapelGuruKelas($kelasID, $tahunAjaran)
{
    $guruId = Auth::user()->guru->id;

    // Query 1: Mapel dari jadwal milik guru sendiri di kelas tersebut
    $mapelSendiri = TListGuruMapel::select(
        'm_mapels.id as mapel_id',
        'm_mapels.nama_mapel',
        'm_mapels.kode_mapel',
        't_jadwals.kode_jadwal'
    )
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
    ->join('t_jadwals', 't_list_guru_mapels.id', '=', 't_jadwals.t_list_guru_mapel_id')
    ->where('t_list_gurus.kelas_id', $kelasID)
    ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaran)
    ->where('t_list_gurus.guru_id', $guruId);

    // Query 2: Mapel dari jadwal di mana guru ini bertindak sebagai guru pengganti
    $mapelPengganti = TListGuruMapel::select(
        'm_mapels.id as mapel_id',
        'm_mapels.nama_mapel',
        'm_mapels.kode_mapel',
        't_jadwals.kode_jadwal'
    )
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
    ->join('t_jadwals', 't_list_guru_mapels.id', '=', 't_jadwals.t_list_guru_mapel_id')
    ->join('t_guru_penggantis', function($join) use ($guruId) {
        $join->on('t_guru_penggantis.kode_jadwal', '=', 't_jadwals.kode_jadwal')
             ->where('t_guru_penggantis.guru_id_pengganti', $guruId)
             ->where('t_guru_penggantis.status', 'diterima')
             ->where('t_guru_penggantis.tanggal_pergantian', date('Y-m-d'));
    })
    ->where('t_list_gurus.kelas_id', $kelasID)
    ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaran);

    // Gabungkan kedua query menggunakan UNION dan ambil hasilnya
    $data = $mapelSendiri->union($mapelPengganti)
        ->groupBy('m_mapels.id', 't_jadwals.kode_jadwal', 'm_mapels.nama_mapel', 'm_mapels.kode_mapel')
        ->get();

    return $data;
}
}
