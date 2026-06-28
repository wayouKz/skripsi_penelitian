<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class GuruSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public static function run()
    {
        // Menggunakan locale bahasa Indonesia
        $faker = Faker::create('id_ID');
$faker = Faker::create('id_ID');

        // Looping untuk membuat 20 data dummy
        for ($i = 0; $i < 20; $i++) {
            $jenisKelamin = $faker->randomElement(['Laki-laki', 'Perempuan']);
            $genderType = $jenisKelamin === 'Laki-laki' ? 'male' : 'female';
            $nama = $faker->name($genderType);
            $nip = $faker->unique()->numerify('19##########'); // Generate NIP guru terlebih dahulu

            // 1. Insert data ke tabel m_gurus terlebih dahulu (Tanpa user_id)
            DB::table('m_gurus')->insert([
                'nama_guru'     => $nama,
                'jenis_kelamin' => $jenisKelamin,
                'tempat_lahir'  => $faker->city(),
                'tanggal_lahir' => $faker->date('Y-m-d', '1998-12-31'),
                'alamat'        => $faker->address(),
                'no_telp'       => $faker->phoneNumber(),
                'nip'           => $nip,
                'status'        => $faker->randomElement(['active', 'active', 'nonactive']),
                'created_at'    => Carbon::now(),
                'updated_at'    => Carbon::now(),
            ]);

            // 2. Insert ke model User mengambil data dari variabel NIP & Nama guru di atas
            User::create([
                'name'              => $nama,
                'username'          => $nip,
                'email'             => $nip . '@sekolah.sch.id', // Username/Email menggunakan NIP guru
                'nip'               => $nip,
                'email_verified_at' => Carbon::now(),
                'password'          => Hash::make($nip), // Password default juga menggunakan NIP
                'role_id' => 2,
                'created_at'        => Carbon::now(),
                'updated_at'        => Carbon::now(),
            ]);
        }
    }
}
