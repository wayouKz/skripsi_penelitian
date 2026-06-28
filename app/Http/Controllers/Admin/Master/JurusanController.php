<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use App\Models\MJurusan;
use Illuminate\Http\Request;

class JurusanController extends Controller
{
    public function getJurusan()
    {
     $jurusan = MJurusan::get();

     return response()->json([
        'status' => 'success',
        'data' => $jurusan
     ]);
    }

    public function store(Request $request){
        $request->validate([
            'nama_jurusan' => 'required',
        ]);

        $storeJurusan = MJurusan::create([
            'nama_jurusan' => $request->nama_jurusan,
        ]);

        if($storeJurusan){
            return redirect()->back()->with('success', 'Data jurusan berhasil disimpan');
        }else{
            return redirect()->back()->with('error', 'Data jurusan gagal disimpan');
        }
    }

    public function update(Request $request){
        $request->validate([
            'nama_jurusan' => 'required',
        ]);

        $updateJurusan = MJurusan::where('id', $request->id)->update([
            'nama_jurusan' => $request->nama_jurusan,
        ]);

        if($updateJurusan){
            return redirect()->back()->with('success', 'Data jurusan berhasil diupdate');
        }else{
            return redirect()->back()->with('error', 'Data jurusan gagal diupdate');
        }
    }

    public function destroy(Request $request){
        $destroyJurusan = MJurusan::where('id', $request->id)->delete();
        $json = [];
        if($destroyJurusan){
        $json = [
            'success' => true,
            'message' => 'Data jurusan berhasil dihapus'
        ];
        }else{
        $json = [
            'success' => false,
            'message' => 'Data jurusan gagal dihapus'
        ];
        }
        return response()->json($json);
    }
}
