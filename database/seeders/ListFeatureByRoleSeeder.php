<?php

namespace Database\Seeders;

use App\Models\List_Feature;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ListFeatureByRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
       public static function run(): void
    {
        // 🔹 ambil semua feature
     $features = List_Feature::all();

        $data = [];

        // 2. Definisikan ID Fitur apa saja yang boleh diakses oleh Guru (Role ID: 2)
        // Berdasarkan gambar phpMyAdmin Anda: ID 7, 8, 9, 10, 11 masuk ke Role 2
      // 1. Tentukan menu KHUSUS untuk Guru saja (ID 2 dan menu KBM)
$guruFeatureIds = [1,2, 7, 8];

$kecualiAdminIds = [7, 8];

foreach ($features as $feature) {

    // 🔹 GENERATE UNTUK ROLE 1 (SUPER ADMIN)
    // ID 2 akan aman masuk ke Admin karena tidak ada di dalam $kecualiAdminIds
    if (!in_array($feature->id, $kecualiAdminIds)) {
        $data[] = [
            'list_feature_id' => $feature->id,
            'role_id'         => 1, // Admin / Super Admin
            'can_view'        => true,
            'can_create'      => true,
            'can_update'      => true,
            'can_delete'      => true,
            'order'           => $feature->order ?? 0,
            'created_at'      => now(),
            'updated_at'      => now(),
        ];
    }

    // 🔹 GENERATE UNTUK ROLE 2 (GURU)
    // ID 2 akan masuk ke Guru karena terdaftar di $guruFeatureIds
    if (in_array($feature->id, $guruFeatureIds)) {
        $data[] = [
            'list_feature_id' => $feature->id,
            'role_id'         => 2, // Guru
            'can_view'        => true,
            'can_create'      => true,
            'can_update'      => true,
            'can_delete'      => true,
            'order'           => $feature->order ?? 0,
            'created_at'      => now(),
            'updated_at'      => now(),
        ];
    }
}
        // 3. truncate/kosongkan tabel terlebih dahulu agar tidak duplikat saat dijalankan ulang
        DB::table('t_list_feature_by_roles')->truncate();

        // 4. Insert bulk ke database
        DB::table('t_list_feature_by_roles')->insert($data);
    }
}