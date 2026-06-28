<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WAHYU\MSiswa as Siswa;
use Faker\Factory as Faker;

class SiswaSeeder extends Seeder
{
    public static function run(): void
    {
        $faker = Faker::create('id_ID');

        for ($i = 1; $i <= 1000; $i++) {
            Siswa::create([
                'nisn' => str_pad($i, 10, '0', STR_PAD_LEFT),
                'nama_siswa' => $faker->name(),
                'jenis_kelamin' => $faker->randomElement([
                    'Laki-laki',
                    'Perempuan'
                ]),
                'tempat_lahir' => $faker->city(),
                'tanggal_lahir' => $faker->dateTimeBetween('-18 years', '-5 years')
                    ->format('Y-m-d'),
                'agama' => $faker->randomElement([
                    'Islam',
                    'Kristen',
                    'Katolik',
                    'Hindu',
                    'Buddha',
                    'Konghucu'
                ]),
                'alamat' => $faker->address(),
                'no_telp' => '08' . $faker->numerify('##########'),
                'no_telp_orang_tua' => '08' . $faker->numerify('##########'),
                'foto' => null,
                'status' => $faker->randomElement([
                    'active',
                    'nonactive'
                ]),
            ]);
        }
    }
}
