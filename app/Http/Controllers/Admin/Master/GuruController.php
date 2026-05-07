<?php

namespace App\Http\Controllers\Admin\Master;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\WAHYU\MGuru;
use App\Http\Controllers\Controller;

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
            'jenis_kelamin' => 'required|in:Laki-Laki,Perempuan',
            'tempat_lahir' => 'required',
            'tanggal_lahir' => 'required',
            'alamat' => 'required',
            'no_telp' => 'required|numeric',
        ],[
            'nip.required' => 'NIP Tidak Boleh Kosong',
            'nama_guru.required' => 'Nama Guru Tidak Boleh Kosong',
            'jenis_kelamin.required' => 'Jenis Kelamin Tidak Boleh Kosong',
            'tempat_lahir.required' => 'Tempat Lahir Tidak Boleh Kosong',
            'tanggal_lahir.required' => 'Tanggal Lahir Tidak Boleh Kosong',
            'alamat.required' => 'Alamat Tidak Boleh Kosong',
            'no_telp.required' => 'No Telp Tidak Boleh Kosong',
            'no_telp.numeric' => 'No Telp Harus Angka',
            'nip.numeric' => 'NIP Harus Angka',
            'jenis_kelamin.in' => 'Jenis Kelamin Harus Laki-Laki atau Perempuan',
        ]);

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

    public function update(Request $request){
        $data = MGuru::GetGuruByNip($request->nip);
        if($data){
            $data->update([
                'nip' => $request->nip,
                'nama_guru' => $request->nama_guru,
                'jenis_kelamin' => $request->jenis_kelamin,
                'tempat_lahir' => $request->tempat_lahir,
                'tanggal_lahir' => $request->tanggal_lahir,
                'alamat' => $request->alamat,
                'no_telp' => $request->no_telp,
            ]);
            return redirect()->route('master.guru.index')->with('success', 'Data Guru Berhasil Diubah');
        }else{
            return redirect()->route('master.guru.index')->with('error', 'Data Guru Gagal Diubah');
        }
    }
}
