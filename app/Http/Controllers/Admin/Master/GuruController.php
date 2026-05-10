<?php

namespace App\Http\Controllers\Admin\Master;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\WAHYU\MGuru;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class GuruController extends Controller
{
    public function index(){
        return Inertia::render('Admin/Master/Guru/Guru');
    }

    public function getGuru(){
        $data = MGuru::GetAllGuru()->get();
        if($data->isEmpty()){
            $json = [
                'data' => $data,
                'success' => false
            ];
        }else{
            $json = [
                'data' => $data,
                'success' => true
                ];
                }
        return response()->json($json);
    }

    public function store(Request $request){
        $request->validate([
            'nip' => 'required|numeric',
            'nama_guru' => 'required',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'tempat_lahir' => 'required',
            'tanggal_lahir' => 'required',
            'alamat' => 'required',
            'no_telp' => 'required|numeric',
        ],[
            'nip.required' => 'NIP Tidak Boleh Kosong',
            'nip.numeric' => 'NIP Harus Angka',
            'nama_guru.required' => 'Nama Guru Tidak Boleh Kosong',
            'jenis_kelamin.required' => 'Jenis Kelamin Tidak Boleh Kosong',
            'tempat_lahir.required' => 'Tempat Lahir Tidak Boleh Kosong',
            'tanggal_lahir.required' => 'Tanggal Lahir Tidak Boleh Kosong',
            'alamat.required' => 'Alamat Tidak Boleh Kosong',
            'no_telp.required' => 'No Telp Tidak Boleh Kosong',
            'no_telp.numeric' => 'No Telp Harus Angka',
            'jenis_kelamin.in' => 'Jenis Kelamin Harus Laki-Laki atau Perempuan',
        ]);
    $RoleGuru = Role::where('nama_roles', 'Guru')->first()->id ?? null;
   if($RoleGuru == null){
            return redirect()->route('master.guru.index')->with('error', 'Data Guru Gagal Ditambahkan dikarenakan Role Guru Tidak Ditemukan');
        }

        $data = [
            'nip' => $request->nip,
            'nama_guru' => $request->nama_guru,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_telp' => $request->no_telp,
        ];

        $result = MGuru::create($data);

        $DataPengguna = [
            'name' => $request->nama_guru,
            'username' => $request->nip,
            'password' => $request->nip,
            'nip' => $request->nip,
          'role_id' => $RoleGuru,
        ];
        $StorePengguna = User::create($DataPengguna);
        if($result){
            return redirect()->route('master.guru.index')->with('success', 'Data Guru Berhasil Ditambahkan');
        }else{
            return redirect()->route('master.guru.index')->with('error', 'Data Guru Gagal Ditambahkan');
        }
    }

    public function updateStatus(Request $request){
        $data = MGuru::GetGuruByNip($request->nip);
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



public function update(Request $request)
{
    $request->validate([
        'id'              => 'required',
        'nip'             => 'required',
        'nama_guru'       => 'required',
        'jenis_kelamin'   => 'required',
        'tempat_lahir'    => 'required',
        'tanggal_lahir'   => 'required',
        'alamat'          => 'required',
        'no_telp'         => 'required',
    ]);

    DB::beginTransaction();

    try {

        $data = MGuru::find($request->id);

        if (!$data) {
            return redirect()
                ->route('master.guru.index')
                ->with('error', 'Data Guru Tidak Ditemukan');
        }

        $roleGuru = Role::where('nama_roles', 'Guru')->first();

        if (!$roleGuru) {
            return redirect()
                ->route('master.guru.index')
                ->with('error', 'Role Guru Tidak Ditemukan');
        }

        // simpan nip lama
        $oldNip = $data->nip;

        // update data guru
        $data->update([
            'nip'             => $request->nip,
            'nama_guru'       => $request->nama_guru,
            'jenis_kelamin'   => $request->jenis_kelamin,
            'tempat_lahir'    => $request->tempat_lahir,
            'tanggal_lahir'   => $request->tanggal_lahir,
            'alamat'          => $request->alamat,
            'no_telp'         => $request->no_telp,
        ]);

        $user = User::where('nip', (string) $oldNip);
        if ($user) {
            $user->update([
                'name'      => $request->nama_guru,
                'username'  => $request->nip,
                'nip'       => $request->nip,
                'role_id'   => $roleGuru->id,
            ]);
        }else{
            return redirect()
                ->route('master.guru.index')
                ->with('error', 'Data Guru Tidak Ditemukan');
        }

        DB::commit();

        return redirect()
            ->route('master.guru.index')
            ->with('success', 'Data Guru Berhasil Diubah');

    } catch (\Exception $e) {

        DB::rollBack();

        return redirect()
            ->route('master.guru.index')
            ->with('error', $e->getMessage());
    }
}

    public function destroy($id){
        $data = MGuru::find($id);
        if($data){
            $user = User::where('nip', $data->nip);
            $json = [];
            if($user){
                $data->delete();
                $user->delete();
               $json = ["msg" => "Data Guru Berhasil Dihapus", "success" => true];
            }else{
                $json = ["data" => "Data Guru Gagal Dihapus", "success" => false];
            }
            return response()->json($json);
        }
    }
}
