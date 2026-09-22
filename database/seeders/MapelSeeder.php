<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MapelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public static function run()
    {
        // Daftar mata pelajaran umum yang lebih realistis
        $daftarMapel = [
            ['nama' => 'Pendidikan Agama Islam', 'kode' => 'PAI'],
            ['nama' => 'Pendidikan Pancasila dan Kewarganegaraan', 'kode' => 'PPKN'],
            ['nama' => 'Bahasa Indonesia', 'kode' => 'BIND'],
            ['nama' => 'Matematika', 'kode' => 'MTK'],
            ['nama' => 'Ilmu Pengetahuan Alam', 'kode' => 'IPA'],
            ['nama' => 'Ilmu Pengetahuan Sosial', 'kode' => 'IPS'],
            ['nama' => 'Bahasa Inggris', 'kode' => 'BING'],
            ['nama' => 'Seni Budaya', 'kode' => 'SBD'],
            ['nama' => 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'kode' => 'PJOK'],
            ['nama' => 'Prakarya', 'kode' => 'PRK'],
            ['nama' => 'Teknologi Informasi dan Komunikasi', 'kode' => 'TIK'],
            ['nama' => 'Fisika', 'kode' => 'FIS'],
            ['nama' => 'Kimia', 'kode' => 'KIM'],
            ['nama' => 'Biologi', 'kode' => 'BIO'],
            ['nama' => 'Sejarah', 'kode' => 'SJH'],
        ];

        $data = [];

        foreach ($daftarMapel as $mapel) {
            $data[] = [
                'nama_mapel' => $mapel['nama'],
                'kode_mapel' => $mapel['kode'],
                'status'     => 'active', // Mayoritas mapel statusnya aktif
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        // Insert data ke tabel m_mapels
        DB::table('m_mapels')->insert($data);
    }
}
