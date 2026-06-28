<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MMapel;
use App\Models\WAHYU\TListGuruMapel;
use Illuminate\Http\Request;
use Inertia\Inertia;
     use Illuminate\Support\Facades\DB;

class MapelController extends Controller
{
     public function index(){
        return Inertia::render('Admin/Master/Mapel/Mapel');
    }

    public function store(Request $request){
      $request->validate([
    'nama_mapel' => 'required|string',
]);
$namaMapel = $request->nama_mapel;

$awalan = '';
$pecahanKata = explode(' ', $namaMapel);

if (count($pecahanKata) > 1) {
    foreach ($pecahanKata as $kata) {
        $awalan .= strtoupper(substr($kata, 0, 1));
    }
} else {
    $awalan = strtoupper(substr($namaMapel, 0, 3));
}

        $cekMapel = MMapel::where('nama_mapel', $request->nama_mapel)->first();
        if($cekMapel){
            return redirect()->back()->with('error', 'Mapel sudah ada');
        }

        $kodeMapel = $awalan;

        $storeMapel = MMapel::create([
            'kode_mapel' => $kodeMapel,
            'nama_mapel' => $request->nama_mapel,
        ]);

        if($storeMapel){
            return redirect()->back()->with('success', 'Data mapel berhasil disimpan');
        }else{
            return redirect()->back()->with('error', 'Data mapel gagal disimpan');
        }
    }

    public function update(Request $request){
        $request->validate([
            'nama_mapel' => 'required',
        ]);

        $updateMapel = MMapel::where('id', $request->id)->update([
            'nama_mapel' => $request->nama_mapel,
        ]);

        if($updateMapel){
            return redirect()->back()->with('success', 'Data mapel berhasil diupdate');
        }else{
            return redirect()->back()->with('error', 'Data mapel gagal diupdate');
        }
    }

    public function getMapel(){
        $mapel = MMapel::orderBy('id', 'desc')->get();

        $json = [];
        if($mapel != null){
            $json = [
                'data' => $mapel,
                'success' => true
            ];
        }else{
            $json = [
                'data' => $mapel,
                'success' => false
            ];
        }
        return response()->json($json);
    }

    public function destroy($id){
        $data = MMapel::find($id);
        if($data){
            $data->delete();
            return response()->json([
                'success' => true,
                'message' => 'Data Berhasil Dihapus'
            ],200);
        }else{
            return response()->json([
                'success' => false,
                'message' => 'Data Gagal Dihapus'
            ],200);
        }
    }
}