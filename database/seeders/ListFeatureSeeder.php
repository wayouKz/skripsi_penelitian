<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\List_Feature;

class ListFeatureSeeder extends Seeder
{
    public static function run(): void
    {
        DB::transaction(function () {

            // 🔹 DASHBOARD
            $dashboard = List_Feature::create([
                'label' => 'Dashboard',
                'route' => 'dashboard',
                'icon' => 'fa-home',
                'deskripsi' => 'Halaman dashboard',
                'parent_id' => null,
                'order' => 1,
            ]);

            // 🔹 MANAJEMEN
            $manajemen = List_Feature::create([
                'label' => 'Manajemen',
                'icon' => 'fa-layer-group',
                'deskripsi' => 'Menu manajemen',
                'parent_id' => null,
                'order' => 2,
            ]);

            List_Feature::insert([
                [
                    'label' => 'Manajemen User',
                    'route' => 'manajemen.index',
                    'icon' => 'fa-briefcase',
                    'deskripsi' => 'Kelola manajemen',
                    'parent_id' => $manajemen->id,
                    'order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Hak Akses & Peran',
                    'icon' => 'fa-shield-alt',
                    'route' => 'roles.index',
                    'deskripsi' => 'Kelola role',
                    'parent_id' => $manajemen->id,
                    'order' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Tahun Ajaran',
                    'icon' => 'fa-calendar',
                    'route' => 'tahun.index',
                    'deskripsi' => 'Kelola tahun ajaran',
                    'parent_id' => $manajemen->id,
                    'order' => 3,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            // 🔹 MASTER DATA
            $master = List_Feature::create([
                'label' => 'Master Data',
                'icon' => 'fa-database',
                'deskripsi' => 'Data utama',
                'parent_id' => null,
                'order' => 3,
            ]);

            List_Feature::insert([
                [
                    'label' => 'Daftar Kelas',
                    'icon' => 'fa-building',
                    'route' => 'kelas.index',
                    'deskripsi' => 'Data kelas',
                    'parent_id' => $master->id,
                    'order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Daftar Guru',
                    'icon' => 'fa-user-tie',
                    'route' => 'guru.index',
                    'deskripsi' => 'Data guru',
                    'parent_id' => $master->id,
                    'order' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Daftar Mata Pelajaran',
                    'icon' => 'fa-book',
                    'route' => 'mapel.index',
                    'deskripsi' => 'Data mapel',
                    'parent_id' => $master->id,
                    'order' => 3,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Generate Jadwal Guru',
                    'icon' => 'fa-calendar-alt',
                    'route' => 'jadwal.generate',
                    'deskripsi' => 'Generate jadwal',
                    'parent_id' => $master->id,
                    'order' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Daftar Siswa',
                    'icon' => 'fa-user-graduate',
                    'route' => 'siswa.index',
                    'deskripsi' => 'Data siswa',
                    'parent_id' => $master->id,
                    'order' => 5,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            // 🔹 SISTEM
            $sistem = List_Feature::create([
                'label' => 'Sistem',
                'icon' => 'fa-cog',
                'deskripsi' => 'Pengaturan sistem',
                'parent_id' => null,
                'order' => 4,
            ]);

            List_Feature::insert([
                [
                    'label' => 'Pengaturan Sistem',
                    'icon' => 'fa-sliders-h',
                    'route' => 'settings.index',
                    'deskripsi' => 'Setting aplikasi',
                    'parent_id' => $sistem->id,
                    'order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

        });
    }
}
