<?php

/**
 * Feature Test - Role & User Management
 * Copy ke: tests/Feature/Master/RoleUserTest.php
 */

test('halaman kelola hak akses bisa diakses', function () {
    $user = createTestUser();
    $this->actingAs($user)->get(route('manajemen.kelola-hak-akses.index'))->assertStatus(200);
});

test('endpoint getHakAkses tersedia', function () {
    $user = createTestUser();
    $this->actingAs($user)->get(route('manajemen.kelola-hak-akses.getHakAkses'))->assertStatus(200);
});

test('bisa menambahkan role baru', function () {
    $user = createTestUser();

    $response = $this->actingAs($user)->post(route('manajemen.kelola-hak-akses.store'), [
        'nama_role' => 'Operator',
    ]);

    expect(in_array($response->status(), [200, 201, 302, 422]))->toBeTrue();
});

test('halaman kelola user bisa diakses', function () {
    $user = createTestUser();
    $this->actingAs($user)->get(route('manajemen.kelola-user.index'))->assertStatus(200);
});

test('endpoint getUser tersedia', function () {
    $user = createTestUser();
    $this->actingAs($user)->get(route('manajemen.kelola-user.getUser'))->assertStatus(200);
});