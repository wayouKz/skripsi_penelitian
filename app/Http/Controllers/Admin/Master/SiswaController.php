<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use App\Models\TAlumni;
use App\Models\WAHYU\MSiswa;
use App\Models\WAHYU\TListSiswa;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SiswaController extends Controller
{
    public function index(){
        return Inertia::render('Admin/Master/Siswa/Siswa');
    }

    public function store(Request $request){
        $request->validate([
           'nisn' => 'required|numeric',
           'nama_siswa' => 'required',
           'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
           'tempat_lahir' => 'required',
           'tanggal_lahir' => 'required',
           'alamat' => 'required',
           'no_telp' => 'required|numeric',
           'no_telp_orang_tua' => 'required|numeric',
        ]);

        $foto = $request->file('foto');

        if($foto){
            $foto_name = $foto->getClientOriginalName();
            $foto->storeAs('public/foto', $foto_name);
        }else{
            $foto_name = null;
            // return redirect()->route('master.siswa.index')->with('error', 'Foto Tidak Boleh Kosong');
        }

        $siswa = MSiswa::create([
            'nisn' => $request->nisn,
            'nama_siswa' => $request->nama_siswa,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_telp' => $request->no_telp,
            'no_telp_orang_tua' => $request->no_telp_orang_tua,
            'foto' => $foto_name
        ]);

        if($siswa){
            return redirect()->route('master.siswa.index')->with('success', 'Data Berhasil Ditambahkan');
        } else {
            return redirect()->route('master.siswa.index')->with('error', 'Data Gagal Ditambahkan');
        }
    }

    public function getSiswa(){
        $siswa = MSiswa::get();
        if($siswa){
            return response()->json([
                'success' => true,
                'data' => $siswa
            ]);
        }else if(!$siswa){
            return response()->json([
                'success' => false,
                'message' => 'Data Tidak Ditemukan'
            ]);
        }
    }

    public function update(Request $request){
        $request->validate([
            'nisn' => 'required|numeric',
            'nama_siswa' => 'required',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'tempat_lahir' => 'required',
            'tanggal_lahir' => 'required',
            'alamat' => 'required',
            'no_telp' => 'required|numeric',
            'no_telp_orang_tua' => 'required|numeric',
        ]);

        $siswa = MSiswa::where('id', $request->id)->first();

        if(!$siswa){
            return redirect()->route('master.siswa.index')->with('error', 'Data Tidak Ditemukan');
        }

        $foto = $request->file('foto');

        if($foto){
            $foto_name = $foto->getClientOriginalName();
            $foto->storeAs('public/foto', $foto_name);
        }else{
            $foto_name = null;
            // return redirect()->route('master.siswa.index')->with('error', 'Foto Tidak Boleh Kosong');
        }

        $siswa->update([
            'nama_siswa' => $request->nama_siswa,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_telp' => $request->no_telp,
            'no_telp_orang_tua' => $request->no_telp_orang_tua,
            'foto' => $foto_name
        ]);

        if($siswa){
            return redirect()->route('master.siswa.index')->with('success', 'Data Berhasil Diupdate');
        } else {
            return redirect()->route('master.siswa.index')->with('error', 'Data Gagal Diupdate');
        }
    }

    public function destroy($id){
        $siswa = MSiswa::where('id', $id)->first();

        if(!$siswa){
            return response()->json([
                'success' => false,
                'message' => 'Data Tidak Ditemukan'
            ],200);
        }

        $siswa->delete();

        if($siswa){
        return response()->json([
            'success' => true,
            'message' => 'Data Berhasil Dihapus'
        ],200);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Data Gagal Dihapus'
            ],200);
        }
    }

  public function mappingKelasSiswa(Request $request) {
    DB::beginTransaction();
    try {
        $payload = $request->payload;

        // Variabel untuk melacak siswa dan kelas yang disinkronisasi
        $semuaNisnMapped = [];
        $semuaKelasID = [];
        $tahunAjaranGlobal = null;

        foreach ($payload as $index => $value) {
            $kelasID = $value['kelas_id'];
            $tahunAjaran = $value['tahun_ajaran'];
            $siswa = $value['siswa_ids'];

            $semuaKelasID[] = $kelasID;
            $tahunAjaranGlobal = $tahunAjaran; // Simpan untuk fungsi delete di bawah

            foreach ($siswa as $s) {
                // Kumpulkan semua NISN yang ditarik ke dalam kelas
                $semuaNisnMapped[] = $s['nisn'];
                // updateOrCreate:
                // Cari data berdasarkan [tahun_ajaran_id, nisn]
                // Jika ketemu -> Update kelas_id (Berguna jika siswa DIPINDAHKAN antar kelas)
                // Jika tidak ketemu -> Create data baru
                TListSiswa::updateOrCreate(
                    [
                        'tahun_ajaran_id' => $tahunAjaran,
                        'nisn' => $s['nisn']
                    ],
                    [
                        'kelas_id' => $kelasID,
                        'nama_siswa' => $s['nama_siswa'] ?? null,
                        // Gunakan null coalescing (??) agar tidak error jika dari frontend tidak dikirim
                    ]
                );
            }
        }

        // FUNGSI PEMBERSIH (HAPUS SISWA YANG DIKELUARKAN DARI KELAS)
        // Cari siswa di tahun ajaran & kelas tersebut yang NISN-nya TIDAK ADA di payload
        if ($tahunAjaranGlobal && count($semuaKelasID) > 0) {
            TListSiswa::where('tahun_ajaran_id', $tahunAjaranGlobal)
                ->whereIn('kelas_id', $semuaKelasID)
                ->whereNotIn('nisn', $semuaNisnMapped)
                ->delete();
        }

        DB::commit();

        return response()->json([
            'msg'     => 'Data pemetaan kelas berhasil disimpan',
            'success' => true
        ], 200);

    } catch(Exception $e) {
        DB::rollBack();
        return response()->json([
            'msg'     => 'Gagal menyimpan data: ' . $e->getMessage(),
            'success' => false
        ], 500);
    }
  }

  public function prosesKenaikan(Request $request)
{
    // Validasi input
    $request->validate([
        'tahun_ajaran_tujuan_id' => 'required',
        'siswa_ids'              => 'required|array',
    ]);

    DB::beginTransaction();
    try {
        $taTujuan    = $request->tahun_ajaran_tujuan_id;
        $kelasTujuan = $request->kelas_tujuan_id;
        $siswaList   = $request->siswa_ids; // Array dari [{nisn, nama_siswa}]
        $tahunAjaranAsal = $request->tahun_ajaran_asal_id;
        // 1. Jika Kelas Tujuan adalah "LULUS"
       if (is_null($kelasTujuan) || $kelasTujuan === 'LULUS') {
            foreach ($siswaList as $siswa) {
                // Update status di tabel t_list_siswas agar tidak lagi muncul di mapping kelas
                TListSiswa::where('nisn', $siswa['nisn'])
                    ->update(['status' => 'alumni']);
                TAlumni::updateOrCreate([
                    'lulus_tahun_ajaran' => $tahunAjaranAsal,
                    'nisn'            => $siswa['nisn'],
                ]);
            }
        }
        // 2. Jika Kelas Tujuan adalah Kelas Baru (Naik Tingkat)
        else {
            foreach ($siswaList as $siswa) {
                // Gunakan updateOrCreate untuk memindahkan siswa
                // Kuncinya adalah kombinasi tahun_ajaran_id + nisn
                TListSiswa::updateOrCreate(
                    [
                        'tahun_ajaran_id' => $taTujuan,
                        'nisn'            => $siswa['nisn']
                    ],
                    [
                        'kelas_id'   => $kelasTujuan,
                        'nama_siswa' => $siswa['nama_siswa'],
                        'status'     => 'siswa_aktif', // Set status menjadi Aktif di tahun ajaran baru
                    ]
                );
            }
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'msg'     => $kelasTujuan === 'LULUS'
                         ? 'Siswa telah berhasil diluluskan.'
                         : 'Kenaikan kelas berhasil diproses.'
        ], 200);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'msg'     => 'Terjadi kesalahan: ' . $e->getMessage()
        ], 500);
    }
}
}