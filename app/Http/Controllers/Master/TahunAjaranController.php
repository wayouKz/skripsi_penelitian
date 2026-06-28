<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\WAHYU\MTahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TahunAjaranController extends Controller
{

    public function index(){
        return Inertia::render('Admin/Master/TahunAjaran/TahunAjaran');
    }

    public function getTahunAjaran(){
        $tahunAjaran = MTahunAjaran::orderBy('id', 'desc')->get();

        $json = [];

        if(!empty($tahunAjaran) && count($tahunAjaran) > 0){
            $json = [
                'data' => $tahunAjaran,
                'success' => true
            ];
        }else{
            $json = [
                'data' => $tahunAjaran,
                'success' => false
            ];
        }

        return response()->json($json);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tahun_ajaran' => 'required',
            'semester' => 'required'
        ]);

        // cek data duplikat
        $check = MTahunAjaran::where('tahun_ajaran', $request->tahun_ajaran)
            ->where('semester', $request->semester)
            ->first();

        if ($check) {
            return redirect()
                ->back()
                ->with('error', 'Data Tahun Ajaran Sudah Ada');
        }

        // ubah semua status menjadi nonactive
        MTahunAjaran::query()->update([
            'status' => 'nonactive'
        ]);

        // simpan data baru
        $storeTahunAjaran = MTahunAjaran::create([
            'tahun_ajaran' => $request->tahun_ajaran,
            'semester' => $request->semester,
            'status' => 'active'
        ]);

        if ($storeTahunAjaran && $storeTahunAjaran->exists) {
            return redirect()
                ->back()
                ->with('success', 'Data Tahun Ajaran Berhasil Disimpan');
        } else {
            return redirect()
                ->back()
                ->with('error', 'Data Tahun Ajaran Gagal Disimpan');
        }
    }

    public function update(Request $request){
        $id = $request->id;

        $updateTahunAjaran = MTahunAjaran::where('id', $id)->update([
            'tahun_ajaran' => $request->tahun_ajaran,
            'semester' => $request->semester
        ]);

        if ($updateTahunAjaran) {
            return redirect()
                ->back()
                ->with('success', 'Data Tahun Ajaran Berhasil Diubah');
        } else {
            return redirect()
                ->back()
                ->with('error', 'Data Tahun Ajaran Gagal Diubah');
        }
    }
}