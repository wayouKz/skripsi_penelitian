<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MGuru extends Model
{
    protected $guarded = ['id'];

    public static function GetAllGuru()
    {
        return MGuru::query();
    }

    public static function GetGuruByNip($nip)
    {
        return MGuru::where('nip', $nip)->first();
    }

    public function kelas()
    {
        return $this->hasOne(MKelas::class, 'id_wali_kelas', 'id');
    }

    public function listGuru(){
     $data =  $this->select(
        'm_gurus.id',
        'm_gurus.nama_guru',
        'm_gurus.nip',
        'm_mapels.id as mapel_id', // Beri alias agar tidak bentrok dengan id guru
        'm_mapels.nama_mapel',
        'm_mapels.kode_mapel'
    )
    ->where('m_gurus.status', 'active')
    ->leftJoin('t_list_guru_mapels', 'm_gurus.id', '=', 't_list_guru_mapels.guru_id')
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')

    ->get()
    ->groupBy('id')
    ->map(function ($items) {
        $first = $items->first();
        return [
            'id' => $first->id,
            'nip' => $first->nip,
            'nama_guru' => $first->nama_guru,
            'mapel' => $items->filter(function ($item) {
                return !is_null($item->mapel_id);
            })->map(function ($item) {
                return [
                    'id' => $item->mapel_id,
                    'nama_mapel' => $item->nama_mapel,
                    'kode_mapel' => $item->kode_mapel
                ];
            })->values()->all()
        ];
    })->values();
        return $data;
    }
}
