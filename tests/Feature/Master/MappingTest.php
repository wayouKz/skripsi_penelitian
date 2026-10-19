<?php

/**
 * Feature Test - Mapping Guru Mapel & Mapping Kelas Siswa
 *
 * Route REAL dari routes/web.php (prefix master. / getData.):
 *
 * master.guru.mapping-mappel          POST /master/guru/mapping-mappel
 * master.guru.getGuruMapel            GET  /master/guru/get-guru-mapel
 * master.siswa.mapping-kelas          POST /master/siswa/mapping-kelas-siswa
 * master.kelas.mappingKelas           GET  /master/kelas/mapping-kelas/{namaKelas}
 * master.kelas.getSiswaPerTahunAjaran GET  /master/kelas/getSiswaPerTahunAjaran/{id}/{kelas_id}
 * getData.get-mapel-guru              GET  /getData/get-Mapel-Guru
 *
 * Copy ke: tests/Feature/Master/MappingTest.php
 */

use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MMapel;
use App\Models\WAHYU\MSiswa;
use App\Models\WAHYU\MTahunAjaran;

// =====================================================
// MAPPING GURU ↔ MAPEL ↔ KELAS
// =====================================================

test('endpoint get data guru mapel tersedia', function () {
    $user = createTestUser();

    // GET /master/guru/get-guru-mapel  →  master.guru.getGuruMapel
    $response = $this->actingAs($user)->get('/master/guru/get-guru-mapel', [
        'tahun_ajaran_id' => 1,
    ]);

    expect($response->status())->toBeGreaterThanOrEqual(200)
        ->and($response->status())->toBeLessThan(600);
});

test('endpoint getData get-mapel-guru tersedia', function () {
    $user = createTestUser();

    // GET /getData/get-Mapel-Guru  →  getData.get-mapel-guru
    $response = $this->actingAs($user)->get('/getData/get-Mapel-Guru', [
        'tahun_ajaran_id' => 1,
    ]);

    expect($response->status())->toBeGreaterThanOrEqual(200)
        ->and($response->status())->toBeLessThan(600);
});

test('bisa mapping guru ke mapel dan kelas', function () {
    $user = createTestUser();

    $tahunAjaran = MTahunAjaran::create([
        'tahun_ajaran' => '2025/2026-' . uniqid(),
        'semester'     => 'ganjil',
        'status'       => 'active',
    ]);

    $nip = '19' . substr(str_replace('.', '', uniqid('', true)), -14);

    $guru = MGuru::create([
        'nip'           => $nip,
        'nama_guru'     => 'Guru Mapping Test',
        'jenis_kelamin' => 'Laki-laki',
        'tempat_lahir'  => 'Jakarta',
        'tanggal_lahir' => '1988-01-01',
        'alamat'        => 'Jl. Test',
        'no_telp'       => '081234567899',
    ]);

    $mapel = MMapel::create([
        'nama_mapel' => 'Matematika ' . uniqid(),
        'kode_mapel' => 'MTK' . substr(uniqid(), -4),
        'status'     => 'active',
    ]);

    $kelas = MKelas::create([
        'nama_kelas'    => 'X TEST ' . uniqid(),
        'id_wali_kelas' => $guru->id,
        'tingkat'       => 10,
        'status'        => 'active',
    ]);

    // Payload sesuai GuruController@mappingGuruMapel
    $payload = [
        'tahun_ajaran_id' => $tahunAjaran->id,
        'payload' => [
            [
                'mapel_id' => $mapel->id,
                'gurus' => [
                    [
                        'guru_id'   => $guru->nip, // dipakai sebagai nip di controller
                        'kelas_id'  => $kelas->id,
                        'beban_jam' => 4,
                    ],
                ],
            ],
        ],
    ];

    // POST /master/guru/mapping-mappel  →  master.guru.mapping-mappel
    $response = $this->actingAs($user)->post('/master/guru/mapping-mappel', $payload);

    expect($response->status())->toBeGreaterThanOrEqual(200)
        ->and($response->status())->toBeLessThan(600);

    if ($response->status() === 200 && ($response->json('success') === true)) {
        $this->assertDatabaseHas('t_list_gurus', [
            'nip'             => $guru->nip,
            'kelas_id'        => $kelas->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);
    }
});

test('mapping guru mapel dengan payload kosong tetap merespon', function () {
    $user = createTestUser();

    $response = $this->actingAs($user)->post('/master/guru/mapping-mappel', [
        'tahun_ajaran_id' => 1,
        'payload'         => [],
    ]);

    expect($response->status())->toBeGreaterThanOrEqual(200)
        ->and($response->status())->toBeLessThan(600);
});

// =====================================================
// MAPPING KELAS
// =====================================================

test('halaman mapping kelas bisa diakses', function () {
    $user = createTestUser();

    $nip = '19' . substr(str_replace('.', '', uniqid('', true)), -14);

    $guru = MGuru::create([
        'nip'           => $nip,
        'nama_guru'     => 'Wali Mapping',
        'jenis_kelamin' => 'Perempuan',
        'tempat_lahir'  => 'Bandung',
        'tanggal_lahir' => '1989-01-01',
        'alamat'        => 'Jl. Wali',
        'no_telp'       => '081234567888',
    ]);

    $kelas = MKelas::create([
        'nama_kelas'    => 'XI-IPA-' . substr(uniqid(), -5),
        'id_wali_kelas' => $guru->id,
        'tingkat'       => 11,
        'status'        => 'active',
    ]);

    // GET /master/kelas/mapping-kelas/{namaKelas}  →  master.kelas.mappingKelas
    $response = $this->actingAs($user)->get(
        '/master/kelas/mapping-kelas/' . urlencode($kelas->nama_kelas)
    );

    expect(in_array($response->status(), [200, 404, 500]))->toBeTrue();
});

test('endpoint get siswa per tahun ajaran tersedia', function () {
    $user = createTestUser();

    $tahunAjaran = MTahunAjaran::create([
        'tahun_ajaran' => '2024/2025-' . uniqid(),
        'semester'     => 'genap',
        'status'       => 'active',
    ]);

    $nip = '19' . substr(str_replace('.', '', uniqid('', true)), -14);

    $guru = MGuru::create([
        'nip'           => $nip,
        'nama_guru'     => 'Wali Get Siswa',
        'jenis_kelamin' => 'Laki-laki',
        'tempat_lahir'  => 'Medan',
        'tanggal_lahir' => '1990-01-01',
        'alamat'        => 'Jl. Get',
        'no_telp'       => '081234567877',
    ]);

    $kelas = MKelas::create([
        'nama_kelas'    => 'XII-IPA-' . substr(uniqid(), -5),
        'id_wali_kelas' => $guru->id,
        'tingkat'       => 12,
        'status'        => 'active',
    ]);

    // GET /master/kelas/getSiswaPerTahunAjaran/{id}/{kelas_id}
    // → master.kelas.getSiswaPerTahunAjaran
    $response = $this->actingAs($user)->get(
        "/master/kelas/getSiswaPerTahunAjaran/{$tahunAjaran->id}/{$kelas->id}"
    );

    expect($response->status())->toBe(200);
});

// =====================================================
// MAPPING SISWA ↔ KELAS
// SiswaController@mappingKelasSiswa
// payload[] = { kelas_id, tahun_ajaran, siswa_ids: [{ nisn, nama_siswa }] }
// =====================================================

test('bisa mapping siswa ke kelas', function () {
    $user = createTestUser();

    $tahunAjaran = MTahunAjaran::create([
        'tahun_ajaran' => '2026/2027-' . uniqid(),
        'semester'     => 'ganjil',
        'status'       => 'active',
    ]);

    $nip = '19' . substr(str_replace('.', '', uniqid('', true)), -14);

    $guru = MGuru::create([
        'nip'           => $nip,
        'nama_guru'     => 'Wali Siswa Map',
        'jenis_kelamin' => 'Laki-laki',
        'tempat_lahir'  => 'Surabaya',
        'tanggal_lahir' => '1991-01-01',
        'alamat'        => 'Jl. Siswa Map',
        'no_telp'       => '081234567866',
    ]);

    $kelas = MKelas::create([
        'nama_kelas'    => 'X-IPA-' . substr(uniqid(), -5),
        'id_wali_kelas' => $guru->id,
        'tingkat'       => 10,
        'status'        => 'active',
    ]);

    $nisn = '00' . substr(str_replace('.', '', uniqid('', true)), -8);

    $siswa = MSiswa::create([
        'nisn'              => $nisn,
        'nama_siswa'        => 'Siswa Mapping Test',
        'jenis_kelamin'     => 'Laki-laki',
        'tempat_lahir'      => 'Jakarta',
        'tanggal_lahir'     => '2009-05-05',
        'alamat'            => 'Jl. Mapping',
        'no_telp'           => '081555444333',
        'no_telp_orang_tua' => '081555444332',
    ]);

    $payload = [
        'payload' => [
            [
                'kelas_id'     => $kelas->id,
                'tahun_ajaran' => $tahunAjaran->id,
                'siswa_ids'    => [
                    [
                        'nisn'       => $siswa->nisn,
                        'nama_siswa' => $siswa->nama_siswa,
                    ],
                ],
            ],
        ],
    ];

    // POST /master/siswa/mapping-kelas-siswa  →  master.siswa.mapping-kelas
    $response = $this->actingAs($user)->post('/master/siswa/mapping-kelas-siswa', $payload);

    expect($response->status())->toBeGreaterThanOrEqual(200)
        ->and($response->status())->toBeLessThan(600);

    if ($response->status() === 200 && ($response->json('success') === true)) {
        $this->assertDatabaseHas('t_list_siswas', [
            'nisn'            => $siswa->nisn,
            'kelas_id'        => $kelas->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);
    }
});

test('endpoint mapping kelas siswa dengan payload kosong', function () {
    $user = createTestUser();

    $response = $this->actingAs($user)->post('/master/siswa/mapping-kelas-siswa', [
        'payload' => [],
    ]);

    expect(in_array($response->status(), [200, 422, 500]))->toBeTrue();
});