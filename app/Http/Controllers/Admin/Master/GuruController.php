<?php

namespace App\Http\Controllers\Admin\Master;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\WAHYU\MGuru;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MMapel;
use App\Models\WAHYU\TListGuru;
use App\Models\WAHYU\TListGuruMapel;
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

    public function getWaliKelas(Request $request){
        if($request->kelas_id == "all" || $request->kelas_id == null){
            $data = MKelas::with('waliKelas')
            ->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id')
            ->get();
        }else{
            $data = MKelas::with('waliKelas')->where('m_kelas.id', $request->kelas_id)
            ->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id')
            ->get();
        }
        $json = [];
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
public function mappingGuruMapel(Request $request)
    {
        DB::beginTransaction();
        try {
            $payload = $request->payload;
            $tahunAjaran = $request->tahun_ajaran_id;

            foreach ($payload as $value) {
                $mapel_id = $value['mapel_id'];
                $guru_input = $value['gurus'];

                // Array untuk menampung ID dari t_list_guru_mapels yang ada di UI
                $pivot_dipertahankan = [];

                foreach ($guru_input as $g) {
                    $nip       = $g['guru_id'];
                    $kelas_id  = $g['kelas_id'];
                    $beban_jam = $g['beban_jam'];

                    // 1. Cari atau Buat Data Induk Penempatan Guru (t_list_gurus)
                    $listGuru = TListGuru::firstOrCreate(
                        [
                            'nip'      => $nip,
                            'kelas_id' => $kelas_id
                        ],
                        [
                            'tahun_ajaran_id' => $tahunAjaran
                        ]
                    );

                    // 2. Cek apakah mapping guru-mapel-kelas ini sudah ada (t_list_guru_mapels)
                    $cekTable = TListGuruMapel::where('t_list_guru_id', $listGuru->id)
                                ->where('mapel_id', $mapel_id)
                                ->first();

                    if ($cekTable) {
                        // Update beban jam jika sudah ada
                        $cekTable->update([
                            'beban_jam' => $beban_jam
                        ]);
                        // Catat ID pivot ini agar tidak ikut terhapus
                        $pivot_dipertahankan[] = $cekTable->id;
                    } else {
                        // Simpan baru jika belum ada
                        $baru = TListGuruMapel::create([
                            'nip'            => $nip,
                            't_list_guru_id' => $listGuru->id,
                            'mapel_id'       => $mapel_id,
                            'beban_jam'      => $beban_jam
                        ]);
                        $pivot_dipertahankan[] = $baru->id;
                    }
                }

                // --- 🌟 PERBAIKAN: PROSES PENGHAPUSAN (DELETE) 🌟 ---

                // 3a. Kumpulkan ID dari t_list_guru_mapels yang AKAN DIHAPUS
                $queryHapus = TListGuruMapel::where('mapel_id', $mapel_id);

                if (!empty($pivot_dipertahankan)) {
                    $queryHapus->whereNotIn('id', $pivot_dipertahankan);
                }

                // Ambil daftar ID-nya dalam bentuk array
                $idsYangAkanDihapus = $queryHapus->pluck('id');

                if ($idsYangAkanDihapus->isNotEmpty()) {
                    // 3b. HAPUS ANAKNYA DULU DI TABEL JADWAL
                    // Menggunakan DB::table untuk menghindari error jika model TJadwal belum di-import
                    DB::table('t_jadwals')->whereIn('t_list_guru_mapel_id', $idsYangAkanDihapus)->delete();

                    // 3c. SETELAH JADWAL AMAN, BARU HAPUS INDUKNYA
                    TListGuruMapel::whereIn('id', $idsYangAkanDihapus)->delete();
                }
            }

            DB::commit();

            return response()->json([
                'msg'     => 'Data mapping berhasil disinkronisasi',
                'success' => true
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'msg'     => 'Gagal menyimpan data: ' . $e->getMessage(),
                'success' => false
            ], 500);
        }
    }

public function DataGuruMapel()
    {
        $data = MMapel::leftJoin('t_list_guru_mapels', 'm_mapels.id', '=', 't_list_guru_mapels.mapel_id')
            // 1. Tambahkan JOIN ke tabel t_list_gurus untuk mendapatkan kelas_id
            ->leftJoin('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
            // 2. Ambil data guru menggunakan nip dari tabel t_list_gurus
            ->leftJoin('m_gurus as guru', 'guru.nip', '=', 't_list_gurus.nip')
            ->select(
                'm_mapels.id',
                'm_mapels.nama_mapel',
                'm_mapels.kode_mapel',
                'guru.id as guru_id',
                'guru.nama_guru',
                'guru.nip',
                't_list_guru_mapels.beban_jam',
                't_list_guru_mapels.id as unique_id', // ID unik pivot (penting untuk React Dnd-Kit)
                't_list_gurus.kelas_id'               // Ambil kelas_id
            )
            ->get()
            ->groupBy('id')
            ->map(function ($items) {
                return [
                    'id'         => $items->first()->id,
                    'mapel'      => $items->first()->nama_mapel,
                    'kode_mapel' => $items->first()->kode_mapel,
                    'guru'       => $items->filter(function ($item) {
                                        return !empty($item->nama_guru);
                                    })->map(function ($item) {
                                        return [
                                            // Sisipkan ID unik ini agar bisa dipakai di front-end
                                            'id'        => $item->unique_id,
                                            'value'     => $item->guru_id,
                                            'label'     => $item->nama_guru,
                                            'nip'       => $item->nip,
                                            'beban_jam' => $item->beban_jam ?? 0,
                                            'kelas_id'  => $item->kelas_id ?? '', // Lempar kelas_id ke JSON
                                        ];
                                    })
                                    ->values()
                                    ->toArray(),
                ];
            })
            ->values();
        // Logika IF bisa dipersingkat menjadi seperti ini:
        return response()->json([
            'data'    => $data,
            'success' => $data->isNotEmpty()
        ]);
    }
}
