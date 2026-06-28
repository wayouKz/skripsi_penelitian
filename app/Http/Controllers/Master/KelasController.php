<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MSiswa;
use App\Models\WAHYU\MTahunAjaran;
use App\Models\WAHYU\TListSiswa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KelasController extends Controller
{
     public function index(){
        return Inertia::render('Admin/Master/Kelas/Kelas');
    }

    public function getWaliKelas(){
        $waliKelas =  MGuru::with('kelas')->get();

        return response()->json([
            'status' => 'success',
            'data' => $waliKelas
        ]);
    }

    public function store(Request $request){
        $request->validate([
            'nama_kelas' => 'required',
            'id_wali_kelas' => 'required',
            'tingkat' => 'required',
        ]);

        $cekWaliKelas = MKelas::where('id_wali_kelas', $request->id_wali_kelas)->first();
        if($cekWaliKelas){
            return redirect()->back()->with('error', 'Wali kelas sudah ada');
        }
        $storeKelas = MKelas::create([
            'nama_kelas' => $request->nama_kelas,
            'id_wali_kelas' => $request->id_wali_kelas,
            'tingkat' => $request->tingkat,
            'jurusan_id' => $request->jurusan_id,
            'status' => 'active'
        ]);

        if($storeKelas){
            return redirect()->back()->with('success', 'Data kelas berhasil disimpan');
        }else{
            return redirect()->back()->with('error', 'Data kelas gagal disimpan');
        }
    }

    public function update(Request $request){
        $request->validate([
            'nama_kelas' => 'required',
            'id_wali_kelas' => 'required',
            'tingkat' => 'required',
        ]);

        $updateKelas = MKelas::where('id', $request->id)->update([
            'nama_kelas' => $request->nama_kelas,
            'id_wali_kelas' => $request->id_wali_kelas,
            'jurusan_id' => $request->jurusan_id,
            'tingkat' => $request->tingkat,
        ]);

        if($updateKelas){
            return redirect()->back()->with('success', 'Data kelas berhasil diupdate');
        }else{
            return redirect()->back()->with('error', 'Data kelas gagal diupdate');
        }
    }

    public function destroy(Request $request){
        $destroyKelas = MKelas::where('id', $request->id)->delete();
        $json = [];
        if($destroyKelas){
            $json = [
                'success' => true,
                'message' => 'Data kelas berhasil dihapus'
            ];
        }else{
            $json = [
                'success' => false,
                'message' => 'Data kelas gagal dihapus'
            ];
        }
        return response()->json($json);
    }
    public function getKelas(){
        $kelas = MKelas::select('m_kelas.*', 'm_jurusans.nama_jurusan')->with('waliKelas')->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id')->orderBy('tingkat', 'asc')->get();

        $json = [];

        if(!empty($kelas) && count($kelas) > 0){
            $json = [
                'data' => $kelas,
                'success' => true
            ];
        }else{
            $json = [
                'data' => $kelas,
                'success' => false
            ];
        }
        return response()->json($json);
    }

    public function mappingKelas($nama_kelas){
        $DataKelas = MKelas::with('waliKelas')->where('nama_kelas', $nama_kelas)->first();

        $DataTahunAjaran = MTahunAjaran::get();
        return Inertia::render('Admin/Master/Kelas/MappingKelas',compact('DataKelas','DataTahunAjaran'));
    }

    public function getSiswaPerTahunAjaran($id_tahun_ajaran, $kelas_id){
        $cekTahunAjaran = MTahunAjaran::where('id', $id_tahun_ajaran)->first();
        $json = [];
        if(!empty($cekTahunAjaran)){
            $list_siswa = TListSiswa::where('tahun_ajaran_id', $cekTahunAjaran->id)->where('kelas_id', $kelas_id)->get();
            $siswa = [];
            foreach($list_siswa as $key => $value){
                $siswa = MSiswa::where('id','!=', $value->siswa_id)->get();
            }
            $json = [
                'data' => [
                    'list_siswa_terdaftar' => $list_siswa,
                    'list_siswa' => $siswa
                ],
                'success' => true
            ];
        }else{
            $json = [
                'data' => [],
                'success' => false
            ];
        }

        return response()->json($json);
    }
}