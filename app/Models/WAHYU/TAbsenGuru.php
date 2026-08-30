<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class TAbsenGuru extends Model
{
    protected $guarded = ['id'];
    public static function historyAbsen(){
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

        return $data;
    }
}
