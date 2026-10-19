<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

pest()->extend(Tests\TestCase::class)
    // ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions (global helpers untuk test)
|--------------------------------------------------------------------------
*/

use App\Models\Role;
use App\Models\User;

/**
 * Buat user testing dengan username + role_id yang valid.
 * Dipakai di semua Feature test.
 */
function createTestUser(array $override = []): User
{
    $role = Role::first();

    if (!$role) {
        $role = Role::create([
            'nama_roles' => 'Admin Test',
            'status'     => 'active',
        ]);
    }

    return User::factory()->create(array_merge([
        'role_id'  => $role->id,
        'username' => 'user_' . uniqid(),
    ], $override));
}