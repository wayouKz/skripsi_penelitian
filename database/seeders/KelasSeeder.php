<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KelasSeeder extends Seeder
{
    public static function run()
    {
        $dataJurusan = [
            ['nama_jurusan' => 'IPA'],
            ['nama_jurusan' => 'IPS'],
            ['nama_jurusan' => 'Bahasa'],
            ['nama_jurusan' => 'Agama'],
        ];
        $dataKelas = [
            ['nama_kelas' => 'X-1', 'status' => 'active', 'id_wali_kelas' => 1, 'tingkat' => 10],
            ['nama_kelas' => 'X-2', 'status' => 'active', 'id_wali_kelas' => 2, 'tingkat' => 10],
            ['nama_kelas' => 'X-3', 'status' => 'active', 'id_wali_kelas' => 3, 'tingkat' => 10],
            ['nama_kelas' => 'XI-1','jurusan_id' => 1, 'status' => 'active', 'id_wali_kelas' => 4, 'tingkat' => 11],
            ['nama_kelas' => 'XI-2', 'jurusan_id' => 1, 'status' => 'active', 'id_wali_kelas' => 5, 'tingkat' => 11],
            ['nama_kelas' => 'XI-3', 'jurusan_id' => 2,'status' => 'active', 'id_wali_kelas' => 6, 'tingkat' => 11],
            ['nama_kelas' => 'XII-1', 'status' => 'active', 'id_wali_kelas' => 7, 'tingkat' => 12],
            ['nama_kelas' => 'XII-2', 'status' => 'active', 'id_wali_kelas' => 8, 'tingkat' => 12],
            ['nama_kelas' => 'XII-3', 'status' => 'active', 'id_wali_kelas' => 9, 'tingkat' => 12],
        ];

        foreach ($dataJurusan as $jurusan) {
            DB::table('m_jurusans')->insert([
                'nama_jurusan' => $jurusan['nama_jurusan'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        foreach ($dataKelas as $kelas) {
            DB::table('m_kelas')->insert([
                'nama_kelas'    => $kelas['nama_kelas'],
                'status'        => $kelas['status'],
                'jurusan_id'    => $kelas['jurusan_id'] ?? null,
                'id_wali_kelas' => $kelas['id_wali_kelas'],
                'tingkat'       => $kelas['tingkat'],
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }
    }
}