<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TahunAjaranSeeder extends Seeder
{
    public static function run()
    {
        $dataTA = [
            ['tahun_ajaran' => '2026/2027', 'status' => 'active', 'semester' => 'Ganjil'],
        ];

        foreach ($dataTA as $ta) {
            DB::table('m_tahun_ajarans')->insert([
                'tahun_ajaran' => $ta['tahun_ajaran'],
                'status'       => $ta['status'],
                'semester'     => $ta['semester'],
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }
    }
}