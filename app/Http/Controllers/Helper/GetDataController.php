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
use App\Models\WAHYU\MMapel;
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
        $query = MKelas::getKelas();
        $data = $query;

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
        $data = MSiswa::getSiswa();
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


    $data = MMapel::mapGuruMapel($tahunAjaranId);
        return response()->json([
            'data'    => $data,
            'success' => true
        ]);
    }
    public function getListGuru(){
       $data = MGuru::listGuru();
        if($data->isEmpty()){
            $json = [ "success" => false ,"msg" => "Tidak dapat menemukan data guru"];
        }else{
            $json = [ "success" => true,"data" => $data];
        }
        return $response = response()->json($json);
    }

   public function getKelasSiswa(Request $request) {
    $tahunAjaran = $request->tahun_ajaran;

    $data = MKelas::getSiswaKelas($tahunAjaran);

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
        // dd($data);
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
        $mapel = $request->mapel_id;
        $data = TJadwal::jadwalKelas($kelasID, $tahunAjaran, $mapel);

        if($data->isEmpty()){
            $json = [ "success" => false, "msg" => "Tidak dapat menemukan data kelas"];
        }else{
            $json = [ "success" => true, "data" => $data];
        }

        return response()->json($json);
    }

    public function getHistoryAbsensi(Request $request)
    {
        $kode_jadwal = $request->input('kode_jadwal');
        $data = TAbsenGuru::historyAbsen($kode_jadwal);

        if($data->isEmpty()){
            $json = [ "success" => false, "msg" => "Tidak dapat menemukan data kelas"];
        }else{
            $json = [ "success" => true, "data" => $data];
        }

        return response()->json($json);


    }

public function getKelasAktif(Request $request)
    {
        // 1. Ambil tanggal dari request (jika ada), jika tidak gunakan tanggal hari ini (Asia/Makassar)
        $waktuSekarang = Carbon::now('Asia/Makassar');
        $tanggalFilter = $request->input('tanggal');
        $hariFilter = $request->input('hari'); // Opsional: jika ingin membatasi hari tertentu

      $jadwalMentah = MKelas::kelasAktif($tanggalFilter);
// 3. Kelompokkan berdasarkan nama_kelas
$data = $jadwalMentah->groupBy('nama_kelas')->map(function ($itemsKelas) {

    // 4. Kelompokkan lagi berdasarkan hari
    return $itemsKelas->groupBy('hari')->map(function ($itemsHari) {

        // 5. Petakan detail jadwal per sesi/kode_jadwal
        return $itemsHari->groupBy('kode_jadwal')->map(function ($itemsJadwal) {
            $first = $itemsJadwal->first();
            $belumAbsen = is_null($first->kode_absen);

            // Cek apakah ada data pengajuan pergantian
            $isAdaPengajuan = !is_null($first->ada_pergantian);
            $statusPergantian = $first->status_pergantian; // contoh: 'diterima', 'ditolak', 'pending'

            // Tentukan apakah pergantian sah aktif (misal: hanya jika statusnya 'diterima')
            $isDisetujui = $isAdaPengajuan && $statusPergantian === 'diterima';

            // Tentukan guru aktif (Jika disetujui pakai guru pengganti, jika ditolak/pending/tidak ada kembali ke guru asli)
            $namaGuruAktif = $isDisetujui ? $first->nama_guru_pengganti : $first->nama_guru_asli;
            $guruIdAktif   = $isDisetujui ? $first->guru_pengganti_id : $first->guru_id_asli;

            // Tentukan status KBM dan badge berdasarkan kondisi
            if ($isDisetujui) {
                $statusKbm  = $belumAbsen ? 'Digantikan (Belum Absen)' : 'Digantikan (Hadir)';
                $warnaBadge = $belumAbsen ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
            } elseif ($isAdaPengajuan && $statusPergantian === 'ditolak') {
                $statusKbm  = 'Pergantian Ditolak';
                $warnaBadge = 'bg-rose-100 text-rose-700';
            } elseif ($isAdaPengajuan && $statusPergantian === 'pending') {
                $statusKbm  = 'Menunggu Konfirmasi';
                $warnaBadge = 'bg-yellow-100 text-yellow-700';
            } else {
                $statusKbm  = $belumAbsen ? 'Belum Absen' : 'Hadir';
                $warnaBadge = $belumAbsen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
            }

            return [
                'guru_id'             => $guruIdAktif,
                'guru_asli_id'        => $first->guru_id_asli,
                'kode_jadwal'         => $first->kode_jadwal,
                'nama_mapel'          => $first->nama_mapel,
                'nama_guru'           => $namaGuruAktif,
                'nama_guru_asli'      => $first->nama_guru_asli,
                'nama_guru_pengganti' => $first->nama_guru_pengganti,
                'status_pergantian'   => $statusPergantian,
                'is_digantikan'       => $isDisetujui,
                'status_kbm'          => $statusKbm,
                'warna_badge'         => $warnaBadge,
                'jam_sesi'            => $first->jam_mulai . ' - ' . $first->jam_selesai,
            ];
        })->values();

    });
});

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