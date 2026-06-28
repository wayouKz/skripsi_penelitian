<?php

namespace App\Http\Controllers\Akademik;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Helper\GetDataController;
use App\Models\WAHYU\MKelas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;

class KelasDiAmpuController extends Controller
{
    public function index(Request $request) {
        return inertia('Akademik/KelasDiAmpu/KelasDiAmpu');
    }

    public function show($id){
        $id = Crypt::decryptString($id);

        $dataKelas = MKelas::select(
            'm_kelas.id as kelas_id',
            'm_kelas.nama_kelas',
            'm_tahun_ajarans.tahun_ajaran',
            'm_tahun_ajarans.semester',
            'm_tahun_ajarans.id as tahun_ajaran_id',
            "perwalian.nama_guru as nama_perwalian",
        )->where('m_kelas.id', $id)
        ->leftJoin('t_list_gurus', 'm_kelas.id', '=', 't_list_gurus.kelas_id')
        ->leftJoin('m_gurus as perwalian', 'm_kelas.id_wali_kelas', '=', 'perwalian.id')
        ->leftJoin('m_tahun_ajarans', 't_list_gurus.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
        ->first();

        return inertia('Akademik/KelasDiAmpu/Detail', compact('dataKelas'));
    }


}
