<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\List_Feature;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MMapel;
use App\Models\WAHYU\MSiswa;
use App\Models\WAHYU\MTahunAjaran;
use Carbon\CarbonPeriod;
use Gemini;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $Guru = MGuru::where('status','active')->count();
        $Siswa = MSiswa::where('status','active')->count();
        $Kelas = MKelas::where('status','active')->count();
        $Mapel = MMapel::where('status','active')->count();

        // $GuruPergantian = $this->getGuruPengganti();
        $total = [
            'Guru' => $Guru,
            'Siswa' => $Siswa,
            'Kelas' => $Kelas,
            'Mapel' => $Mapel
        ];

        return Inertia::render('Dashboard/Dashboard',compact('total'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    // public function assignGuruPengganti(Request $request){

    //     $fokus = $request->input('fokus_permintaan');
    //     $guruIdPengganti = $request->input('guru_id');
    //     $guruIdAsli = $fokus['guru_id'] ?? null;
    //     $kodeJadwal = $fokus['kode_jadwal'];
    //     $tanggal = date('Y-m-d');

    //     $data = [
    //     'kode_jadwal' => $kodeJadwal,
    //     'guru_id_pengganti' => $guruIdPengganti,
    //     'guru_id' => $guruIdAsli,
    //     'tanggal_pergantian' => $tanggal,
    //     'alasan' => $fokus['alasan'] ?? 'Tidak ada alasan yang diberikan',
    //     ];

    //     $save = DB::table('t_guru_penggantis')->insert($data);


    //     if(!$save){
    //         return response()->json(['success' => false, 'message' => 'Gagal menugaskan guru pengganti.'], 500);
    //     }else{
    //         return response()->json(['success' => true, 'message' => 'Guru pengganti berhasil ditugaskan.']);
    //     }
    // }

//     public function getGuruPengganti(){
//         $tanggal = date('Y-m-d');
//         // dd(Auth::user()->guru->id);


// $guruPengganti = DB::table('t_guru_penggantis')
//     ->select(
//         't_guru_penggantis.id',
//         't_guru_penggantis.kode_jadwal',
//         't_guru_penggantis.tanggal_pergantian',
//         't_guru_penggantis.status',
//         'guru_asli.nama_guru as nama_guru_asli',
//         'guru_asli.nip as nip_guru_asli',
//         'guru_pengganti.nama_guru as nama_guru_pengganti',
//         'm_mapels.nama_mapel',
//         'm_kelas.nama_kelas',
//         DB::raw('MIN(t_jadwals.jam_mulai) as jam_mulai'),
//         DB::raw('MAX(t_jadwals.jam_selesai) as jam_selesai')
//     )
//     ->leftJoin('t_jadwals', 't_guru_penggantis.kode_jadwal', '=', 't_jadwals.kode_jadwal')
//     // Tambahkan join ke t_list_guru_mapels agar data guru asli tidak null
//     ->leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
//     ->leftJoin('m_gurus as guru_asli', 't_list_guru_mapels.guru_id', '=', 'guru_asli.id')
//     ->leftJoin('m_gurus as guru_pengganti', 't_guru_penggantis.guru_id_pengganti', '=', 'guru_pengganti.id')
//     ->leftJoin('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
//     ->leftJoin('m_kelas', 't_jadwals.kelas_id', '=', 'm_kelas.id')
//     ->where('t_guru_penggantis.guru_id_pengganti', Auth::user()->guru->id ?? null)
//     ->whereDate('t_guru_penggantis.tanggal_pergantian', $tanggal )
//     // Hapus kolom jam dari groupBy agar data teragregasi menjadi 1 baris per jadwal
//     ->groupBy(
//         't_guru_penggantis.id',
//         't_guru_penggantis.kode_jadwal',
//         't_guru_penggantis.tanggal_pergantian',
//         't_guru_penggantis.status',
//         'guru_asli.nama_guru',
//         'guru_asli.nip',
//         'guru_pengganti.nama_guru',
//         'm_mapels.nama_mapel',
//         'm_kelas.nama_kelas'
//     )
//     ->orderBy('jam_mulai', 'asc')
//     ->get();
//       return  $guruPengganti;
//     }

    // public function terimaPermohonanPergantian(Request $request){
    //     $id = $request->input('id');
    //     $status = $request->input('status');
    //     $update = DB::table('t_guru_penggantis')
    //     ->where('id', $id)
    //     ->update([
    //         'status' => $status,
    //     ]);

    //     if(!$update){
    //         return response()->json(['success' => false, 'message' => 'Gagal menerima permohonan pergantian.'], 500);
    //     }else{
    //         return response()->json(['success' => true, 'message' => 'Permohonan pergantian berhasil '.$status.'.']);
    //     }
    // }

public function getInfoPerwalian(Request $request)
{
  $guruId = Auth::user()->guru->id;

$tahunAjaran   = MTahunAjaran::where('status', 'active')->first();
$tahunAjaranId = $tahunAjaran ? $tahunAjaran->id : null;
$mingguEfektif = 18; // Standar minggu efektif 1 semester

// Struktur default
$data = [
    'is_wali_kelas'         => false,
    'nama_kelas'            => null,
    'total_siswa_perwalian' => 0,
    'rekap_kehadiran'       => ['hadir' => 0, 'izin' => 0, 'sakit' => 0, 'alpa' => 0],
    'persentase_kehadiran'  => 0,
    'list_siswa_perwalian'  => [],

    'total_absen_guru'          => 0,
    'total_hadir_guru'          => 0,
    'persentase_kehadiran_guru' => 0,
    'jadwal_mengajar'           => [],
];

// =========================================================
// 1. Data perwalian (Siswa)
// =========================================================
$kelas = MKelas::where('id_wali_kelas', $guruId)->first();
$data['kelas_id'] = $kelas ? $kelas->id : null;
$data['tahun_ajaran_id'] = $tahunAjaranId;
if ($kelas) {
    $data['is_wali_kelas'] = true;
    $data['nama_kelas']    = $kelas->nama_kelas;

    $listSiswa = DB::table('t_list_siswas')
        ->join('m_siswas', 'm_siswas.id', '=', 't_list_siswas.siswa_id')
        ->where('t_list_siswas.kelas_id', $kelas->id)
        ->when($tahunAjaranId, function ($q) use ($tahunAjaranId) {
            $q->where('t_list_siswas.tahun_ajaran_id', $tahunAjaranId);
        })
        ->orderBy('m_siswas.nama_siswa', 'asc')
        ->select(
            'm_siswas.id as siswa_id',
            'm_siswas.nama_siswa',
            'm_siswas.jenis_kelamin',
            'm_siswas.nisn',
            't_list_siswas.tahun_ajaran_id',
            DB::raw("'{$kelas->nama_kelas}' as nama_kelas"),
            DB::raw("{$kelas->id} as kelas_id")
        )
        ->get();

    $data['list_siswa_perwalian']  = $listSiswa;
    $data['total_siswa_perwalian'] = $listSiswa->count();

    // a. Hitung total jadwal unik milik kelas perwalian
    $jumlahJadwalKelas = DB::table('t_jadwals')
        ->where('kelas_id', $kelas->id)
        ->when($tahunAjaranId, fn($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))
        ->count(DB::raw('DISTINCT kode_jadwal'));

    // b. Total target pertemuan seluruh siswa di kelas selama 1 semester
    $totalTargetSiswaSemester = $data['total_siswa_perwalian'] * $jumlahJadwalKelas * $mingguEfektif;

    // c. Rekap absensi siswa akumulasi 1 semester (tanpa filter tanggal hari ini)
    if ($tahunAjaranId) {
        $stats = DB::table('t_absen_siswas')
            ->join('t_list_siswas', 't_absen_siswas.siswa_id', '=', 't_list_siswas.siswa_id')
            ->where('t_list_siswas.kelas_id', $kelas->id)
            ->where('t_list_siswas.tahun_ajaran_id', $tahunAjaranId)
            ->groupBy('t_absen_siswas.status')
            ->select(DB::raw('count(*) as total'), 't_absen_siswas.status')
            ->get();

        foreach ($stats as $row) {
            $status = strtolower($row->status);

            if (array_key_exists($status, $data['rekap_kehadiran'])) {
                $data['rekap_kehadiran'][$status] = (int) $row->total;
            }
        }
    }

    // d. Hitung persentase kehadiran siswa se-semester
    $data['persentase_kehadiran'] = $totalTargetSiswaSemester > 0
        ? round(($data['rekap_kehadiran']['hadir'] / $totalTargetSiswaSemester) * 100, 2)
        : 0;
}

// =========================================================
// 2. Data kehadiran Guru
// =========================================================
// a. Hitung jadwal unik guru
$jumlahJadwalGuru = DB::table('t_jadwals')
    ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->where('t_list_guru_mapels.guru_id', $guruId)
    ->when($tahunAjaranId, fn($q) => $q->where('t_jadwals.tahun_ajaran_id', $tahunAjaranId))
    ->count(DB::raw('DISTINCT t_jadwals.kode_jadwal'));

// b. Total target pertemuan guru 1 semester
$totalTargetPertemuanGuru = $jumlahJadwalGuru * $mingguEfektif;

// c. Hitung total tidak hadir guru
$totalAbsenGuru = DB::table('t_absen_gurus')
    ->join('t_jadwals', 't_absen_gurus.kode_jadwal', '=', 't_jadwals.kode_jadwal')
    ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->where('t_list_guru_mapels.guru_id', $guruId)
    ->when($tahunAjaranId, fn($q) => $q->where('t_jadwals.tahun_ajaran_id', $tahunAjaranId))
    ->select('t_absen_gurus.kode_jadwal', DB::raw('DATE(t_absen_gurus.waktu_absen) as tgl'))
    ->groupBy('t_absen_gurus.kode_jadwal', DB::raw('DATE(t_absen_gurus.waktu_absen)'))
    ->get()
    ->count();

// d. Kalkulasi hasil akhir guru
$data['total_absen_guru']          = $totalAbsenGuru;
$data['total_hadir_guru']          = max(0, $totalTargetPertemuanGuru - $totalAbsenGuru);
$data['persentase_kehadiran_guru'] = $totalTargetPertemuanGuru > 0
    ? round(($data['total_hadir_guru'] / $totalTargetPertemuanGuru) * 100, 2)
    : 0;
    // =========================================================
    // 3. Jadwal mengajar guru
    // =========================================================
    $data['jadwal_mengajar'] = DB::table('t_jadwals')
        ->join('m_mapels', 'm_mapels.id', '=', 't_jadwals.mapel_id')
        ->join('m_kelas', 'm_kelas.id', '=', 't_jadwals.kelas_id')
        ->join('t_list_guru_mapels','t_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
        ->join('m_gurus', 't_list_guru_mapels.guru_id', '=', 'm_gurus.id')
        ->where('m_gurus.id', $guruId)
        ->when($tahunAjaranId, function ($q) use ($tahunAjaranId) {
            $q->where('t_jadwals.tahun_ajaran_id', $tahunAjaranId);
        })
        ->orderByRaw("FIELD(t_jadwals.hari, 'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')")
        ->orderBy('t_jadwals.jam_mulai')
        ->select(
            't_jadwals.id',
            't_jadwals.kode_jadwal',
            't_jadwals.hari',
            't_jadwals.jam_mulai',
            't_jadwals.jam_selesai',
            'm_mapels.nama_mapel',
            'm_kelas.nama_kelas'
        )
        ->get();

    // =========================================================
    // 4. Response
    // =========================================================
    return response()->json([
        'success' => true,
        'data'    => $data,
    ]);
}

    public function getRekapKehadiranSiswa(Request $request){
     $kelas_id = $request->kelas_id;
$tahun_ajaran_id = $request->tahun_ajaran_id;
$siswa_id = $request->siswa_id;
$mapel_id = $request->mapel_id;

$query = DB::table('t_absen_siswas')
    ->select(
        't_jadwals.mapel_id',
        'm_mapels.nama_mapel',
        't_absen_siswas.status',
        DB::raw('count(*) as total')
    )
    ->leftJoin('t_jadwals', 't_absen_siswas.kode_jadwal', '=', 't_jadwals.kode_jadwal')
    ->leftJoin('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
    ->where('t_absen_siswas.siswa_id', $siswa_id)
    ->where('t_absen_siswas.tahun_ajaran_id', $tahun_ajaran_id);

if (!empty($kelas_id)) {
    $query->where('t_jadwals.kelas_id', $kelas_id);
}

// Jika mapel_id spesifik dipilih
if (!empty($mapel_id)) {
    $query->where('t_jadwals.mapel_id', $mapel_id);
}

$raw_data = $query->groupBy('t_jadwals.mapel_id', 'm_mapels.nama_mapel', 't_absen_siswas.status')->get();

// Jika memilih mapel spesifik, kembalikan rekap total tunggal
if (!empty($mapel_id)) {
    $rekap = ['hadir' => 0, 'izin' => 0, 'sakit' => 0, 'alpa' => 0];
    foreach ($raw_data as $item) {
        $statusKey = strtolower($item->status);
        if (array_key_exists($statusKey, $rekap)) {
            $rekap[$statusKey] = (int) $item->total;
        }
    }
    return response()->json(['success' => true, 'type' => 'single', 'data' => $rekap]);
}

// Jika "Semua Mata Pelajaran", susun rincian per mapel
$rincian_mapel = [];
$total_keseluruhan = ['hadir' => 0, 'izin' => 0, 'sakit' => 0, 'alpa' => 0];

foreach ($raw_data as $item) {
    $mId = $item->mapel_id ?? 'lainnya';
    $mNama = $item->nama_mapel ?? 'Tanpa Mapel';
    $statusKey = strtolower($item->status);

    if (!isset($rincian_mapel[$mId])) {
        $rincian_mapel[$mId] = [
            'mapel_id' => $mId,
            'nama_mapel' => $mNama,
            'hadir' => 0,
            'izin' => 0,
            'sakit' => 0,
            'alpa' => 0,
        ];
    }

    if (array_key_exists($statusKey, $total_keseluruhan)) {
        $rincian_mapel[$mId][$statusKey] = (int) $item->total;
        $total_keseluruhan[$statusKey] += (int) $item->total;
    }
}

return response()->json([
    'success' => true,
    'type' => 'all',
    'data' => [
        'total_rekap' => $total_keseluruhan,
        'rincian_per_mapel' => array_values($rincian_mapel)
    ]
]);

    }
}
