<?php

namespace App\Http\Controllers\Helper;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\List_Feature;
use App\Models\TListFeatureByRole;
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

    public function getKelas()
    {
        $data = MKelas::select('m_kelas.*', 'm_jurusans.nama_jurusan')->where('status', 'active')->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id')->get();

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
                "label" => $item->nama_kelas .( " " .$item->nama_jurusan . ")" ? strtoupper($item->nama_jurusan)  : "") ,       // Sesuaikan 'nama_kelas' dengan nama kolom di database Anda
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
        $data = MSiswa::get();
        if($data->isEmpty()){
            $json = [ "success" => false ,"message" => "Sistem tidak dapat menemukan data siswa"];
        }else{
            $json = [ "success" => true];
        }
        return $response = response()->json($json);
    }

 public function getMapelGuru(Request $request)
    {
        $tahunAjaranId = $request->query('tahun_ajaran_id');
        $tableName = 'm_mapels';

        $data = $this->builder($tableName)
            ->leftJoin('t_list_guru_mapels', 'm_mapels.id', '=', 't_list_guru_mapels.mapel_id')

            ->leftJoin('t_list_gurus', function ($join) use ($tahunAjaranId) {
                // 🌟 PERBAIKAN 1: Join berdasarkan NIP DAN KELAS ID agar tidak cross-join (ganda)
                $join->on('t_list_guru_mapels.nip', '=', 't_list_gurus.nip');

                if (!empty($tahunAjaranId) && $tahunAjaranId != null) {
                    $join->where('t_list_gurus.tahun_ajaran_id', '=', $tahunAjaranId);
                } else {
                    $join->whereRaw('1 = 0');
                }
            })

            ->leftJoin('m_gurus as guru', 'guru.nip', '=', 't_list_gurus.nip')
            ->leftJoin('m_kelas','m_kelas.id' , '=', 't_list_gurus.kelas_id')
            ->select(
                'm_mapels.id',
                'm_mapels.nama_mapel',
                'm_mapels.kode_mapel',
                'guru.id as guru_id',
                'guru.nama_guru',
                'guru.nip',
                't_list_guru_mapels.beban_jam',
                't_list_guru_mapels.id as unique_id',
                't_list_gurus.kelas_id',
                't_list_gurus.tahun_ajaran_id',
                'm_kelas.nama_kelas'
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
                                        // 🌟 PERBAIKAN 2: Pastikan tidak ada duplikasi NIP di kelas yang sama
                                        ->unique(function ($item) {
                                            return $item->nip . '-' . $item->kelas_id;
                                        })
                                        ->map(function ($item) {
                                            return [
                                                'id'         => $item->unique_id,
                                                'nama'       => $item->nama_guru,
                                                'nip'        => $item->nip,
                                                'beban_jam'  => $item->beban_jam ?? 0,
                                                'kelas_id'   => $item->kelas_id ?? '',
                                                'nama_kelas' => $item->nama_kelas,
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
    ->leftJoin('t_list_guru_mapels', 'm_gurus.nip', '=', 't_list_guru_mapels.nip')
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
    ->leftJoin('m_siswas', 't_list_siswas.nisn', '=', 'm_siswas.nisn')
    ->leftJoin('m_gurus', 'm_kelas.id_wali_kelas', '=', 'm_gurus.id')
    ->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id')
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
                return !is_null($item->nisn);
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
        ->whereNotIn('nisn', $siswaSudahMapping)
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
        $data = MSiswa::select(
            'm_siswas.nisn as value',
            'm_siswas.nama_siswa as label',
            'm_siswas.jenis_kelamin',
            't_list_siswas.kelas_id',
            't_list_siswas.tahun_ajaran_id',
            'm_kelas.nama_kelas',
            'm_tahun_ajarans.tahun_ajaran',
            'm_tahun_ajarans.semester')
        ->leftJoin('t_list_siswas', 'm_siswas.nisn', '=', 't_list_siswas.nisn')
        ->leftJoin('m_kelas', 't_list_siswas.kelas_id', '=', 'm_kelas.id')
        ->leftJoin('m_tahun_ajarans', 't_list_siswas.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
        ->where('t_list_siswas.kelas_id', $request->kelas_id)
        ->where('t_list_siswas.tahun_ajaran_id', $request->Ta)
        ->get();
        return $response = response()->json(["data" => $data, "success" => true]);
    }

    public function cekKelasTujuan(Request $request)
    {
        // 1. Ambil Total Siswa (Gunakan pemanggilan statis baru agar independen)
        $dataTotal = MSiswa::join('t_list_siswas', 'm_siswas.nisn', '=', 't_list_siswas.nisn');
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
            ->leftJoin('t_list_siswas', 'm_siswas.nisn', '=', 't_list_siswas.nisn')
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
       $data = TJadwal::select([
        't_jadwals.*',
        'm_gurus.nama_guru',
        'm_mapels.nama_mapel',
        'm_kelas.nama_kelas'
    ])
    ->leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->leftJoin('m_gurus', 't_list_guru_mapels.nip', '=', 'm_gurus.nip') // Tambahan relasi ke tabel guru
    ->leftJoin('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('m_kelas', 't_jadwals.kelas_id', '=', 'm_kelas.id')
    ->orderBy('m_kelas.nama_kelas', 'asc')
    ->orderByRaw("FIELD(t_jadwals.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat')") // Wajib pakai orderByRaw untuk sintaks SQL native
    ->orderBy('t_jadwals.jam_mulai', 'asc')
    ->get();
        return response()->json([
            "data" => $data,
            "success" => true
        ]);
    }

    public function getGuruPengampuKelas(Request $request){
        $tahunAjaranId = $request->tahun_ajaran;
    $data = TListGuru::select(
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'perwalian.nama_guru as nama_perwalian',
        'perwalian.nip as nip_perwalian',
        'm_kelas.id as kelas_id',

        // 1. TETAP gunakan GROUP_CONCAT agar SQL tidak error & kelas tidak duplikat
        DB::raw('GROUP_CONCAT(DISTINCT m_mapels.nama_mapel SEPARATOR "||") as raw_mapel'),

        DB::raw('COUNT(DISTINCT t_list_siswas.nisn) as jumlah_siswa')
    )
    ->leftJoin('m_gurus', 't_list_gurus.nip', '=', 'm_gurus.nip')
    ->leftJoin('t_list_guru_mapels', 't_list_gurus.id', '=', 't_list_guru_mapels.t_list_guru_id')
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('m_kelas', 't_list_gurus.kelas_id', '=', 'm_kelas.id')
    ->leftJoin('m_gurus as perwalian', 'perwalian.id', '=', 'm_kelas.id_wali_kelas')
    ->leftJoin('t_list_siswas', 't_list_gurus.kelas_id', '=', 't_list_siswas.kelas_id')
    ->where('m_gurus.nip', Auth::user()->nip)
    ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaranId)
    ->groupBy(
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'm_kelas.id',
        'perwalian.nama_guru',
        'perwalian.nip',

    )
    ->get()
    ->map(function ($item) {
        // Enkripsi ID
        $item->kelas_id = Crypt::encryptString($item->kelas_id);

        // 2. Proses pembentukan Array Mapel
        $mapelList = [];
        if ($item->raw_mapel) {
            $pecahMapel = explode('||', $item->raw_mapel);
            foreach ($pecahMapel as $mapel) {
                // Masukkan ke dalam format array of object yang Anda inginkan
                $mapelList[] = [
                    'nama_mapel' => $mapel
                ];
            }
        }

        // Assign ke properti mapel
        $item->mapel = $mapelList;

        // Bersihkan properti mentah agar response JSON rapi
        unset($item->raw_mapel);

        return $item;
    });
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

        $isJadwalAktif = TJadwal::where('kelas_id', $kelasId)
        ->where('tahun_ajaran_id', $tahunAjaran)
        ->where('kode_jadwal', $jadwal)
        ->where('hari', $hariIni)
        ->where('jam_mulai', '<=', $jamSekarang)
        ->where('jam_selesai', '>=', $jamSekarang)
        ->exists();
        //keluarkan ! jika ingin development
        if (!$isJadwalAktif) {
            return response()->json([
                "success" => false,
                "msg"     => "Tidak ada jadwal pelajaran yang aktif untuk kelas ini pada hari dan jam sekarang."
                ], 200);
        }
    }

    $data = TListSiswa::leftJoin('m_siswas', 't_list_siswas.nisn', '=', 'm_siswas.nisn')
        ->where('t_list_siswas.kelas_id', $kelasId)
        ->where('t_list_siswas.tahun_ajaran_id', $tahunAjaran)
        ->select(
            't_list_siswas.nisn',
            'm_siswas.nama_siswa',
            'm_siswas.jenis_kelamin',
            'm_siswas.tempat_lahir',
            'm_siswas.tanggal_lahir',
            't_list_siswas.kelas_id'
        )
        ->get();

    // 5. Evaluasi data siswa
    if ($data->isEmpty()) {
        return response()->json([
            "success" => false,
            "msg"     => "Tidak dapat menemukan data siswa di kelas ini."
        ]);
    }

    return response()->json([
        "success" => true,
        "data"    => $data
    ]);
}
    public function getMapelGuruKelas(Request $request){
        $kelasID = $request->kelas_id;
        $tahunAjaran = $request->tahun_ajaran_id;

        $data = TListGuruMapel::select(
            'm_mapels.nama_mapel',
                'm_mapels.kode_mapel',
                't_jadwals.kode_jadwal',
        )
        ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
        ->leftJoin('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
        ->leftJoin('t_jadwals', 't_list_guru_mapels.id', '=', 't_jadwals.t_list_guru_mapel_id')
        ->where('t_list_gurus.kelas_id', $kelasID)
        ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaran)
        ->where('t_list_gurus.nip', Auth::user()->nip)
        ->groupBy('t_jadwals.kode_jadwal' ,'m_mapels.nama_mapel', 'm_mapels.kode_mapel')
        ->get();

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

        $data = TJadwal::leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
        ->leftJoin('m_gurus', 't_list_guru_mapels.nip', '=', 'm_gurus.nip')
        ->leftJoin('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
        ->leftJoin('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
        ->where('t_list_gurus.kelas_id', $kelasID)
        ->where('t_list_gurus.tahun_ajaran_id', $tahunAjaran)
        ->where('t_list_guru_mapels.nip', Auth::user()->nip)
        ->get();

        if($data->isEmpty()){
            $json = [ "success" => false, "msg" => "Tidak dapat menemukan data kelas"];
        }else{
            $json = [ "success" => true, "data" => $data];
        }

        return response()->json($json);
    }

    public function getHistoryAbsensi(Request $request)
    {
        $data = TAbsenGuru::where('t_absen_gurus.kode_jadwal', $request->kode_jadwal)
    ->leftJoin('t_absen_siswas', 't_absen_gurus.kode_absen', '=', 't_absen_siswas.kode_absen')
    // Asumsi: Anda juga melakukan join ke tabel siswas master untuk mengambil nama
    ->leftJoin('m_siswas', 't_absen_siswas.nisn', '=', 'm_siswas.nisn')
    ->select(
        't_absen_gurus.kode_absen',
        't_absen_gurus.waktu_absen',
        't_absen_gurus.waktu',
        't_absen_siswas.nisn',
        'm_siswas.nama_siswa', // Mengambil nama siswa
        't_absen_siswas.status'
    )
    ->orderBy('t_absen_gurus.waktu', 'desc')
    ->get()

    // 1. Kelompokkan data yang datar berdasarkan kode_absen
    ->groupBy('kode_absen')
    // 2. Map setiap kelompok menjadi format yang Anda inginkan
    ->map(function ($group) {

        // Ambil baris pertama dari kelompok ini sebagai data Induk (Guru/Jadwal)
        $parent = $group->first();

        return [
            'kode_absen'    => $parent->kode_absen,
            'waktu_absen' => $parent->waktu_absen, // Atau kolom tanggal_absen Anda
            'waktu'   => $parent->waktu,

            // 3. Map lagi isi kelompok ini khusus untuk array list_siswa
            'list_siswa'    => $group->map(function ($siswa) {
                return [
                    'nama_siswa' => $siswa->nama_siswa ?? 'Tidak diketahui',
                    'nisn'       => $siswa->nisn,
                    'status'     => $siswa->status
                ];
            })->values()->toArray() // Gunakan values() agar index list_siswa selalu mulai dari 0
        ];
    })

    // 4. Reset index array utama agar menjadi murni [0, 1, 2, ...] bukan index asosiatif
    ->values();


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
    ->leftJoin('m_gurus', 't_list_guru_mapels.nip', '=', 'm_gurus.nip')
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
}
