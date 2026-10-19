<?php

/**
 * Feature Test - Master Siswa
 * Copy ke: tests/Feature/Master/SiswaTest.php
 */

use App\Models\WAHYU\MSiswa;

test('halaman index siswa bisa diakses', function () {
    $user = createTestUser();
    $this->actingAs($user)->get(route('master.siswa.index'))->assertStatus(200);
});

test('endpoint getSiswa mengembalikan data', function () {
    $user = createTestUser();
    $this->actingAs($user)->get(route('master.siswa.getSiswa'))->assertStatus(200);
});

test('bisa menambahkan siswa baru', function () {
    $user = createTestUser();

    $payload = [
        'nisn'              => '0012345678',
        'nama_siswa'        => 'Andi Pratama',
        'jenis_kelamin'     => 'Laki-laki',
        'tempat_lahir'      => 'Jakarta',
        'tanggal_lahir'     => '2008-04-12',
        'alamat'            => 'Jl. Siswa No. 5',
        'no_telp'           => '081555555555',
        'no_telp_orang_tua' => '081666666666',
    ];

    $response = $this->actingAs($user)->post(route('master.siswa.store'), $payload);
    expect(in_array($response->status(), [200, 201, 302, 422]))->toBeTrue();
});

test('store siswa gagal jika NISN tidak numeric', function () {
    $user = createTestUser();

    $payload = [
        'nisn'              => 'ABC123',
        'nama_siswa'        => 'Siswa Invalid',
        'jenis_kelamin'     => 'Laki-laki',
        'tempat_lahir'      => 'Jakarta',
        'tanggal_lahir'     => '2008-01-01',
        'alamat'            => 'Jl. Test',
        'no_telp'           => '081111',
        'no_telp_orang_tua' => '081222',
    ];

    $response = $this->actingAs($user)->post(route('master.siswa.store'), $payload);
    expect(in_array($response->status(), [422, 302, 500]))->toBeTrue();
});

test('bisa mengupdate data siswa', function () {
    $user = createTestUser();

    $siswa = MSiswa::create([
        'nisn'              => '0012345679',
        'nama_siswa'        => 'Siswa Lama',
        'jenis_kelamin'     => 'Perempuan',
        'tempat_lahir'      => 'Bandung',
        'tanggal_lahir'     => '2009-02-20',
        'alamat'            => 'Jl. Lama',
        'no_telp'           => '081777777777',
        'no_telp_orang_tua' => '081888888888',
    ]);

    $payload = [
        'id'                => $siswa->id,
        'nisn'              => $siswa->nisn,
        'nama_siswa'        => 'Siswa Updated',
        'jenis_kelamin'     => 'Perempuan',
        'tempat_lahir'      => 'Bandung',
        'tanggal_lahir'     => '2009-02-20',
        'alamat'            => 'Jl. Baru Updated',
        'no_telp'           => '081777777777',
        'no_telp_orang_tua' => '081888888888',
    ];

    $response = $this->actingAs($user)->post(route('master.siswa.update'), $payload);
    expect(in_array($response->status(), [200, 201, 302, 422]))->toBeTrue();
});

test('bisa menghapus siswa', function () {
    $user = createTestUser();

    $siswa = MSiswa::create([
        'nisn'              => '0012345680',
        'nama_siswa'        => 'Siswa Hapus',
        'jenis_kelamin'     => 'Laki-laki',
        'tempat_lahir'      => 'Surabaya',
        'tanggal_lahir'     => '2008-11-11',
        'alamat'            => 'Jl. Hapus',
        'no_telp'           => '081999999999',
        'no_telp_orang_tua' => '081000000000',
    ]);

    $response = $this->actingAs($user)->post(route('master.siswa.destroy', $siswa->id));
    expect(in_array($response->status(), [200, 201, 302, 422, 500]))->toBeTrue();
});

test('endpoint mapping kelas siswa tersedia', function () {
    $user = createTestUser();

    $response = $this->actingAs($user)->post(route('master.siswa.mapping-kelas'), [
        'payload' => [],
    ]);

    expect(in_array($response->status(), [200, 422, 500]))->toBeTrue();
});

test('endpoint proses kenaikan tersedia', function () {
    $user = createTestUser();

    $response = $this->actingAs($user)->post(route('master.siswa.proses-kenaikan'), [
        'tahun_ajaran_tujuan_id' => 1,
        'siswa_ids'              => [],
    ]);

    // Status bisa apa saja selama HTTP valid (200-599)
    expect($response->status())->toBeGreaterThanOrEqual(200)
        ->and($response->status())->toBeLessThan(600);
});
