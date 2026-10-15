<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class TListGuru extends Model
{
    protected $guarded = ['id'];


public static function getGuruPengampu($tahunAjaranId)
{
    $guruId = Auth::user()->guru->id;

    // QUERY 1: Ambil data utama guru pengampu kelas & mapel miliknya sendiri
    $data = TListGuru::select(
        't_list_gurus.id as list_guru_id',
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'perwalian.nama_guru as nama_perwalian',
        'perwalian.nip as nip_perwalian',
        'm_kelas.id as kelas_id',
        DB::raw('GROUP_CONCAT(DISTINCT m_mapels.nama_mapel SEPARATOR "||") as raw_mapel'),
        DB::raw('COUNT(DISTINCT t_list_siswas.siswa_id) as jumlah_siswa')
    )
    ->leftJoin('m_gurus', 't_list_gurus.nip', '=', 'm_gurus.nip')
    ->leftJoin('t_list_guru_mapels', 't_list_gurus.id', '=', 't_list_guru_mapels.t_list_guru_id')
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('m_kelas', 't_list_gurus.kelas_id', '=', 'm_kelas.id')
    ->leftJoin('m_gurus as perwalian', 'perwalian.id', '=', 'm_kelas.id_wali_kelas')
    ->leftJoin('t_list_siswas', 't_list_gurus.kelas_id', '=', 't_list_siswas.kelas_id')
    ->where('t_list_gurus.guru_id', $guruId)
    ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaranId)
    ->groupBy(
        't_list_gurus.id',
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'm_kelas.id',
        'perwalian.nama_guru',
        'perwalian.nip'
    )
    ->get();

    // QUERY 2: Ambil tambahan kelas/jadwal di mana guru ini bertindak sebagai guru pengganti
    $kelasPengganti = TListGuru::select(
        't_list_gurus.id as list_guru_id',
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'perwalian.nama_guru as nama_perwalian',
        'perwalian.nip as nip_perwalian',
        'm_kelas.id as kelas_id',
        DB::raw('GROUP_CONCAT(DISTINCT m_mapels.nama_mapel SEPARATOR "||") as raw_mapel'),
        DB::raw('COUNT(DISTINCT t_list_siswas.siswa_id) as jumlah_siswa')
    )
    ->join('t_list_guru_mapels', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
    ->join('t_jadwals', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->join('t_guru_penggantis', function($join) use ($guruId) {
        $join->on('t_guru_penggantis.kode_jadwal', '=', 't_jadwals.kode_jadwal')
             ->where('t_guru_penggantis.guru_id_pengganti', $guruId)
             ->where('t_guru_penggantis.status', 'diterima');
    })
    ->leftJoin('m_gurus', 't_list_gurus.nip', '=', 'm_gurus.nip')
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('m_kelas', 't_list_gurus.kelas_id', '=', 'm_kelas.id')
    ->leftJoin('m_gurus as perwalian', 'perwalian.id', '=', 'm_kelas.id_wali_kelas')
    ->leftJoin('t_list_siswas', 't_list_gurus.kelas_id', '=', 't_list_siswas.kelas_id')
    ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaranId)
    ->groupBy(
        't_list_gurus.id',
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'm_kelas.id',
        'perwalian.nama_guru',
        'perwalian.nip'
    )
    ->get();

    // Tandai status guru pengganti
    $kelasPengganti->each(function($item) {
        $item->gurupengganti = true;
    });

    $data->each(function($item) {
        $item->gurupengganti = false;
    });

    // Gabungkan data kelas sendiri dengan kelas pengganti
    $mergedData = $data->concat($kelasPengganti);

    // Mapping data di PHP
    return $mergedData->map(function ($item) {
        // Enkripsi ID kelas
        $item->kelas_id = Crypt::encryptString($item->kelas_id);

        // Pastikan properti gurupengganti ada
        $item->gurupengganti = $item->gurupengganti ?? false;

        // Proses pembentukan Array Mapel
        $mapelList = [];
        if ($item->raw_mapel) {
            $pecahMapel = explode('||', $item->raw_mapel);
            foreach ($pecahMapel as $mapel) {
                $mapelList[] = [
                    'nama_mapel' => $mapel
                ];
            }
        }

        $item->mapel = $mapelList;
        unset($item->raw_mapel);
        unset($item->list_guru_id);

        return $item;
    });
}
}