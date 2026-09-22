<?php

namespace App\Http\Controllers\Akademik;

use App\Http\Controllers\Controller;
use App\Models\WAHYU\TAbsenGuru;
use App\Models\WAHYU\TAbsenSiswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AbsenController extends Controller
{
public function store(Request $request)
{
    // 1. Ambil data dari request frontend
    $dataAbsensi = $request->data_absensi;
    $kode_jadwal = $request->kode_jadwal;
    $tahun_ajaran_id = $request->tahun_ajaran_id;

    $tanggal = date('Y-m-d');
    $jam = date('H:i:s');

    // Generate kode sesi absensi
    $kodeSesiAbsensi = 'ABS-' . strtoupper(Str::random(6)) . '-' . date('Ymd');

    // 2. Siapkan array penampung
    $dataToInsert = [];
    $now = now();
    $cekSudahAbsen = TAbsenGuru::leftJoin('t_absen_siswas', 't_absen_gurus.kode_absen', '=', 't_absen_siswas.kode_absen')
    ->where('t_absen_gurus.waktu_absen', $tanggal)
    ->where('t_absen_siswas.kode_jadwal', $kode_jadwal)->exists();
    if($cekSudahAbsen) {
        return response()->json([
            'status' => 'error',
            'message' => 'Sudah Absen Pada Mata Pelajaran Ini Hari Ini',
        ]);
    }
    foreach($dataAbsensi as $item) {
        $dataToInsert[] = [
            'siswa_id'       => $item['siswa_id'],
            'kode_absen'    => $kodeSesiAbsensi,
            'kode_jadwal'     => $kode_jadwal,
            'tahun_ajaran_id' => $tahun_ajaran_id,
            'tanggal_absen'   => $tanggal,
            'pertemuan'       => $item['pertemuan'],
            'waktu'             => $jam,
            'nisn'            => $item['nisn'],
            'status'          => $item['status_kehadiran'],
            'created_at'      => $now,
            'updated_at'      => $now,
        ];
    }
    $dataInserGuru = [
        'kode_absen'    => $kodeSesiAbsensi,
        'kode_jadwal'     => $kode_jadwal,
        'nip'             => Auth::user()->nip,
        'waktu_absen'   => $tanggal,
        'waktu'             => $jam,
    ];

    TAbsenSiswa::insert($dataToInsert);

    // 4. Lakukan Bulk Insert menggunakan Model secara langsung
    TAbsenGuru::insert($dataInserGuru);

    // 5. Kembalikan Response ke Axios (React) agar alert sukses muncul
    return response()->json([
        'success' => true,
        'message' => 'Absensi berhasil disimpan!',
        'kode_sesi' => $kodeSesiAbsensi
    ], 200);
}

}