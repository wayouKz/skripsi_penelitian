<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Role;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public static function run(): void
    {
        Role::create([
            'nama_roles' => 'Super Admin',
            'status' => 'active'
        ]);
    }
}