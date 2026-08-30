<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class TListGuru extends Model
{
    protected $guarded = ['id'];


    public static function getGuruPengampu($tahunAjaranId){
       $data = TListGuru::select(
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'perwalian.nama_guru as nama_perwalian',
        'perwalian.nip as nip_perwalian',
        'm_kelas.id as kelas_id',

        // 1. TETAP gunakan GROUP_CONCAT agar SQL tidak error & kelas tidak duplikat
        DB::raw('GROUP_CONCAT(DISTINCT m_mapels.nama_mapel SEPARATOR "||") as raw_mapel'),

        DB::raw('COUNT(DISTINCT t_list_siswas.siswa_id) as jumlah_siswa')
    )
    ->leftJoin('m_gurus', 't_list_gurus.nip', '=', 'm_gurus.nip')
    ->leftJoin('t_list_guru_mapels', 't_list_gurus.id', '=', 't_list_guru_mapels.t_list_guru_id')
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('m_kelas', 't_list_gurus.kelas_id', '=', 'm_kelas.id')
    ->leftJoin('m_gurus as perwalian', 'perwalian.id', '=', 'm_kelas.id_wali_kelas')
    ->leftJoin('t_list_siswas', 't_list_gurus.kelas_id', '=', 't_list_siswas.kelas_id')
    ->where('m_gurus.nip', Auth::user()->nip)
    ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaranId)
    ->groupBy(
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'm_kelas.id',
        'perwalian.nama_guru',
        'perwalian.nip',

    )
    ->get()
    ->map(function ($item) {
        // Enkripsi ID
        $item->kelas_id = Crypt::encryptString($item->kelas_id);

        // 2. Proses pembentukan Array Mapel
        $mapelList = [];
        if ($item->raw_mapel) {
            $pecahMapel = explode('||', $item->raw_mapel);
            foreach ($pecahMapel as $mapel) {
                // Masukkan ke dalam format array of object yang Anda inginkan
                $mapelList[] = [
                    'nama_mapel' => $mapel
                ];
            }
        }

        // Assign ke properti mapel
        $item->mapel = $mapelList;

        // Bersihkan properti mentah agar response JSON rapi
        unset($item->raw_mapel);

        return $item;
    });

    return $data;
    }
}