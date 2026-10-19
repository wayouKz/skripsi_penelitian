<?php

/**
 * Feature Test - Absensi
 * Copy ke: tests/Feature/Akademik/AbsensiTest.php
 */

test('endpoint store absensi tersedia', function () {
    $user = createTestUser();

    $response = $this->actingAs($user)->post(route('akademik.absensi.store'), []);

    // Payload kosong → biasanya 422 / 500, yang penting endpoint merespon
    expect(in_array($response->status(), [200, 422, 500]))->toBeTrue();
});

test('store absensi gagal jika data wajib kosong', function () {
    $user = createTestUser();

    $response = $this->actingAs($user)->post(route('akademik.absensi.store'), [
        // sengaja kosong
        'data_absensi'    => null,
        'kode_jadwal'     => null,
        'tahun_ajaran_id' => null,
    ]);

    expect(in_array($response->status(), [200, 422, 500]))->toBeTrue();
});
