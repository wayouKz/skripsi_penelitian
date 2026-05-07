<?php

namespace App\Http\Controllers\Admin\ManajemenAplikasi;

use App\Http\Controllers\Controller;
use App\Models\List_Feature;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KelolaFiturAplikasiController extends Controller
{
    public function index(){
        $roles = Role::get();

        $list_fiture = List_Feature::GetFeatureWithRole($roles);
        return Inertia::render('Admin/ManajemenAplikasi/KelolaFiturAplikasi',compact('list_fiture','roles'));
    }

    public function update(Request $request){
        $list_fiture = List_Feature::find($request->id);
        if ($list_fiture->exists()) {
            $list_fiture->update([
                'icon' => $request->icon,
                'roles_id' => $request->roles_id,
                'deskripsi' => $request->deskripsi
            ]);
            $json = ['success' => true, 'message' => 'Data Berhasil Diubah'];
        }else{
            $json = ['success' => false, 'message' => 'Data Tidak Ditemukan'];
        }
        return response()->json($json);
    }
}
