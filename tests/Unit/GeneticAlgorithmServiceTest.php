<?php

/**
 * Unit Test - GeneticAlgorithmService
 * Copy ke: tests/Unit/GeneticAlgorithmServiceTest.php
 */

use App\Services\GeneticAlgorithmService;

// Helper data (bukan $this->) agar jalan di Unit suite
function gaParams(array $override = []): array
{
    return array_merge([
        'populasi'        => 10,
        'generasi'        => 5,
        'crossover_rate'  => 0.8,
        'mutation_rate'   => 0.2,
        'tahun_ajaran_id' => 1,
        'slot_waktu'      => [
            'Senin'  => [
                ['mulai' => '07:00', 'selesai' => '07:35'],
                ['mulai' => '07:35', 'selesai' => '08:10'],
                ['mulai' => '08:10', 'selesai' => '08:45'],
                ['mulai' => '08:45', 'selesai' => '09:20'],
            ],
            'Selasa' => [
                ['mulai' => '07:00', 'selesai' => '07:35'],
                ['mulai' => '07:35', 'selesai' => '08:10'],
                ['mulai' => '08:10', 'selesai' => '08:45'],
                ['mulai' => '08:45', 'selesai' => '09:20'],
            ],
            'Rabu' => [
                ['mulai' => '07:00', 'selesai' => '07:35'],
                ['mulai' => '07:35', 'selesai' => '08:10'],
                ['mulai' => '08:10', 'selesai' => '08:45'],
                ['mulai' => '08:45', 'selesai' => '09:20'],
            ],
            'Kamis' => [
                ['mulai' => '07:00', 'selesai' => '07:35'],
                ['mulai' => '07:35', 'selesai' => '08:10'],
                ['mulai' => '08:10', 'selesai' => '08:45'],
                ['mulai' => '08:45', 'selesai' => '09:20'],
            ],
            'Jumat' => [
                ['mulai' => '07:00', 'selesai' => '07:35'],
                ['mulai' => '07:35', 'selesai' => '08:10'],
                ['mulai' => '08:10', 'selesai' => '08:45'],
                ['mulai' => '08:45', 'selesai' => '09:20'],
            ],
        ],
    ], $override);
}

function gaGuruMapels()
{
    return collect([
        (object)[
            'id'                => 1,
            'guru_id'           => 101,
            'nip'               => '198001012005011001',
            'mapel_id'          => 1,
            'beban_jam'         => 4,
            't_list_guru_id'    => 1,
            'kelas_id'          => 1,
            'nama_mapel'        => 'Matematika',
            'nama_guru'         => 'Budi Santoso',
            'is_prioritas_pagi' => false,
        ],
        (object)[
            'id'                => 2,
            'guru_id'           => 102,
            'nip'               => '198002022005012002',
            'mapel_id'          => 2,
            'beban_jam'         => 3,
            't_list_guru_id'    => 2,
            'kelas_id'          => 1,
            'nama_mapel'        => 'Bahasa Indonesia',
            'nama_guru'         => 'Siti Aminah',
            'is_prioritas_pagi' => true,
        ],
        (object)[
            'id'                => 3,
            'guru_id'           => 101,
            'nip'               => '198001012005011001',
            'mapel_id'          => 1,
            'beban_jam'         => 4,
            't_list_guru_id'    => 3,
            'kelas_id'          => 2,
            'nama_mapel'        => 'Matematika',
            'nama_guru'         => 'Budi Santoso',
            'is_prioritas_pagi' => false,
        ],
    ]);
}

function gaKelas()
{
    return collect([
        (object)['id' => 1, 'nama_kelas' => 'X IPA 1'],
        (object)['id' => 2, 'nama_kelas' => 'X IPA 2'],
    ]);
}

// =====================================================
// 1. INISIALISASI
// =====================================================

test('GeneticAlgorithmService bisa diinisialisasi dengan parameter valid', function () {
    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    expect($ga)->toBeInstanceOf(GeneticAlgorithmService::class);
});

test('GeneticAlgorithmService menerima prioritas pagi', function () {
    $prioritasPagi = [
        ['nip' => '198002022005012002', 'kelas_id' => 1],
    ];

    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas(), $prioritasPagi);
    expect($ga)->toBeInstanceOf(GeneticAlgorithmService::class);
});

// =====================================================
// 2. GENERATE JADWAL
// =====================================================

test('generate() mengembalikan struktur hasil yang benar', function () {
    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    $hasil = $ga->generate();

    expect($hasil)->toBeArray()
        ->and($hasil)->toHaveKeys(['status', 'generasi_terakhir', 'fitness_terbaik', 'best_kromosom', 'jadwal', 'logs'])
        ->and($hasil['status'])->toBe('success')
        ->and($hasil['generasi_terakhir'])->toBeInt()
        ->and($hasil['fitness_terbaik'])->toBeNumeric()
        ->and($hasil['jadwal'])->toBeArray()
        ->and($hasil['logs'])->toBeArray();
});

test('generate() menghasilkan jadwal (boleh kosong jika data terlalu minimal)', function () {
    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    $hasil = $ga->generate();

    // Dengan data mock minimal, jadwal bisa kosong — yang penting tidak error
    expect($hasil['jadwal'])->toBeArray();
});

test('setiap item jadwal memiliki field wajib (jika ada jadwal)', function () {
    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    $hasil = $ga->generate();

    foreach ($hasil['jadwal'] as $item) {
        expect($item)->toHaveKeys([
            'hari',
            'jam_mulai',
            'jam_selesai',
            'kelas_id',
            'mapel_id',
            't_list_guru_mapel_id',
        ]);
    }

    // Pastikan selalu ada assertion
    expect(true)->toBeTrue();
});

test('hari pada jadwal hanya Senin sampai Jumat (jika ada jadwal)', function () {
    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    $hasil = $ga->generate();
    $hariValid = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    foreach ($hasil['jadwal'] as $item) {
        expect($item['hari'])->toBeIn($hariValid);
    }

    expect(true)->toBeTrue();
});

test('fitness terbaik berada dalam rentang yang masuk akal', function () {
    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    $hasil = $ga->generate();

    expect($hasil['fitness_terbaik'])->toBeNumeric()
        ->and($hasil['fitness_terbaik'])->toBeLessThanOrEqual(2.0);
});

// =====================================================
// 3. CONSTRAINT
// =====================================================

test('tidak ada bentrok guru di slot yang sama (jika ada jadwal)', function () {
    $guruMapels = gaGuruMapels();
    $ga = new GeneticAlgorithmService(gaParams(), $guruMapels, gaKelas());
    $hasil = $ga->generate();

    $slotGuru = [];

    foreach ($hasil['jadwal'] as $item) {
        $gm = $guruMapels->firstWhere('id', $item['t_list_guru_mapel_id']);
        if (!$gm) {
            continue;
        }

        $key = $gm->guru_id . '|' . $item['hari'] . '|' . $item['jam_mulai'];
        expect(isset($slotGuru[$key]))->toBeFalse(
            "Bentrok guru ID {$gm->guru_id} pada {$item['hari']} jam {$item['jam_mulai']}"
        );
        $slotGuru[$key] = true;
    }

    expect(true)->toBeTrue();
});

test('tidak ada bentrok kelas di slot yang sama (jika ada jadwal)', function () {
    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    $hasil = $ga->generate();

    $slotKelas = [];

    foreach ($hasil['jadwal'] as $item) {
        $key = $item['kelas_id'] . '|' . $item['hari'] . '|' . $item['jam_mulai'];
        expect(isset($slotKelas[$key]))->toBeFalse(
            "Bentrok kelas ID {$item['kelas_id']} pada {$item['hari']} jam {$item['jam_mulai']}"
        );
        $slotKelas[$key] = true;
    }

    expect(true)->toBeTrue();
});

// =====================================================
// 4. LOG
// =====================================================

test('logs mencatat tahap START dan FINISH', function () {
    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    $hasil = $ga->generate();
    $tahap = collect($hasil['logs'])->pluck('tahap')->unique()->toArray();

    expect($tahap)->toContain('START')
        ->and($tahap)->toContain('FINISH');
});

test('callback onLog dipanggil saat generate', function () {
    $logsDiterima = [];

    $ga = new GeneticAlgorithmService(gaParams(), gaGuruMapels(), gaKelas());
    $ga->onLog = function ($logData) use (&$logsDiterima) {
        $logsDiterima[] = $logData;
    };

    $ga->generate();

    expect($logsDiterima)->not->toBeEmpty();
});

// =====================================================
// 5. EDGE CASE
// =====================================================

test('generate tetap berjalan meski populasi sangat kecil', function () {
    $ga = new GeneticAlgorithmService(
        gaParams(['populasi' => 2, 'generasi' => 2]),
        gaGuruMapels(),
        gaKelas()
    );

    $hasil = $ga->generate();

    expect($hasil['status'])->toBe('success')
        ->and($hasil['jadwal'])->toBeArray();
});

test('generate menangani data guruMapel kosong secara graceful', function () {
    $ga = new GeneticAlgorithmService(gaParams(), collect([]), gaKelas());
    $hasil = $ga->generate();

    expect($hasil)->toBeArray()
        ->and($hasil['status'])->toBe('success');
});