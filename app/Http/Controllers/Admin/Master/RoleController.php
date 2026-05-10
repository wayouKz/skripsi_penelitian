<?php

namespace App\Http\Controllers\Admin\Master;

use Psy\Util\Str;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Http\Controllers\Controller;
use App\Models\TListFeatureByRole;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Master/Role/HakAkses');
    }

    public function getRole(Request $request){
     $data = Role::with('listFeatures')->get();



        if($data->isEmpty()){
            $json = ["data" => $data, "success" => false];
        }else{
            $json = ["data" => $data, "success" => true];
        }
        return  response()->json($json);
    }

    public function updateStatus(Request $request){
        $data = Role::GetRoleById($request->id);
        if($data){
            $data->update([
                'status' => (string) $request->status
            ]);
            $json = ["data" => $data, "success" => true];
        }else{
            $json = ["data" => $data, "success" => false, "message" => "Data tidak ditemukan"];
        }
        return  response()->json($json);
    }

    public function store(Request $request){
        $request->validate([
            'nama_roles' => 'required',
        ],[
            'nama_roles.required' => 'Nama role harus diisi',
        ]);

        $ArrayIdFeature = $request->activeMenu;
        if(empty($ArrayIdFeature)){
            return redirect()->back()->with('error', 'Feature harus setidaknya satu yang di pilih');
        }
        $storeRole = Role::create([
            'nama_roles' => $request->nama_roles,
            'status' => 'active'
        ]);

        if($storeRole){
            foreach($ArrayIdFeature as $index => $value){
             $storeFeature =   TListFeatureByRole::create([
                    'list_feature_id' => $index,
                    'role_id' => $storeRole->id,
                ]);
            }
            if($storeFeature){
                return redirect()->back()->with('success', 'Data feature dan peran berhasil disimpan');
            }else{
                return redirect()->back()->with('error', 'Data feature dan peran gagal disimpan');
            }
        }else{
            return redirect()->back()->with('error', 'Data Role gagal disimpan');
        }

    }

 public function update(Request $request)
{
    $request->validate([
        'nama_roles' => 'required',
    ], [
        'nama_roles.required' => 'Nama role harus diisi',
    ]);

    $role = Role::find($request->id);

    if (!$role) {
        return redirect()->back()->with('error', 'Role tidak ditemukan');
    }

    // ❌ Protect default role
    if ($role->id == 1) {
        return redirect()->back()->with('error', 'Data ini secara default tidak bisa di edit dan di hapus');
    }

    // ambil feature id dari frontend
    $featureIds = collect($request->activeMenu ?? [])
        ->filter(fn($val) => $val)
        ->keys()
        ->toArray();

    // 🔥 SYNC PIVOT (INI INTI OPTIMASI)
    $role->listFeatures()->sync($featureIds);

    // update role
    $role->update([
        'nama_roles' => $request->nama_roles,
    ]);

    return redirect()->back()->with('success', 'Data berhasil disimpan');
}

        public function delete(Request $request)
    {
        $role = Role::find($request->id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak ditemukan'
            ]);
        }

        if ($role->id == 1) {
            return response()->json([
                'success' => false,
                'message' => 'Role default tidak bisa dihapus'
            ]);
        }

        // 🔥 hapus pivot sekaligus (lebih cepat)
        $role->listFeatures()->detach();

        // hapus role
        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role berhasil dihapus'
        ]);
    }
}