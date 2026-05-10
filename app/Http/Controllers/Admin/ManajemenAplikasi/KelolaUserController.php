<?php

namespace App\Http\Controllers\Admin\ManajemenAplikasi;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class KelolaUserController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ManajemenAplikasi/Kelola User/KelolaUser');
    }

    public function getUser(){
        $data = User::all();

        if($data->isEmpty()){
            $json = ["data" => $data, "success" => false];
        }else{
            $json = ["data" => $data, "success" => true];
        }
        return response()->json($json);
    }

    public function resetPassword(Request $request){
        $nip = $request->nip;

        $data = User::where('nip', $nip)->where('name', '!=', 'superadmin')->first();
        if($data){
            $data->update([
                'password' => Hash::make($nip)
            ]);
            $json = ["msg" => "Berhasil Mereset Password " . $data->name , "success" => true];
        }else{
            $json = ["msg" => "Gagal Mereset Password", "success" => false];
        }
        return response()->json($json);

    }

    public function update($id ,Request $request){
        $user = User::find($id);
        if($user){
            $user->update([
                'name' => $request->name,
                'username' => $request->username
            ]);
            return redirect()->back()->with('success', 'Data User Berhasil Diubah');
        }else{
            return redirect()->back()->with('error', 'Data User Tidak Ditemukan');
        }
    }
}