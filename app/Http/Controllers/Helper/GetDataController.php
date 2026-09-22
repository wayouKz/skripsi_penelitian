<?php

namespace App\Http\Controllers\Helper;

use App\Exports\GuruCleanedExport;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Imports\GuruCleanedImport;
use App\Models\List_Feature;
use App\Models\TListFeatureByRole;
use App\Models\User;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MSiswa;
use App\Models\WAHYU\MTahunAjaran;
use App\Models\WAHYU\TAbsenGuru;
use App\Models\WAHYU\TAbsenSiswa;
use App\Models\WAHYU\TJadwal;
use App\Models\WAHYU\TListGuru;
use App\Models\WAHYU\TListGuruMapel;
use App\Models\WAHYU\TListSiswa;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

class GetDataController extends Controller
{

      protected function builder(string $tableName)
    {
        return DB::table($tableName);
    }
    public function getListFeatureByRole(Request $request){
        $data = TListFeatureByRole::GetFeatureByName($request->q, Auth::user()->role_id)->get();

        if($data->isEmpty()){
            $json = ["data" => $data, "success" => false];
        }else{
            $json = ["data" => $data, "success" => true];
        }
        return $response = response()->json($json);
    }

    public function getListFeature(Request $request){
        $data = List_Feature::where('parent_id' ,'!=' ,'null')->orderBy('order', 'asc')->get();

        if($data->isEmpty()){
            $json = ["data" => $data, "success" => false];
        }else{
            $json = ["data" => $data, "success" => true];
        }
        return $response = response()->json($json);
    }


    public function getKelas(Request $request)
    {
        $query = MKelas::select('m_kelas.*', 'm_jurusans.nama_jurusan')
        ->where('status', 'active')->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id');

        // if($request->tahun_ajaran != null){
        //     $query->where('m_kelas.tahun_ajaran_id', $request->tahun_ajaran);
        // }
        $data = $query->get();

        $data = $data->sortBy('tingkat', SORT_NATURAL)->values();

        // Gunakan fungsi isEmpty() bawaan Laravel untuk mengecek data kosong
        if ($data->isEmpty()) {
            return response()->json([
                "data" => [],
                "success" => false
            ]);
        }

        // Ubah format data dari database menjadi format react-select (value & label)
        $formattedData = $data->map(function ($item) {
            return [
                "value" => (string) $item->id,         // Ambil ID sebagai value
                "label" => $item->nama_kelas . " ".($item->nama_jurusan  ? strtoupper($item->nama_jurusan)  : "") ,
                "tingkat" => $item->tingkat
            ];
        })->toArray();

        // Tambahkan opsi "[Semua Kelas]" di urutan paling atas array
        array_unshift($formattedData, [
            "value" => "all",
            "label" => "[Semua Kelas]"
        ]);

        // Kembalikan response JSON
        return response()->json([
            "data" => $formattedData,
            "success" => true
        ]);
    }

    public function cekSiswaTahunAjaran(){
        $data = MSiswa::where('status', 'active')->get();
        // if($data->isEmpty()){
            // $json = [ "success" => false ,"message" => "Sistem tidak dapat menemukan data siswa"];
        // }else{
            $json = [ "success" => true];
        // }
        return $response = response()->json($json);
    }

 public function getMapelGuru(Request $request)
    {
        $tahunAjaranId = $request->query('tahun_ajaran_id');
       $tableName = 'm_mapels';

$data = $this->builder($tableName)
    ->leftJoin('t_list_guru_mapels', 'm_mapels.id', '=', 't_list_guru_mapels.mapel_id')
    ->leftJoin('t_list_gurus', function ($join) use ($tahunAjaranId) {
        // PERBAIKAN 1: Join berdasarkan NIP DAN KELAS ID agar tidak cross-join (ganda)
        $join->on('t_list_guru_mapels.guru_id', '=', 't_list_gurus.guru_id');

        if (!empty($tahunAjaranId) && $tahunAjaranId != null) {
            $join->where('t_list_gurus.tahun_ajaran_id', $tahunAjaranId);
        } else {
            $join->whereRaw('1 = 0');
        }
    })
    ->leftJoin('m_gurus as guru', function ($join) {
        $join->on('t_list_gurus.guru_id', '=', 'guru.id');
        $join->where('guru.status', 'active');
    })
    ->leftJoin('m_kelas','m_kelas.id' , '=', 't_list_gurus.kelas_id')
    ->select(
        'm_mapels.id as id',
        'm_mapels.nama_mapel',
        'm_mapels.kode_mapel',
        'guru.id as guru_id',
        'guru.nama_guru',
        'guru.nip',
        't_list_guru_mapels.beban_jam',
        't_list_guru_mapels.id as unique_id',
        't_list_gurus.kelas_id',
        't_list_gurus.tahun_ajaran_id',
        'm_kelas.nama_kelas',
        'm_kelas.tingkat'
    )
    ->get()
    ->groupBy('id')
    ->map(function ($items) {
        return [
            'id'              => $items->first()->id,
            'mapel'           => $items->first()->nama_mapel,
            'kode_mapel'      => $items->first()->kode_mapel,
            'tahun_ajaran_id' => $items->first()->tahun_ajaran_id,
            'guru'            => $items->filter(function ($item) {
                                    return !empty($item->nama_guru);
                                })
                                // PERBAIKAN 2: Pastikan tidak ada duplikasi NIP di kelas yang sama
                                ->unique(function ($item) {
                                    return $item->guru_id . '-' . $item->kelas_id;
                                })
                                // 🌟 PERBAIKAN 3: Order by Nama Guru kemudian Nama Kelas
                              ->sortBy(function ($item) {
                                    return $item->nama_guru . '-' . $item->nama_kelas;
                                }, SORT_NATURAL)
                                ->map(function ($item) {
                                    return [
                                        'id'         => $item->unique_id,
                                        'nama'       => $item->nama_guru,
                                        'guru_id'    => $item->guru_id,
                                        'nip'        => $item->nip,
                                        'beban_jam'  => $item->beban_jam ?? 0,
                                        'kelas_id'   => $item->kelas_id ?? '',
                                        'nama_kelas' => $item->nama_kelas,
                                        'tingkat'    => $item->tingkat
                                    ];
                                })
                                ->values()
                                ->toArray(),
        ];
    })
    ->values();

        return response()->json([
            'data'    => $data,
            'success' => true
        ]);
    }
    public function getListGuru(){
       $data = MGuru::select(
        'm_gurus.id',
        'm_gurus.nama_guru',
        'm_gurus.nip',
        'm_mapels.id as mapel_id', // Beri alias agar tidak bentrok dengan id guru
        'm_mapels.nama_mapel',
        'm_mapels.kode_mapel'
    )
    ->where('m_gurus.status', 'active')
    ->leftJoin('t_list_guru_mapels', 'm_gurus.id', '=', 't_list_guru_mapels.guru_id')
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')

    ->get()
    ->groupBy('id')
    ->map(function ($items) {
        $first = $items->first();
        return [
            'id' => $first->id,
            'nip' => $first->nip,
            'nama_guru' => $first->nama_guru,
            'mapel' => $items->filter(function ($item) {
                return !is_null($item->mapel_id);
            })->map(function ($item) {
                return [
                    'id' => $item->mapel_id,
                    'nama_mapel' => $item->nama_mapel,
                    'kode_mapel' => $item->kode_mapel
                ];
            })->values()->all()
        ];
    })->values();
        if($data->isEmpty()){
            $json = [ "success" => false ,"msg" => "Tidak dapat menemukan data guru"];
        }else{
            $json = [ "success" => true,"data" => $data];
        }
        return $response = response()->json($json);
    }

   public function getKelasSiswa(Request $request) {
    $tahunAjaran = $request->tahun_ajaran;

    $data = MKelas::select(
        'm_kelas.id',
        'm_kelas.nama_kelas',
        'm_kelas.tingkat',
        'm_siswas.nisn',
        'm_siswas.id as siswa_id',
        'm_siswas.nama_siswa',
        'm_siswas.jenis_kelamin',
        'm_gurus.nama_guru',
        'm_jurusans.nama_jurusan'
    )
    // 1. UBAH LEFT JOIN INI UNTUK MEMFILTER TAHUN AJARAN
    ->leftJoin('t_list_siswas', function($join) use ($tahunAjaran) {
        $join->on('m_kelas.id', '=', 't_list_siswas.kelas_id');

        // Jika ada filter tahun ajaran yang dikirim dari React
        if ($tahunAjaran) {
            // Sesuaikan 'tahun_ajaran_id' dengan nama kolom asli di tabel t_list_siswas Anda
            $join->where('t_list_siswas.tahun_ajaran_id', '=', $tahunAjaran);
        }
    })
    ->leftJoin('m_siswas', 't_list_siswas.siswa_id', '=', 'm_siswas.id')
    ->leftJoin('m_gurus', 'm_kelas.id_wali_kelas', '=', 'm_gurus.id')
    ->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id')
    // ->where('m_kelas.tahun_ajaran_id', $tahunAjaran)
    ->get()
    ->groupBy('id')
    ->map(function ($items) {
        $first = $items->first();

        return [
            'id' => $first->id,
            'nama_kelas' => $first->nama_kelas . ' ' .strtoupper($first->nama_jurusan) ,
            'nama_wali_kelas' => $first->nama_guru,
            'tingkat' => $first->tingkat,
            'siswa' => $items->filter(function ($item) {
                return !is_null($item->siswa_id);
            })->map(function ($item) {
                return [
                    'value' => $item->nisn,
                    'label' => $item->nama_siswa,
                    'jenis_kelamin' => $item->jenis_kelamin
                ];
            })->values()->all()
        ];
    })->values();

    if($data->isEmpty()){
        $json = [ "success" => false, "msg" => "Tidak dapat menemukan data kelas"];
    }else{
        $json = [ "success" => true, "data" => $data];
    }

    return response()->json($json);
}
  public function getKelasSiswaUnmapped(Request $request) {
    $tahunAjaran = $request->tahun_ajaran;

    // 1. Ambil daftar NISN siswa yang SUDAH terdaftar di kelas pada Tahun Ajaran tersebut
    $siswaSudahMapping = DB::table('t_list_siswas')
        ->where('tahun_ajaran_id', $tahunAjaran)
        ->pluck('nisn'); // Hanya mengambil array berisi NISN saja

    // 2. Ambil data siswa dari tabel master yang NISN-nya TIDAK ADA di dalam daftar di atas
    $data = MSiswa::select(
            'nisn',
            'nama_siswa',
            'jenis_kelamin'
        )
        ->whereNotIn('id', $siswaSudahMapping)
        // ->where('status', 'Aktif') // (Opsional) Uncomment ini jika Anda punya kolom status untuk mengecualikan siswa yang sudah lulus/pindah
        ->get();

    if($data->isEmpty()){
        $json = [ "success" => false, "msg" => "Semua siswa sudah masuk ke kelas atau tidak ada siswa."];
    } else {
        $json = [ "success" => true, "data" => $data];
    }

    return response()->json($json);
}

    public function getTahunAjaran(){
        $data = MTahunAjaran::get()->map(function ($item) {
            return [
                'value' => $item->id,
                'label' => $item->tahun_ajaran . ' - ' . strtoupper($item->semester),
                'status' => $item->status
            ];
        });
        if($data->isEmpty()){
            $json = [ "success" => false ,"msg" => "Tidak dapat menemukan data tahun ajaran" ,"data" => $data];
        }else{
            $json = [ "success" => true,"data" => $data];
        }
        return $response = response()->json($json);
    }
//     public function getKelasTujuan(Request $request)
//     {
//      $kelasAsalId = $request->kelas_asal_id;
// $kelasAsal = MKelas::find($kelasAsalId);
// $tahunAjaran = $request->tahun_ajaran;

// $mTahunAjaran = MTahunAjaran::where('id', $tahunAjaran)->first();

// if (!$kelasAsal) {
//     return response()->json(['success' => false, 'data' => []]);
// }

// $tingkatTujuan = $kelasAsal->tingkat + 1;

// // Cek apakah siswa saat ini berada di kelas 12 (tingkat asal = 12, sehingga tingkatTujuan menjadi 13)
// if ($tingkatTujuan == 13) {
//     $semester = strtolower($mTahunAjaran->semester);

//     if ($semester == "ganjil") {
//         // Jika ganjil, pindahkan ke semester genap (artinya tetap di kelas tingkat 12)
//         $opsiKelasTujuan = MKelas::where('tingkat', 12)->get();
//     } else if ($semester == "genap") {
//         // Jika sudah genap, maka pilihan tujuannya HANYA lulus
//         $opsiKelasTujuan = [
//             [
//                 "id" => "Lulus",
//                 "nama_kelas" => "🎓 Lulus / Alumni"
//             ]
//         ];
//     } else {
//         $opsiKelasTujuan = [];
//     }
// } else {
//     // Untuk kenaikan kelas normal (misal tingkat 10 ke 11, atau 11 ke 12)
//     $opsiKelasTujuan = MKelas::where('tingkat', $tingkatTujuan)->get();
// }

//         return response()->json(['success' => true, 'data' => $opsiKelasTujuan]);
//     }

public function getKelasTujuan(Request $request)
{
    $kelasAsalId = $request->kelas_asal_id;
    $taAsalId = $request->ta_asal;
    $taTujuanId = $request->ta_tujuan;

    // Ambil data tahun ajaran asal dan tujuan dari database
    $taAsal = MTahunAjaran::where('id', $taAsalId)->first();
    $taTujuan = MTahunAjaran::where('id', $taTujuanId)->first();

    // 1. Ekstrak "Tahun" dari format "2025/2026 Ganjil" -> menjadi "2025/2026"
    // (Sesuaikan logika substr/explode ini dengan format data di database Anda)
    $tahunNamaAsal = explode(' ', $taAsal->tahun_ajaran)[0];
    $tahunNamaTujuan = explode(' ', $taTujuan->tahun_ajaran)[0];

    // 2. LOGIKA PENENTUAN KELAS
    if ($tahunNamaAsal === $tahunNamaTujuan) {
        // SKENARIO A: Beda Semester tapi Tahun Sama (Contoh: Ganjil -> Genap)
        // Kembalikan kelas yang SAMA dengan kelas asal
        $kelasTujuan = MKelas::where('id', $kelasAsalId)->get();

    } else {
        // SKENARIO B: Tahun Ajaran Berbeda (Contoh: Genap 25/26 -> Ganjil 26/27)
        // Jalankan query untuk mencari relasi KELAS SELANJUTNYA
        $kelasAsal = MKelas::where('id', $kelasAsalId)->first();

        // Asumsikan ada logika mencari kelas tingkat berikutnya
        // Jika kelas 12, kembalikan array kosong [] agar frontend mendeteksi "LULUS"
        if ($kelasAsal->tingkat == 12) {
            $kelasTujuan = [
                [
                    "id" => "LULUS",
                    "nama_kelas" => "🎓 Lulus / Alumni"
                ]
            ];
        } else {
            $kelasTujuan = MKelas::where('tingkat', $kelasAsal->tingkat + 1)
                // ->where('jurusan', $kelasAsal->jurusan) // misal sesama MIPA
                ->get();
        }
    }

    return response()->json([
        'success' => true,
        'data' => $kelasTujuan
    ]);
}
public function getSiswaInKelas(Request $request){
        $query = MSiswa::select(
            'm_siswas.nisn',
            'm_siswas.id as value',
            'm_siswas.nama_siswa as label',
            'm_siswas.jenis_kelamin',
            't_list_siswas.kelas_id',
            't_list_siswas.tahun_ajaran_id',
            'm_kelas.nama_kelas',
            'm_tahun_ajarans.tahun_ajaran',
            'm_tahun_ajarans.semester')
        ->leftJoin('t_list_siswas', 'm_siswas.id', '=', 't_list_siswas.siswa_id')
        ->leftJoin('m_kelas', 't_list_siswas.kelas_id', '=', 'm_kelas.id')
        ->leftJoin('m_tahun_ajarans', 't_list_siswas.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
        ->where('t_list_siswas.tahun_ajaran_id', $request->Ta);
        if ($request->kelas_id !="all") {
            $query->where('t_list_siswas.kelas_id', $request->kelas_id);
        }
        $data = $query->get();
        return $response = response()->json(["data" => $data, "success" => true]);
    }

    public function cekKelasTujuan(Request $request)
    {
        // 1. Ambil Total Siswa (Gunakan pemanggilan statis baru agar independen)
        $dataTotal = MSiswa::join('t_list_siswas', 'm_siswas.id', '=', 't_list_siswas.siswa_id');
            // Pastikan parameter request yang digunakan seragam.
            // Di sini saya asumsikan menggunakan kelas_id dan Ta.

            if($request->kelas_asal_id == "Lulus"){
                $dataTotal->where('t_list_siswas.status', 'alumni');
            }else{
                 $dataTotal->where('t_list_siswas.kelas_id', $request->kelas_asal_id)
            ->where('t_list_siswas.tahun_ajaran_id', $request->tahun_ajaran);
            }
    $total = $dataTotal->count();
        // 2. Ambil Daftar Siswa (Pemanggilan statis baru)
        $datalistSiswa = MSiswa::select(
                'm_siswas.nisn as value',
                'm_siswas.nama_siswa as label',
                'm_siswas.jenis_kelamin',
                't_list_siswas.kelas_id'
            )
            ->leftJoin('t_list_siswas', 'm_siswas.id', '=', 't_list_siswas.siswa_id')
            ->leftJoin('m_kelas', 't_list_siswas.kelas_id', '=', 'm_kelas.id');

            if($request->kelas_asal_id == "Lulus"){
                $datalistSiswa->where('t_list_siswas.status', 'alumni');
            }else{
                $datalistSiswa->where('t_list_siswas.kelas_id', $request->kelas_asal_id)
            ->where('t_list_siswas.tahun_ajaran_id', $request->tahun_ajaran);
            }
        $listSiswa = $datalistSiswa->get();
        return response()->json([
            "data" => [
                "total" => $total,
                "listSiswa" => $listSiswa
            ],
            "success" => true
        ]);
    }

    public function getSiswaAlumni(Request $request){
        $dataSiswa = MSiswa::leftJoin('t_alumnis', 'm_siswas.nisn', '=', 't_alumnis.nisn')
        ->leftJoin('m_tahun_ajarans', 't_alumnis.lulus_tahun_ajaran', '=', 'm_tahun_ajarans.id')
        ->where('m_tahun_ajarans.semester', 'genap');
        if($request->tahun_ajaran != "all"){
            $dataSiswa->where('t_alumnis.lulus_tahun_ajaran', $request->tahun_ajaran);
        }
        $dataSiswa = $dataSiswa->get();
        return response()->json([
            "data" => $dataSiswa,
            "success" => true
        ]);
    }

    public function getHistoryJadwal(Request $request){
        $tahunAjaran = $request->tahun_ajaran_id;
        $data = TJadwal::getJadwalByTahunAjaran($tahunAjaran);
        return response()->json([
            "data" => $data,
            "success" => true
        ]);
    }

    public function getGuruPengampuKelas(Request $request){
        $tahunAjaranId = $request->tahun_ajaran;
        $data = TListGuru::getGuruPengampu($tahunAjaranId);
        if(!empty($data) && count($data) > 0){
            $json = [
                'data' => $data,
                'success' => true
            ];
        }else {
            $json = ['data' => [],
                'success' => false
            ];
        }
        return response()->json([
            'data' => $data,
            'success' => true
        ]);
    }

   public function getSiswaPerKelas(Request $request)
{
    $kelasId = $request->kelas_id;
    $tahunAjaran = $request->tahun_ajaran_id;
    $jadwal = $request->kode_jadwal;

    $sekarang = Carbon::now();
    // $hariIni = $sekarang->locale('id')->translatedFormat('l');
    $hariIni = "Senin";
    $jamSekarang = $sekarang->format('H:i:00');
    if($request->type != 'informasi'){

        $isJadwalAktif = TJadwal::cekJadwal($kelasId, $tahunAjaran, $jadwal, $hariIni, $jamSekarang);
         /* comment ini jika ingin development
         if ($isJadwalAktif) {
             return response()->json([
                 "success" => false,
                 "msg"     => "Tidak ada jadwal pelajaran yang aktif untuk kelas ini pada hari dan jam sekarang."
                 ], 200);
        }
        sampe sini*/
    }

    $data = TListSiswa::getSiswaByTahunAjaran($tahunAjaran, $kelasId);
    // 5. Evaluasi data siswa
    if ($data->isEmpty()) {
        return response()->json([
            "success" => false,
            "msg"     => "Tidak dapat menemukan data siswa di kelas ini. Silahkan Hubungi Admin untuk memastikan apakah sudah ada siswa yang terdaftar di kelas ini."
        ]);
    }
    if($request->type == 'informasi'){
        return response()->json([
            "success" => true,
            "data"    => $data
        ]);
    }else {

    $pertemuan = TAbsenSiswa::where('kode_jadwal', $jadwal)
        ->where('tahun_ajaran_id', $tahunAjaran)
        ->distinct('tanggal_absen') // Ganti 'tanggal' dengan nama kolom tanggal absensi Anda
        ->count('tanggal_absen');
            return response()->json([
        "success" => true,
        "data"    => $data,
        "pertemuan" => $pertemuan + 1,
    ]);

    }
}
    public function getMapelGuruKelas(Request $request){
        $kelasID = $request->kelas_id;
        $tahunAjaran = $request->tahun_ajaran_id;

        $data = TListGuruMapel::MapelGuruKelas($kelasID, $tahunAjaran);

        if($data->isEmpty()){
            $json = [ "success" => false, "msg" => "Tidak dapat menemukan data kelas"];
        }else{
            $json = [ "success" => true, "data" => $data];
        }

        return response()->json($json);
    }

    public function getJadwalGuruKelas(Request $request){
        $kelasID = $request->kelas_id;
        $tahunAjaran = $request->tahun_ajaran_id;

        $data = TJadwal::jadwalKelas($kelasID, $tahunAjaran);

        if($data->isEmpty()){
            $json = [ "success" => false, "msg" => "Tidak dapat menemukan data kelas"];
        }else{
            $json = [ "success" => true, "data" => $data];
        }

        return response()->json($json);
    }

    public function getHistoryAbsensi(Request $request)
    {
        $data = TAbsenGuru::historyAbsen();

        if($data->isEmpty()){
            $json = [ "success" => false, "msg" => "Tidak dapat menemukan data kelas"];
        }else{
            $json = [ "success" => true, "data" => $data];
        }

        return response()->json($json);


    }

    public function getKelasAktif(Request $request){
        $waktuSekarang = Carbon::now('Asia/Makassar');
        $hariIni = $waktuSekarang->locale('id')->isoFormat('dddd');
        // $hariIni = "Selasa";
    $jamSekarang = $waktuSekarang->format('H:i:s');

    // 2. Eksekusi Query dengan Filter Waktu
    $jadwalMentah = MKelas::select(
            'm_kelas.id as kelas_id',
            'm_kelas.nama_kelas',
            't_jadwals.kode_jadwal',
            't_jadwals.jam_mulai',
            't_jadwals.jam_selesai',
            'm_gurus.nama_guru',
            't_absen_gurus.kode_absen',
            'm_mapels.nama_mapel'
        )
    ->join('t_jadwals', function($join) use ($hariIni, $jamSekarang) {
            $join->on('m_kelas.id', '=', 't_jadwals.kelas_id')
                ->where('t_jadwals.hari', '=', $hariIni)
                ->whereTime('t_jadwals.jam_mulai', '<=', $jamSekarang)
                ->whereTime('t_jadwals.jam_selesai', '>=', $jamSekarang);
        })
    ->leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->leftJoin('t_absen_gurus', 't_jadwals.kode_jadwal', '=', 't_absen_gurus.kode_jadwal')
    ->leftJoin('m_tahun_ajarans', 't_jadwals.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
    ->where('m_tahun_ajarans.status', '=', 'active')
    ->leftJoin('m_gurus', 't_list_guru_mapels.guru_id', '=', 'm_gurus.id')
    ->leftJoin('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')

    ->orderBy('t_jadwals.jam_mulai', 'asc')
    ->get();

    $data = $jadwalMentah->groupBy('kode_jadwal')->map(function ($items) {
    $first = $items->first();

    return [
        'nama_kelas' => $first->nama_kelas,
        'nama_mapel' => $first->nama_mapel,
        'nama_guru'  => $first->nama_guru,
        'status_kbm' => is_null($first->kode_absen) ? 'Belum Absen' : 'Hadir',
        'warna_badge'=> is_null($first->kode_absen) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700',
        // Mengumpulkan semua jam menjadi array
        'jam_sesi'   =>  $first->jam_mulai . ' - ' . $first->jam_selesai,
    ];
    })->groupBy('nama_kelas');

        return response()->json([
            "data" => $data,
            "success" => true
        ]);
    }

    public function getJadwalPerGuru(Request $request){
    $tahunAjaran = $request->tahun_ajaran_id;
    $guruId = $request->guru_id;
        $data = TJadwal::getJadwalByGuru($guruId, $tahunAjaran);


        if($data->isEmpty()){
            $json = [ "success" => false, "msg" => "Tidak dapat menemukan data jadwal"];
        }else{
            $json = [ "success" => true, "data" => $data];
        }

        return response()->json($json);
    }

    public function getSiswaPerwalian(Request $request){
        $tahunAjaran = $request->tahun_ajaran_id;
        $data = TListSiswa::getWaliKelas($tahunAjaran);
        return response()->json([
            "data" => $data,
            "success" => true
        ]);
    }

    public function cekDataMapel(){
        $table = 'm_kelas';

        $dataJam = DB::table($table)
        ->select('m_kelas.nama_kelas',DB::raw('SUM(beban_jam) as beban_jam'))
        ->join('t_list_gurus', 'm_kelas.id', '=', 't_list_gurus.kelas_id')
        ->join('t_list_guru_mapels', 't_list_gurus.id', '=', 't_list_guru_mapels.t_list_guru_id')
        ->groupBy('m_kelas.id')
        ->get();

        $dataJamGuru = DB::table($table)
    ->select(
        'm_kelas.nama_kelas',
        'm_gurus.nama_guru',
        't_list_guru_mapels.beban_jam',
        'm_mapels.nama_mapel'
    )
    ->join('t_list_gurus', 'm_kelas.id', '=', 't_list_gurus.kelas_id')
    ->join('t_list_guru_mapels', 't_list_gurus.id', '=', 't_list_guru_mapels.t_list_guru_id')
    ->join('m_gurus', 't_list_gurus.guru_id', '=', 'm_gurus.id')
    ->join('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
    ->where('t_list_gurus.tahun_ajaran_id',1)
    ->groupBy(
        'm_kelas.id',
        'm_kelas.nama_kelas',
        'm_gurus.id',
        'm_gurus.nama_guru',
        't_list_guru_mapels.id',
        'm_mapels.id'
    )
    ->orderBy('m_kelas.nama_kelas')
    ->orderBy('m_gurus.nama_guru')
    ->get();

    $jadwal = DB::table('t_jadwals')
    ->join('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
    ->join('m_kelas', 't_jadwals.kelas_id', '=', 'm_kelas.id')
    ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->join('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
    ->join('m_gurus', 't_list_gurus.guru_id', '=', 'm_gurus.id')
    ->where('t_jadwals.tahun_ajaran_id', 1)->get();
        return view('cek-data-mapel', compact('dataJam', 'dataJamGuru', 'jadwal'));
    }

    public function getTotalJam(Request $request){
        $tingkat = $request->tingkat;
        $tahunAjaran = $request->tahun_ajaran_id;
    $data = [];
        foreach($tingkat as $t){
            $totalJam = DB::table('m_kelas')
            ->join('t_list_gurus', 'm_kelas.id', '=', 't_list_gurus.kelas_id')
            ->join('t_list_guru_mapels', 't_list_gurus.id', '=', 't_list_guru_mapels.t_list_guru_id')
            ->where('m_kelas.tingkat', $t)
            ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaran)
            ->sum('t_list_guru_mapels.beban_jam');
            $data["tingkat".$t] = [
                'total_jam' => $totalJam];
        }
        return response()->json([
            "data" => $data,
            "success" => true
        ]);
    }
}