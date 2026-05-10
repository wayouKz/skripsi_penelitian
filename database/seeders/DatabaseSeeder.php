<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        RolesSeeder::run();

        User::factory()->create([
            'nip' => null,
            'username' => 'superadmin',
            'name' => 'superadmin',
            'password' => Hash::make('superadmin'),
            'email' => 'test@example.com',
            'role_id' => 1
        ]);

        ListFeatureSeeder::run();
        ListFeatureByRoleSeeder::run();
    }
}
