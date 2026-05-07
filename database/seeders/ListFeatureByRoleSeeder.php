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

        // 🔹 id role admin (biasanya 1)
        $adminRoleId = 1;

        $data = [];

        foreach ($features as $feature) {
            $data[] = [
                'list_feature_id' => $feature->id,
                'role_id' => $adminRoleId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // 🔹 insert bulk
        DB::table('t_list_feature_by_roles')->insert($data);
    }
}
