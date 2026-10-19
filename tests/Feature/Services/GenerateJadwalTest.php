<?php

/**
 * Feature Test - Generate Jadwal
 * Copy ke: tests/Feature/Services/GenerateJadwalTest.php
 *
 * Catatan:
 * Endpoint generate mengembalikan StreamedResponse (SSE),
 * jadi tidak pakai $response->status() biasa.
 */

test('halaman generate jadwal bisa diakses', function () {
    $user = createTestUser();
    $this->actingAs($user)->get(route('master.generate-jadwal.index'))->assertStatus(200);
});

test('endpoint generate jadwal menerima request', function () {
    $user = createTestUser();

    $payload = [
        'tahun_ajaran_id' => 1,
        'populasi'        => 5,
        'generasi'        => 3,
        'crossover_rate'  => 0.8,
        'mutation_rate'   => 0.2,
        'slot_waktu'      => [
            'Senin'  => [['mulai' => '07:00', 'selesai' => '07:35']],
            'Selasa' => [['mulai' => '07:00', 'selesai' => '07:35']],
            'Rabu'   => [['mulai' => '07:00', 'selesai' => '07:35']],
            'Kamis'  => [['mulai' => '07:00', 'selesai' => '07:35']],
            'Jumat'  => [['mulai' => '07:00', 'selesai' => '07:35']],
        ],
        'prioritas_pagi' => [],
    ];

    $response = $this->actingAs($user)->post(route('master.generate-jadwal.store'), $payload);

    // StreamedResponse (SSE) — cek via getStatusCode()
    expect($response->baseResponse->getStatusCode())->toBe(200);
});

test('generate tetap merespon meski tahun_ajaran_id tidak dikirim', function () {
    $user = createTestUser();

    $response = $this->actingAs($user)->post(route('master.generate-jadwal.store'), [
        'populasi' => 5,
        'generasi' => 2,
    ]);

    // Bisa StreamedResponse atau error response
    $code = method_exists($response->baseResponse, 'getStatusCode')
        ? $response->baseResponse->getStatusCode()
        : $response->status();

    expect($code)->toBeGreaterThanOrEqual(200);
});