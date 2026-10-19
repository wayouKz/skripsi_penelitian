<?php

/**
 * Feature Test - Authentication
 * Login: username + password + captcha, status harus active
 *
 * Copy ke: tests/Feature/Auth/AuthenticationTest.php
 */

use Illuminate\Support\Facades\Validator;

beforeEach(function () {
    // Bypass validasi captcha di environment testing
    Validator::extend('captcha', fn () => true);
});

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = createTestUser([
        'password' => 'password',
        'status'   => 'active',
    ]);

    $response = $this->post('/login', [
        'username' => $user->username,
        'password' => 'password',
        'captcha'  => 'bypass', // lolos karena Validator::extend di beforeEach
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = createTestUser([
        'password' => 'password',
        'status'   => 'active',
    ]);

    $this->post('/login', [
        'username' => $user->username,
        'password' => 'wrong-password',
        'captcha'  => 'bypass',
    ]);

    $this->assertGuest();
});

test('users can not authenticate with unknown username', function () {
    $this->post('/login', [
        'username' => 'tidak_ada_user_xyz',
        'password' => 'password',
        'captcha'  => 'bypass',
    ]);

    $this->assertGuest();
});

test('users nonactive cannot login', function () {
    $user = createTestUser([
        'password' => 'password',
        'status'   => 'nonactive',
    ]);

    $this->post('/login', [
        'username' => $user->username,
        'password' => 'password',
        'captcha'  => 'bypass',
    ]);

    // Auth::attempt butuh status=active → harus gagal
    $this->assertGuest();
});

test('users can logout', function () {
    $user = createTestUser([
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});
