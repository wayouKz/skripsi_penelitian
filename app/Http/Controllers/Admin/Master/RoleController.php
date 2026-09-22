<?php

namespace App\Http\Controllers\Admin\Master;

use Psy\Util\Str;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Http\Controllers\Controller;
use App\Models\TListFeatureByRole;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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

public function store(Request $request)
{
    $request->validate([
        'nama_roles' => 'required',
    ], [
        'nama_roles.required' => 'Nama role harus diisi',
    ]);

    if (empty($request->activeMenu)) {
        return redirect()->back()->with('error', 'Feature harus setidaknya satu dipilih');
    }

    $syncData = [];
    foreach ($request->activeMenu as $featureId => $permission) {
        // Hanya simpan jika hak akses 'view' bernilai true/aktif
        if (isset($permission['can_view']) && $permission['can_view'] == true) {
            $syncData[$featureId] = [
                'can_view'   => true,
                'can_create' => isset($permission['can_create']),
                'can_update' => isset($permission['can_update']),
                'can_delete' => isset($permission['can_delete']),
            ];
        }
    }

    if (empty($syncData)) {
        return redirect()->back()->with('error', 'Feature harus setidaknya satu dipilih dengan akses View aktif');
    }

    // Menggunakan Transaction agar data Role & Pivot konsisten
    DB::transaction(function () use ($request, $syncData) {
        $storeRole = Role::create([
            'nama_roles' => $request->nama_roles,
            'status'     => 'active'
        ]);

        $storeRole->listFeatures()->sync($syncData);
    });

    return redirect()->back()->with('success', 'Data feature dan role berhasil disimpan');
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

    // Proteksi role default
    // if ($role->id == 1) {
    //     return redirect()->back()->with('error', 'Data default tidak bisa diubah');
    // }

    $syncData = [];
    foreach ($request->activeMenu ?? [] as $featureId => $permission) {
        // Hanya simpan jika hak akses 'view' bernilai true/aktif
        if (isset($permission['can_view']) && $permission['can_view'] == true) {
            $syncData[$featureId] = [
                'can_view'   => true,
                'can_create' => isset($permission['can_create']),
                'can_update' => isset($permission['can_update']),
                'can_delete' => isset($permission['can_delete']),
            ];
        }
    }

    // Menggunakan Transaction agar data Role & Pivot konsisten
    DB::transaction(function () use ($role, $request, $syncData) {
        // Update informasi role
        $role->update([
            'nama_roles' => $request->nama_roles,
        ]);

        // Sinkronisasi data ke tabel pivot (yang tidak masuk ke $syncData otomatis terhapus)
        $role->listFeatures()->sync($syncData);
    });

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
