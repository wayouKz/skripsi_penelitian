<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MMapel extends Model
{
    protected $guarded = ['id'];

    public function guruMapel()
    {
        return $this->hasMany(TListGuruMapel::class, 'mapel_id', 'id');
    }

    public  function mapGuruMapel($tahunAjaranId){
       $data =  $this->leftJoin('t_list_guru_mapels', 'm_mapels.id', '=', 't_list_guru_mapels.mapel_id')
    ->leftJoin('t_list_gurus', function ($join) use ($tahunAjaranId) {
        // PERBAIKAN 1: Join berdasarkan NIP DAN KELAS ID agar tidak cross-join (ganda)
        $join->on('t_list_guru_mapels.guru_id', '=', 't_list_gurus.guru_id');

        if (!empty($tahunAjaranId) && $tahunAjaranId != null) {
            $join->where('t_list_gurus.tahun_ajaran_id', $tahunAjaranId);
        } else {
            $join->whereRaw('1 = 0');
        }
    })
    ->leftJoin('m_gurus as guru', function ($join) {
        $join->on('t_list_gurus.guru_id', '=', 'guru.id');
        $join->where('guru.status', 'active');
    })
    ->leftJoin('m_kelas','m_kelas.id' , '=', 't_list_gurus.kelas_id')
    ->select(
        'm_mapels.id as id',
        'm_mapels.nama_mapel',
        'm_mapels.kode_mapel',
        'guru.id as guru_id',
        'guru.nama_guru',
        'guru.nip',
        't_list_guru_mapels.beban_jam',
        't_list_guru_mapels.id as unique_id',
        't_list_gurus.kelas_id',
        't_list_gurus.tahun_ajaran_id',
        'm_kelas.nama_kelas',
        'm_kelas.tingkat'
    )
    ->get()
    ->groupBy('id')
    ->map(function ($items) {
        return [
            'id'              => $items->first()->id,
            'mapel'           => $items->first()->nama_mapel,
            'kode_mapel'      => $items->first()->kode_mapel,
            'tahun_ajaran_id' => $items->first()->tahun_ajaran_id,
            'guru'            => $items->filter(function ($item) {
                                    return !empty($item->nama_guru);
                                })
                                // PERBAIKAN 2: Pastikan tidak ada duplikasi NIP di kelas yang sama
                                ->unique(function ($item) {
                                    return $item->guru_id . '-' . $item->kelas_id;
                                })
                                // 🌟 PERBAIKAN 3: Order by Nama Guru kemudian Nama Kelas
                              ->sortBy(function ($item) {
                                    return $item->nama_guru . '-' . $item->nama_kelas;
                                }, SORT_NATURAL)
                                ->map(function ($item) {
                                    return [
                                        'id'         => $item->unique_id,
                                        'nama'       => $item->nama_guru,
                                        'guru_id'    => $item->guru_id,
                                        'nip'        => $item->nip,
                                        'beban_jam'  => $item->beban_jam ?? 0,
                                        'kelas_id'   => $item->kelas_id ?? '',
                                        'nama_kelas' => $item->nama_kelas,
                                        'tingkat'    => $item->tingkat
                                    ];
                                })
                                ->values()
                                ->toArray(),
        ];
    })
    ->values();
        return $data;
    }
}