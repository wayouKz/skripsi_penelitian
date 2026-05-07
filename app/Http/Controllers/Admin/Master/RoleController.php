<?php

namespace App\Http\Controllers\Admin\Master;

use Psy\Util\Str;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Http\Controllers\Controller;

class RoleController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Master/Role/HakAkses');
    }

    public function getRole(Request $request){
        $data = Role::GetRole()->get();

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

        $data = Role::create([
            'nama_roles' => $request->nama_roles,
            'status' => 'active'
        ]);
        if(!$data){
           return redirect()->back()->with('error', 'Data gagal disimpan');
        }else{
            return redirect()->back()->with('success', 'Data berhasil disimpan');
        }
    }

    public function update(Request $request){
        $request->validate([
            'nama_roles' => 'required',
        ],[
            'nama_roles.required' => 'Nama role harus diisi',
        ]);

        $data = Role::GetRoleById($request->id);
        if($data){
            $data->update([
                'nama_roles' => $request->nama_roles,
            ]);
          return redirect()->back()->with('success', 'Data berhasil disimpan');
        }else{
            return redirect()->back()->with('error', 'Data gagal disimpan');
        }
    }

    public function delete(Request $request){
        $data = Role::GetRoleById($request->id);
        if($data){
            $data->delete();
            return response()->json(['success' => true]);
        }else{
            return response()->json(['success' => false]);
        }
    }

}
