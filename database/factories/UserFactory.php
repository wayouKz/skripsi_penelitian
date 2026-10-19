<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 *
 * Copy ke: database/factories/UserFactory.php (replace yang lama)
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        // Pastikan ada role (dibutuhkan karena role_id NOT NULL + FK)
        $role = Role::first();
        if (!$role) {
            $role = Role::create([
                'nama_roles' => 'Admin',
                'status'     => 'active',
            ]);
        }

        return [
            'username'          => fake()->unique()->userName(),
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'role_id'           => $role->id,
            'status'            => 'active',
            'remember_token'    => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
