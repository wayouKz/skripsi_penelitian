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
                'route' => null,
                'icon' => 'fa-gauge',
                'deskripsi' => 'Ringkasan informasi dan statistik utama dari seluruh aktivitas sistem akademik.',
                'parent_id' => null,
                'order' => 1,
            ]);

            List_Feature::create([
                'label' => 'Dashboard',
                'route' => 'dashboard',
                'icon' => 'fa-home',
                'deskripsi' => 'Lihat statistik sekolah, grafik kehadiran, dan ringkasan data operasional harian.',
                'parent_id' => $dashboard->id,
                'order' => 1,
            ]);

            // 🔹 MANAJEMEN
            $manajemen = List_Feature::create([
                'label' => 'Manajemen',
                'icon' => 'fa-layer-group',
                'deskripsi' => 'Pusat kendali untuk mengelola hak akses, pengguna, dan pengaturan kalender akademik.',
                'parent_id' => null,
                'order' => 2,
            ]);

            List_Feature::insert([
                [
                    'label' => 'Manajemen User',
                    'route' => 'manajemen.kelola-user.index',
                    'icon' => 'fa-briefcase',
                    'deskripsi' => 'Kelola data akun pengguna sistem, termasuk penambahan akun baru dan reset kata sandi.',
                    'parent_id' => $manajemen->id,
                    'order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Hak Akses & Peran',
                    'icon' => 'fa-shield-alt',
                    'route' => 'manajemen.kelola-hak-akses.index',
                    'deskripsi' => 'Atur wewenang dan batasan fitur untuk setiap peran pengguna di dalam aplikasi.',
                    'parent_id' => $manajemen->id,
                    'order' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Tahun Ajaran',
                    'icon' => 'fa-calendar',
                    'route' => 'master.tahun-ajaran.index',
                    'deskripsi' => 'Atur periode tahun ajaran aktif dan kelola riwayat peralihan semester akademik.',
                    'parent_id' => $manajemen->id,
                    'order' => 3,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            // 🔹 AKADEMIK & PEMBELAJARAN (Fitur Baru)
          // 🔹 AKADEMIK & PROSES BELAJAR MENGAJAR (KBM)
$akademik = List_Feature::create([
    'label' => 'Akademik & KBM',
    'icon' => 'fa-graduation-cap',
    'deskripsi' => 'Pusat kendali aktivitas belajar mengajar, manajemen kelas yang diampu, absensi, dan jurnal kelas.',
    'parent_id' => null,
    'order' => 3, // Sesuaikan urutan menu utama Anda
]);

    List_Feature::insert([
        [
            'label' => 'Akademik',
            'icon' => 'fa-chalkboard-user',
            'route' => 'akademik.kelas-diampu.index',
            'deskripsi' => 'Daftar kelas dan mata pelajaran yang menjadi tanggung jawab mengajar Anda pada semester ini.',
            'parent_id' => $akademik->id,
            'order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

            // 🔹 MASTER DATA
            $master = List_Feature::create([
                'label' => 'Master Data',
                'icon' => 'fa-database',
                'deskripsi' => 'Kumpulan entitas data utama yang menjadi pondasi operasional dan akademik sekolah.',
                'parent_id' => null,
                'order' => 4, // Berubah dari 3 menjadi 4
            ]);

            List_Feature::insert([
                [
                    'label' => 'Daftar Siswa',
                    'icon' => 'fa-user-graduate',
                    'route' => 'master.siswa.index',
                    'deskripsi' => 'Kelola biodata lengkap siswa, pendaftaran, serta proses mutasi dan kenaikan kelas.',
                    'parent_id' => $master->id,
                    'order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Daftar Guru',
                    'icon' => 'fa-user-tie',
                    'route' => 'master.guru.index',
                    'deskripsi' => 'Kelola profil tenaga pendidik beserta status kepegawaian dan informasi penugasan.',
                    'parent_id' => $master->id,
                    'order' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Daftar Kelas',
                    'icon' => 'fa-door-open',
                    'route' => 'master.kelas.index',
                    'deskripsi' => 'Manajemen ruang kelas, pembagian tingkat, dan penentuan kapasitas rombongan belajar.',
                    'parent_id' => $master->id,
                    'order' => 3,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Daftar Mata Pelajaran',
                    'icon' => 'fa-book',
                    'route' => 'master.mapel.index',
                    'deskripsi' => 'Kelola struktur kurikulum dan daftar mata pelajaran untuk setiap tingkatan kelas.',
                    'parent_id' => $master->id,
                    'order' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'label' => 'Generate Jadwal Guru',
                    'icon' => 'fa-calendar-alt',
                    'route' => 'master.generate-jadwal.index',
                    'deskripsi' => 'Susun dan hasilkan jadwal mengajar secara otomatis untuk menghindari bentrok antar guru dan ruang.',
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
                'deskripsi' => 'Konfigurasi teknis dan pengaturan identitas dasar platform aplikasi.',
                'parent_id' => null,
                'order' => 5, // Berubah dari 4 menjadi 5
            ]);

            List_Feature::insert([
                [
                    'label' => 'Pengaturan Sistem',
                    'icon' => 'fa-sliders-h',
                    'route' => 'manajemen-aplikasi.kelola-informasi-instansi.index',
                    'deskripsi' => 'Sesuaikan profil instansi, logo, nama sekolah, dan visibilitas dasar aplikasi.',
                    'parent_id' => $sistem->id,
                    'order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

        });
    }
}
