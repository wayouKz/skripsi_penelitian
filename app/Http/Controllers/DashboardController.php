<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MMapel;
use App\Models\WAHYU\MSiswa;
use App\Models\WAHYU\MTahunAjaran;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $Guru  = MGuru::where('status', 'active')->count();
        $Siswa = MSiswa::where('status', 'active')->count();
        $Kelas = MKelas::where('status', 'active')->count();
        $Mapel = MMapel::where('status', 'active')->count();

        $total = [
            'Guru'  => $Guru,
            'Siswa' => $Siswa,
            'Kelas' => $Kelas,
            'Mapel' => $Mapel,
        ];

        return Inertia::render('Dashboard/Dashboard', compact('total'));
    }

    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }

    /**
     * Info perwalian + statistik kehadiran guru yang login.
     *
     * Catatan penting:
     * - t_absen_gurus = sesi GURU MELAKUKAN ABSENSI (berarti HADIR mengajar)
     * - 1 sesi unik = kombinasi (kode_jadwal + DATE(waktu_absen))
     */
    public function getInfoPerwalian(Request $request)
    {
        $guruId = Auth::user()->guru->id ?? null;

        if (!$guruId) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak terhubung ke data guru.',
                'data'    => null,
            ], 403);
        }

        $tahunAjaran   = MTahunAjaran::where('status', 'active')->first();
        $tahunAjaranId = $tahunAjaran ? $tahunAjaran->id : null;
        $mingguEfektif = 18; // Standar minggu efektif 1 semester

        $data = [
            'is_wali_kelas'         => false,
            'nama_kelas'            => null,
            'kelas_id'              => null,
            'tahun_ajaran_id'       => $tahunAjaranId,
            'total_siswa_perwalian' => 0,
            'rekap_kehadiran'       => ['hadir' => 0, 'izin' => 0, 'sakit' => 0, 'alpa' => 0],
            'persentase_kehadiran'  => 0,
            'list_siswa_perwalian'  => [],

            // Kehadiran guru
            'total_target_guru'         => 0,
            'total_hadir_guru'          => 0,
            'total_tidak_hadir_guru'    => 0,
            'total_absen_guru'          => 0, // kompatibilitas UI: = total_hadir_guru
            'persentase_kehadiran_guru' => 0,
            'jadwal_mengajar'           => [],
        ];

        // =========================================================
        // 1. Data perwalian (Siswa)
        // =========================================================
       $kelas = MKelas::where('id_wali_kelas', $guruId)->first();
$data['kelas_id']        = $kelas ? $kelas->id : null;
$data['tahun_ajaran_id'] = $tahunAjaranId;

$tanggalHariIni = now()->toDateString(); // Y-m-d

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

    // a. Jadwal unik kelas HARI INI (berdasarkan hari Indonesia)
    $hariIndo = [
        'Sunday'    => 'Minggu',
        'Monday'    => 'Senin',
        'Tuesday'   => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday'  => 'Kamis',
        'Friday'    => 'Jumat',
        'Saturday'  => 'Sabtu',
    ];
    $hariSekarang = $hariIndo[now()->format('l')] ?? null;

    $jumlahJadwalKelasHariIni = DB::table('t_jadwals')
        ->where('kelas_id', $kelas->id)
        ->when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))
        ->when($hariSekarang, fn ($q) => $q->where('hari', $hariSekarang))
        ->count(DB::raw('DISTINCT kode_jadwal'));

    // b. Target kehadiran hari ini =
    //    setiap siswa × jumlah jadwal kelas hari ini
    $totalTargetSiswaHariIni = $data['total_siswa_perwalian'] * $jumlahJadwalKelasHariIni;

    // c. Rekap absensi siswa HARI INI saja
    if ($tahunAjaranId) {
        $stats = DB::table('t_absen_siswas')
            ->join('t_list_siswas', 't_absen_siswas.siswa_id', '=', 't_list_siswas.siswa_id')
            ->where('t_list_siswas.kelas_id', $kelas->id)
            ->where('t_list_siswas.tahun_ajaran_id', $tahunAjaranId)
            ->where('t_absen_siswas.tahun_ajaran_id', $tahunAjaranId)
            // filter hari ini — sesuaikan nama kolom tanggal di tabel kamu
            ->whereDate('t_absen_siswas.created_at', $tanggalHariIni)
            // Jika ada kolom tanggal khusus, ganti baris di atas, contoh:
            // ->whereDate('t_absen_siswas.tanggal', $tanggalHariIni)
            // atau via kode_absen / join t_absen_gurus.waktu_absen:
            // ->whereExists(function ($sub) use ($tanggalHariIni) {
            //     $sub->select(DB::raw(1))
            //         ->from('t_absen_gurus')
            //         ->whereColumn('t_absen_gurus.kode_absen', 't_absen_siswas.kode_absen')
            //         ->whereDate('t_absen_gurus.waktu_absen', $tanggalHariIni);
            // })
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

    // d. Persentase kehadiran HARI INI
    $data['persentase_kehadiran'] = $totalTargetSiswaHariIni > 0
        ? round(($data['rekap_kehadiran']['hadir'] / $totalTargetSiswaHariIni) * 100, 2)
        : 0;
}

        // =========================================================
        // 2. Data kehadiran Guru
        // =========================================================
        // a. Jadwal unik guru di tahun ajaran aktif
        $jumlahJadwalGuru = DB::table('t_jadwals')
            ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
            ->where('t_list_guru_mapels.guru_id', $guruId)
            ->when($tahunAjaranId, fn ($q) => $q->where('t_jadwals.tahun_ajaran_id', $tahunAjaranId))
            ->count(DB::raw('DISTINCT t_jadwals.kode_jadwal'));

        // b. Target pertemuan 1 semester
        $totalTargetPertemuanGuru = $jumlahJadwalGuru * $mingguEfektif;

        // c. Total HADIR = sesi unik absensi yang sudah dilakukan guru
        //    (kode_jadwal + tanggal), difilter tahun ajaran lewat jadwal
        $totalHadirGuru = (int) DB::table('t_absen_gurus')
            ->where('t_absen_gurus.guru_id', $guruId)
            ->when($tahunAjaranId, function ($q) use ($tahunAjaranId) {
                $q->whereExists(function ($sub) use ($tahunAjaranId) {
                    $sub->select(DB::raw(1))
                        ->from('t_jadwals')
                        ->whereColumn('t_jadwals.kode_jadwal', 't_absen_gurus.kode_jadwal')
                        ->where('t_jadwals.tahun_ajaran_id', $tahunAjaranId);
                });
            })
            ->select(DB::raw(
                'COUNT(DISTINCT CONCAT(t_absen_gurus.kode_jadwal, "-", DATE(t_absen_gurus.waktu_absen))) as total'
            ))
            ->value('total');

        // d. Tidak hadir = target - hadir (tidak negatif)
        $totalTidakHadirGuru = max(0, $totalTargetPertemuanGuru - $totalHadirGuru);

        // e. Hasil akhir
        $data['total_target_guru']         = $totalTargetPertemuanGuru;
        $data['total_hadir_guru']          = $totalHadirGuru;
        $data['total_tidak_hadir_guru']    = $totalTidakHadirGuru;
        $data['total_absen_guru']          = $totalHadirGuru; // UI: "X Absensi"
        $data['persentase_kehadiran_guru'] = $totalTargetPertemuanGuru > 0
            ? round(($totalHadirGuru / $totalTargetPertemuanGuru) * 100, 2)
            : 0;

        // =========================================================
        // 3. Jadwal mengajar guru
        // =========================================================
        $data['jadwal_mengajar'] = DB::table('t_jadwals')
            ->join('m_mapels', 'm_mapels.id', '=', 't_jadwals.mapel_id')
            ->join('m_kelas', 'm_kelas.id', '=', 't_jadwals.kelas_id')
            ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
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

    /**
     * Rekap kehadiran 1 siswa (untuk chart di dashboard wali kelas).
     */
    public function getRekapKehadiranSiswa(Request $request)
    {
        $kelas_id        = $request->kelas_id;
        $tahun_ajaran_id = $request->tahun_ajaran_id;
        $siswa_id        = $request->siswa_id;
        $mapel_id        = $request->mapel_id;

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

        if (!empty($mapel_id)) {
            $query->where('t_jadwals.mapel_id', $mapel_id);
        }

        $raw_data = $query
            ->groupBy('t_jadwals.mapel_id', 'm_mapels.nama_mapel', 't_absen_siswas.status')
            ->get();

        // Mapel spesifik → rekap tunggal
        if (!empty($mapel_id)) {
            $rekap = ['hadir' => 0, 'izin' => 0, 'sakit' => 0, 'alpa' => 0];
            foreach ($raw_data as $item) {
                $statusKey = strtolower($item->status);
                if (array_key_exists($statusKey, $rekap)) {
                    $rekap[$statusKey] = (int) $item->total;
                }
            }

            return response()->json([
                'success' => true,
                'type'    => 'single',
                'data'    => $rekap,
            ]);
        }

        // Semua mapel → rincian per mapel + total
        $rincian_mapel      = [];
        $total_keseluruhan  = ['hadir' => 0, 'izin' => 0, 'sakit' => 0, 'alpa' => 0];

        foreach ($raw_data as $item) {
            $mId   = $item->mapel_id ?? 'lainnya';
            $mNama = $item->nama_mapel ?? 'Tanpa Mapel';
            $statusKey = strtolower($item->status);

            if (!isset($rincian_mapel[$mId])) {
                $rincian_mapel[$mId] = [
                    'mapel_id'   => $mId,
                    'nama_mapel' => $mNama,
                    'hadir'      => 0,
                    'izin'       => 0,
                    'sakit'      => 0,
                    'alpa'       => 0,
                ];
            }

            if (array_key_exists($statusKey, $total_keseluruhan)) {
                $rincian_mapel[$mId][$statusKey] = (int) $item->total;
                $total_keseluruhan[$statusKey]  += (int) $item->total;
            }
        }

        return response()->json([
            'success' => true,
            'type'    => 'all',
            'data'    => [
                'total_rekap'       => $total_keseluruhan,
                'rincian_per_mapel' => array_values($rincian_mapel),
            ],
        ]);
    }
}