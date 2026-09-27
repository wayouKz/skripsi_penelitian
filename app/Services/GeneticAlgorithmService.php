<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class GeneticAlgorithmService
{
    private $populasi;
    private $maxGenerasi;
    private $crossoverRate;
    private $mutationRate;

    public $onGenerationComplete = null;

    private $guruMapels;
    private $kelas;
    private $hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    private $slotWaktuPerHari = [];
    private $maxJamPerHari = [];

    private $prioritasPagiGuruId;
    private $prioritasPagi;

    private $targetBebanJam = [];

    public function __construct($params, $guruMapels, $kelas, $prioritasPagi = [])
    {
        $this->populasi = $params['populasi'] ?? 200;
        $this->maxGenerasi = $params['generasi'] ?? 500;
        $this->crossoverRate = $params['crossover_rate'] ?? 0.8;
        $this->mutationRate = $params['mutation_rate'] ?? 0.25;

        $this->prioritasPagiGuruId = $params['prioritas_pagi_guru_id'] ?? [];
        $this->prioritasPagi = $prioritasPagi;

        foreach ($this->hari as $h) {
            if (in_array($h, ['Kamis', 'Jumat'])) {
                $this->maxJamPerHari[$h] = 12;
            } else {
                $this->maxJamPerHari[$h] = 11;
            }

            for ($i = 1; $i <= $this->maxJamPerHari[$h]; $i++) {
                $this->slotWaktuPerHari[$h][$i] = [
                    'mulai' => '07:00:00',
                    'selesai' => '07:35:00'
                ];
            }
        }

        if (isset($params['slot_waktu']) && is_array($params['slot_waktu'])) {
            foreach ($this->hari as $h) {
                if (isset($params['slot_waktu'][$h])) {
                    $this->maxJamPerHari[$h] = count($params['slot_waktu'][$h]);
                    foreach ($params['slot_waktu'][$h] as $index => $slot) {
                        $jamKe = $index + 1;
                        $mulai = strlen($slot['mulai']) === 5 ? $slot['mulai'] . ':00' : $slot['mulai'];
                        $selesai = strlen($slot['selesai']) === 5 ? $slot['selesai'] . ':00' : $slot['selesai'];

                        $this->slotWaktuPerHari[$h][$jamKe] = [
                            'mulai' => $mulai,
                            'selesai' => $selesai
                        ];
                    }
                }
            }
        }

        $this->guruMapels = $guruMapels;
        foreach ($this->guruMapels as $gm) {
            $this->targetBebanJam[$gm->id] = (int) $gm->beban_jam;
        }
        $this->kelas = $kelas;
    }

    private function getMaxJam($hari)
    {
        $kapasitas = [
            'Senin' => 11,
            'Selasa' => 11,
            'Rabu' => 11,
            'Kamis' => 12,
            'Jumat' => 12,
        ];
        return $kapasitas[$hari] ?? 11;
    }

    private function getMaxJamInternal($hari)
    {
        return $this->getMaxJam($hari) + 1;
    }

    private function getSlotWaktu($hari, $jam)
    {
        return $this->slotWaktuPerHari[$hari][$jam] ?? ['mulai' => '07:00:00', 'selesai' => '07:35:00'];
    }

    public function generate()
    {
        $populasiSaatIni = $this->inisialisasiPopulasi();

        foreach ($populasiSaatIni as $index => $kromosom) {
            $populasiSaatIni[$index] = $this->repairKromosom($kromosom);
        }

        $generasi = 0;
        $bestFitness = -999999.0;
        $bestKromosom = [];
        $stagnantGenerations = 0;
        $totalStagnantGenerations = 0;
        $lastBestFitness = -999999.0;

        $currentMutationRate = $this->mutationRate ?? 0.25;
        $baseMutationRate = $currentMutationRate;

        // =====================================================================
        // LOOP ALGORITMA GENETIK
        // =====================================================================
        while ($generasi < $this->maxGenerasi) {
            $fitnessPopulasi = [];
            foreach ($populasiSaatIni as $kromosom) {
                $fitness = $this->hitungFitness($kromosom, true);
                $fitnessPopulasi[] = ['kromosom' => $kromosom, 'fitness' => $fitness];

                if ($fitness > $bestFitness) {
                    $bestFitness = $fitness;
                    $bestKromosom = $kromosom;

                    Log::info("=== NEW BEST KROMOSOM [Gen: {$generasi}] ===");
                    Log::info("Fitness Terbaik: {$bestFitness}");
                }
            }

            if ($bestFitness > $lastBestFitness) {
                $lastBestFitness = $bestFitness;
                $stagnantGenerations = 0;
                $totalStagnantGenerations = 0;
            } else {
                $stagnantGenerations++;
                $totalStagnantGenerations++;
            }

            if ($generasi > 0 && $generasi % 50 == 0) {
                Log::info("🔄 [Progress Generasi] Gen: {$generasi} | Best Fitness: {$bestFitness} | Stagnan: {$stagnantGenerations} gen");
            }

          if ($stagnantGenerations >= 25) { // Naikkan toleransi ke 25 generasi
                // Naikkan sedikit mutasi untuk memancing variasi
                $currentMutationRate = min(0.9, $baseMutationRate * 2);

                // HANYA GANTI 20% POPULASI TERBAWAH (Jangan 80% agar yang bagus tidak hilang)
                $jumlahImigrant = (int) ($this->populasi * 0.2);

                // Panggil inisialisasi (Ingat: Ini sudah menghasilkan kromosom steril!)
                $populasiBaruImigrant = $this->inisialisasiPopulasi();

                for ($imm = 0; $imm < min($jumlahImigrant, count($populasiBaruImigrant)); $imm++) {
                    $targetIndex = $this->populasi - 1 - $imm;
                    if (isset($populasiSaatIni[$targetIndex])) {
                        // SANGAT PENTING: Jangan gunakan repairKromosom() di sini!
                        // Masukkan jadwal yang sudah steril ini secara langsung.
                        $populasiSaatIni[$targetIndex] = $populasiBaruImigrant[$imm];
                    }
                }

                $stagnantGenerations = 0;

                // Cetak Log agar Anda tahu kapan algoritma melakukan "suntikan" jadwal baru
                if ($isDebug ?? true) {
                    Log::info("⚠️ [Evolusi Stagnan] Menyuntikkan {$jumlahImigrant} jadwal imigran steril ke populasi terbawah.");
                }

            } else {
                $currentMutationRate = max($baseMutationRate, $currentMutationRate * 0.95);
            }

            if (is_callable($this->onGenerationComplete)) {
                ($this->onGenerationComplete)($generasi, $bestFitness);
            }

            $populasiBaru = [];
            if (!empty($bestKromosom)) {
                $populasiBaru[] = $bestKromosom;
            }

            $sisaPopulasi = $this->populasi - count($populasiBaru);
            for ($i = 0; $i < $sisaPopulasi; $i++) {
                $parent1 = $this->seleksi($fitnessPopulasi);
                $parent2 = $this->seleksi($fitnessPopulasi);

                $child = $this->crossover($parent1, $parent2);

                $this->mutationRate = $currentMutationRate;
                $child = $this->mutasi($child);

                if ($generasi % 5 == 0) {
                    $child = $this->repairKromosom($child);
                }

                $populasiBaru[] = $child;
            }

            if ($bestFitness >= 0.999 || $totalStagnantGenerations >= $this->maxGenerasi) {
                break;
            }

            $populasiSaatIni = $populasiBaru;
            $generasi++;
        }

        // =====================================================================
        // --- POST-PROCESSING GLOBAL: ZERO-LOSS HOLE FILLER & PENJASKES KEEPER
        // =====================================================================
    // =====================================================================
        // --- POST-PROCESSING GLOBAL: STERIL ZERO-CONFLICT HOLE FILLER ---
        // =====================================================================
      if (!empty($bestKromosom)) {
            $matrixKelas = [];
            $matrixGuru = [];
            $konflikUtuh = [];
            $konflik1Jam = [];

            $kelasArrayAsli = $this->kelas instanceof \Illuminate\Support\Collection ? $this->kelas->all() : (array) $this->kelas;
            foreach ($kelasArrayAsli as $kls) {
                $kId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
                if (!$kId) continue;
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJam($h);
                    for ($jm = 1; $jm <= $maxH; $jm++) {
                        $matrixKelas[$kId][$h][$jm] = false;
                    }
                }
            }

            // 1. KUNCI JADWAL YANG 100% BERSIH
            foreach ($bestKromosom as $kelasId => &$gens) {
                foreach ($gens as $chunkId => $gen) {
                    $h = $gen['hari'] ?? null;
                    $jm = $gen['jam_mulai'] ?? null;
                    $dur = $gen['durasi'] ?? 1;
                    $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                    $isPenjaskes = $gen['is_penjaskes'] ?? false;

                    $isBentrok = false;

                    if (!$h || !$jm) {
                        $isBentrok = true;
                    } else {
                        $maxH = $this->getMaxJam($h);
                        for ($d = 0; $d < $dur; $d++) {
                            $jam = $jm + $d;
                            if ($jam > $maxH ||
                                empty($matrixKelas[$kelasId]) ||
                                (isset($matrixKelas[$kelasId][$h][$jam]) && $matrixKelas[$kelasId][$h][$jam] === true) ||
                                (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$h][$jam]))) {
                                $isBentrok = true;
                                break;
                            }
                        }
                    }

                    if ($isBentrok) {
                        if ($isPenjaskes || $dur > 1) {
                            $gen['kelas_id_asli'] = $kelasId;
                            $konflikUtuh[] = $gen;
                        } else {
                            $potongan = $gen;
                            $potongan['durasi'] = 1;
                            $potongan['kelas_id_asli'] = $kelasId;
                            $konflik1Jam[] = $potongan;
                        }
                        unset($gens[$chunkId]);
                    } else {
                        for ($d = 0; $d < $dur; $d++) {
                            $jam = $jm + $d;
                            $matrixKelas[$kelasId][$h][$jam] = true;
                            if (!$isPenjaskes && $guruId !== 'none') {
                                $matrixGuru[$guruId][$h][$jam] = true;
                            }
                        }
                    }
                }
            }
            unset($gens);

            $jumlahUtuhBerhasil = 0;
            $sisaKonflikUtuhNormal = [];

            // 2. AMANKAN BLOK UTUH (TIDAK BOLEH MEMECAH PENJASKES)
            foreach ($konflikUtuh as $gen) {
                $kelasId = $gen['kelas_id_asli'];
                $durasi = $gen['durasi'];
                $namaMapel = $gen['nama_mapel'] ?? 'Unknown';
                $isPenjaskes = $gen['is_penjaskes'] ?? false;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');

                $kemungkinanSlotUtuh = [];
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJam($h);
                    // PENJASKES MUTLAK MAKSIMAL MULAI JAM KE-3
                    $batasMulai = $isPenjaskes ? min(3, $maxH - $durasi + 1) : ($maxH - $durasi + 1);
                    for ($jm = 1; $jm <= $batasMulai; $jm++) {
                        $kemungkinanSlotUtuh[] = ['hari' => $h, 'jam' => $jm];
                    }
                }
                shuffle($kemungkinanSlotUtuh);

                $ditemukan = false;

                // TIER 1: STERIL MUTLAK
                foreach ($kemungkinanSlotUtuh as $slot) {
                    $hariCoba = $slot['hari'];
                    $jm = $slot['jam'];

                    $bisa = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        $jCek = $jm + $d;
                        if (!empty($matrixKelas[$kelasId][$hariCoba][$jCek]) ||
                            (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jCek]))) {
                            $bisa = false;
                            break;
                        }
                    }

                    if ($bisa) {
                        $gen['hari'] = $hariCoba;
                        $gen['jam_mulai'] = $jm;
                        unset($gen['kelas_id_asli']);

                        for ($d = 0; $d < $durasi; $d++) {
                            $jCek = $jm + $d;
                            $matrixKelas[$kelasId][$hariCoba][$jCek] = true;
                            if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$hariCoba][$jCek] = true;
                        }
                        $bestKromosom[$kelasId]['patched_utuh_'.uniqid()] = $gen;
                        $ditemukan = true;
                        $jumlahUtuhBerhasil++;
                        break;
                    }
                }

                // TIER 2: IZINKAN BENTROK GURU (Cari Kelas Kosong Utuh)
                if (!$ditemukan) {
                    foreach ($kemungkinanSlotUtuh as $slot) {
                        $hariCoba = $slot['hari'];
                        $jm = $slot['jam'];

                        $bisaKelas = true;
                        for ($d = 0; $d < $durasi; $d++) {
                            $jCek = $jm + $d;
                            if (!empty($matrixKelas[$kelasId][$hariCoba][$jCek])) { // HANYA CEK KELAS
                                $bisaKelas = false;
                                break;
                            }
                        }

                        if ($bisaKelas) {
                            $gen['hari'] = $hariCoba;
                            $gen['jam_mulai'] = $jm;
                            unset($gen['kelas_id_asli']);

                            for ($d = 0; $d < $durasi; $d++) {
                                $jCek = $jm + $d;
                                $matrixKelas[$kelasId][$hariCoba][$jCek] = true;
                                if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$hariCoba][$jCek] = true;
                            }
                            $bestKromosom[$kelasId]['patched_utuh_'.uniqid()] = $gen;
                            $ditemukan = true;
                            $jumlahUtuhBerhasil++;
                            break;
                        }
                    }
                }

                // TIER 3: DARURAT. KHUSUS PENJASKES DILARANG PECAH.
                if (!$ditemukan) {
                    if ($isPenjaskes) {
                        // PAKSA TIMPA DI PAGI HARI SECARA UTUH
                        $slotDarurat = $kemungkinanSlotUtuh[0];
                        $gen['hari'] = $slotDarurat['hari'];
                        $gen['jam_mulai'] = $slotDarurat['jam'];
                        unset($gen['kelas_id_asli']);

                        for ($d = 0; $d < $durasi; $d++) {
                            $jCek = $slotDarurat['jam'] + $d;
                            $matrixKelas[$kelasId][$slotDarurat['hari']][$jCek] = true;
                        }
                        $bestKromosom[$kelasId]['patched_utuh_'.uniqid()] = $gen;
                        $jumlahUtuhBerhasil++;
                        \Illuminate\Support\Facades\Log::warning("🚨 [Penjaskes Dipertahankan] {$namaMapel} ditimpa utuh ke {$slotDarurat['hari']} Jam {$slotDarurat['jam']}.");
                    } else {
                        // Mapel biasa dilempar untuk dipecah jadi 1 jam
                        $sisaKonflikUtuhNormal[] = $gen;
                    }
                }
            }

            // PECAH HANYA MAPEL BIASA YANG GAGAL UTUH
            foreach ($sisaKonflikUtuhNormal as $gen) {
                for ($d = 0; $d < $gen['durasi']; $d++) {
                    $potongan = $gen;
                    $potongan['durasi'] = 1;
                    $konflik1Jam[] = $potongan;
                }
            }

            // 3. TAMBAL JADWAL 1 JAM
            $jumlahPatchedSteril = 0;
            $jumlahPatchedBentrokGuru = 0;

            foreach ($konflik1Jam as $gen) {
                $kelasId = $gen['kelas_id_asli'] ?? $gen['kelas_id'];
                $namaMapel = $gen['nama_mapel'] ?? 'Unknown';
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false; // Hanya berjaga-jaga, walau Penjaskes tak akan sampai sini

                $kemungkinanSlot1Jam = [];
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJam($h);
                    for ($jm = 1; $jm <= $maxH; $jm++) {
                        $kemungkinanSlot1Jam[] = ['hari' => $h, 'jam' => $jm];
                    }
                }
                shuffle($kemungkinanSlot1Jam);

                $ditemukan = false;

                // TIER 1: STERIL MUTLAK
                foreach ($kemungkinanSlot1Jam as $slot) {
                    $hariCoba = $slot['hari'];
                    $jm = $slot['jam'];

                    if (empty($matrixKelas[$kelasId][$hariCoba][$jm]) &&
                       ($isPenjaskes || $guruId === 'none' || empty($matrixGuru[$guruId][$hariCoba][$jm]))) {

                        $gen['hari'] = $hariCoba;
                        $gen['jam_mulai'] = $jm;
                        unset($gen['kelas_id_asli']);

                        $matrixKelas[$kelasId][$hariCoba][$jm] = true;
                        if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$hariCoba][$jm] = true;

                        $bestKromosom[$kelasId]['patched_1jam_'.uniqid()] = $gen;
                        $ditemukan = true;
                        $jumlahPatchedSteril++;
                        break;
                    }
                }

                // TIER 2: IZINKAN BENTROK GURU
                if (!$ditemukan) {
                    foreach ($kemungkinanSlot1Jam as $slot) {
                        $hariCoba = $slot['hari'];
                        $jm = $slot['jam'];

                        if (empty($matrixKelas[$kelasId][$hariCoba][$jm])) {
                            $gen['hari'] = $hariCoba;
                            $gen['jam_mulai'] = $jm;
                            unset($gen['kelas_id_asli']);

                            $matrixKelas[$kelasId][$hariCoba][$jm] = true;
                            if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$hariCoba][$jm] = true;

                            $bestKromosom[$kelasId]['patched_1jam_'.uniqid()] = $gen;
                            $ditemukan = true;
                            $jumlahPatchedBentrokGuru++;
                            break;
                        }
                    }
                }

                // TIER 3: DARURAT TIMPA
                if (!$ditemukan) {
                    $slotDarurat = $kemungkinanSlot1Jam[0];
                    $gen['hari'] = $slotDarurat['hari'];
                    $gen['jam_mulai'] = $slotDarurat['jam'];
                    unset($gen['kelas_id_asli']);
                    $bestKromosom[$kelasId]['patched_1jam_'.uniqid()] = $gen;
                }
            }
        }

        // =====================================================================
        // --- MAPPING FLAT JADWAL ---
        // =====================================================================
        $flatJadwal = [];
        if (!empty($bestKromosom)) {
            $rekapSlotKelas = [];
            foreach ($bestKromosom as $kelasId => $gens) {
                $totalJamKelas = 0;
                foreach ($gens as $gen) {
                    $totalJamKelas += (int) ($gen['durasi'] ?? 0);
                }
                $rekapSlotKelas[] = "{$kelasId}: {$totalJamKelas} Jam";
            }
            Log::info("📊 [Rekap Akhir Total Jam Per Kelas] -> " . implode(' | ', $rekapSlotKelas));

            foreach ($bestKromosom as $kelasId => $gens) {
                foreach ($gens as $chunkId => $gen) {
                    $durasi = $gen['durasi'];
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamKe = $gen['jam_mulai'] + $d;
                        $waktu = $this->getSlotWaktu($gen['hari'], $jamKe);

                        $flatJadwal[] = [
                            'guru_id'              => $gen['guru_id'],
                            't_list_guru_mapel_id' => $gen['t_list_guru_mapel_id'],
                            'blok_id'              => $chunkId . '_' . $d,
                            'mapel_id'             => $gen['mapel_id'],
                            'kelas_id'             => $gen['kelas_id'],
                            'hari'                 => $gen['hari'],
                            'jam'                  => $jamKe,
                            'jam_mulai'            => $waktu['mulai'],
                            'jam_selesai'          => $waktu['selesai'],
                            'is_penjaskes'         => $gen['is_penjaskes']
                        ];
                    }
                }
            }
        }

        usort($flatJadwal, function($a, $b) {
            $hariOrder = ['Senin' => 1, 'Selasa' => 2, 'Rabu' => 3, 'Kamis' => 4, 'Jumat' => 5];
            $kelasCompare = strcmp($a['kelas_id'], $b['kelas_id']);
            if ($kelasCompare !== 0) return $kelasCompare;
            $hariA = $hariOrder[$a['hari']] ?? 99;
            $hariB = $hariOrder[$b['hari']] ?? 99;
            if ($hariA !== $hariB) return $hariA <=> $hariB;
            return $a['jam'] <=> $b['jam'];
        });

        Log::info("=== SELESAI GENERATE JADWAL == | Total Data Flat Jadwal: " . count($flatJadwal));

        return [
            'status' => 'success',
            'generasi_terakhir' => $generasi,
            'fitness_terbaik' => round($bestFitness, 6),
            'jadwal' => $flatJadwal
        ];

        }

    private function inisialisasiPopulasi()
    {
        $populasi = [];

        $guruMapelsArray = $this->guruMapels instanceof \Illuminate\Support\Collection
            ? $this->guruMapels->all()
            : (array) $this->guruMapels;

        $totalBebanGuru = [];
        $guruMapelPerKelas = [];

        foreach ($guruMapelsArray as $gm) {
            $guruMapelPerKelas[$gm->kelas_id][] = $gm;
            $gId = !empty($gm->guru_id) ? 'g_' . $gm->guru_id : (!empty($gm->nip) ? 'n_' . $gm->nip : 'none');
            if ($gId !== 'none') {
                $totalBebanGuru[$gId] = ($totalBebanGuru[$gId] ?? 0) + (int) $gm->beban_jam;
            }
        }

        $kelasArray = $this->kelas instanceof \Illuminate\Support\Collection
            ? $this->kelas->all()
            : (array) $this->kelas;

        // Prioritaskan kelas dengan beban guru yang paling tinggi
        $kelasPrioritas = $kelasArray;
        usort($kelasPrioritas, function($a, $b) use ($guruMapelPerKelas, $totalBebanGuru) {
            $aId = is_object($a) ? ($a->id ?? $a->kelas_id ?? null) : $a;
            $bId = is_object($b) ? ($b->id ?? $b->kelas_id ?? null) : $b;

            $bebanA = 0;
            foreach (($guruMapelPerKelas[$aId] ?? []) as $gm) {
                $gId = !empty($gm->guru_id) ? 'g_' . $gm->guru_id : 'none';
                $bebanA += $totalBebanGuru[$gId] ?? 0;
            }

            $bebanB = 0;
            foreach (($guruMapelPerKelas[$bId] ?? []) as $gm) {
                $gId = !empty($gm->guru_id) ? 'g_' . $gm->guru_id : 'none';
                $bebanB += $totalBebanGuru[$gId] ?? 0;
            }
            return $bebanB <=> $bebanA;
        });

        for ($i = 0; $i < $this->populasi; $i++) {
            $kromosom = [];
            $matrixGuru = [];
            $matrixKelasGlobal = [];

            foreach ($kelasPrioritas as $kls) {
                $kId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
                if (!$kId) continue;
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJamInternal($h);
                    $matrixKelasGlobal[$kId][$h] = array_fill(1, $maxH, false);
                }
            }

            $globalUnassignedChunks = [];

            foreach ($kelasPrioritas as $kls) {
                $kelasId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
                if (!$kelasId) continue;

                $mapelKelas = $guruMapelPerKelas[$kelasId] ?? [];
                if (empty($mapelKelas)) continue;
                if (!isset($kromosom[$kelasId])) $kromosom[$kelasId] = [];

                $allChunksToAllocate = [];
                foreach ($mapelKelas as $gm) {
                    $bebanSeharusnya = (int) $gm->beban_jam;
                    if ($bebanSeharusnya <= 0) continue;

                    $namaMapel = $gm->nama_mapel ?? 'Unknown';
                    $namaMapelLower = strtolower($namaMapel);
                    $isPenjaskes = str_contains($namaMapelLower, 'penjas') || str_contains($namaMapelLower, 'olahraga');

                    $chunksDurasi = [];
                    if ($isPenjaskes) {
                        // ATURAN 1: PENJASKES TIDAK DIBAGI SLOTNYA
                        $chunksDurasi = [$bebanSeharusnya];
                    } else {
                        // Mencegah pecahan 1 jam untuk mapel lain
                        $sisa = $bebanSeharusnya;
                        if ($sisa == 1) {
                            $chunksDurasi = [1];
                        } else {
                            while ($sisa > 0) {
                                if ($sisa == 4) {
                                    array_push($chunksDurasi, 2, 2);
                                    $sisa = 0;
                                } elseif ($sisa == 5) {
                                    array_push($chunksDurasi, 3, 2);
                                    $sisa = 0;
                                } elseif ($sisa == 2) {
                                    $chunksDurasi[] = 2;
                                    $sisa = 0;
                                } elseif ($sisa >= 3) {
                                    $chunksDurasi[] = 3;
                                    $sisa -= 3;
                                }
                            }
                        }
                    }

                    foreach ($chunksDurasi as $dur) {
                        $allChunksToAllocate[] = [
                            'gm' => $gm,
                            'durasi' => $dur,
                            'is_penjaskes' => $isPenjaskes,
                            'nama_mapel' => $namaMapel
                        ];
                    }
                }

                // ATURAN MUTLAK: PENJASKES DIALOKASIKAN PERTAMA KALI SEBELUM MAPEL LAIN
                // Jika sama-sama bukan penjaskes, urutkan berdasarkan durasi terlama
                usort($allChunksToAllocate, function($a, $b) {
                    if ($a['is_penjaskes'] && !$b['is_penjaskes']) return -1;
                    if (!$a['is_penjaskes'] && $b['is_penjaskes']) return 1;
                    return $b['durasi'] <=> $a['durasi'];
                });

                $counterId = 1;
                foreach ($allChunksToAllocate as $item) {
                    $gm = $item['gm'];
                    $durasiChunk = $item['durasi'];
                    $isPenjaskes = $item['is_penjaskes'];
                    $namaMapel = $item['nama_mapel'];
                    $guruId = !empty($gm->guru_id) ? 'g_' . $gm->guru_id : (!empty($gm->nip) ? 'n_' . $gm->nip : 'none');

                    $chunkId = 'gm_' . $gm->id . '_b_' . $counterId . '_p_' . $i;
                    $counterId++;

                    $assignedHari = null;
                    $assignedJam = null;
                    $hariAcak = $this->hari;
                    shuffle($hariAcak);

                    // FASE 1: Cari Slot Steril (Kelas Kosong & Guru Kosong)
                    foreach ($hariAcak as $hari) {
                        $maxH = $this->getMaxJamInternal($hari);

                        // ATURAN 2: PENJASKES DI PAGI HARI
                        // Memaksa penjaskes hanya boleh mulai di jam ke-1, 2, atau maksimal ke-3
                        $batasMulaiJam = $isPenjaskes ? min(3, $maxH - $durasiChunk + 1) : ($maxH - $durasiChunk + 1);

                        for ($jm = 1; $jm <= $batasMulaiJam; $jm++) {
                            $bisa = true;
                            for ($d = 0; $d < $durasiChunk; $d++) {
                                $jamCek = $jm + $d;
                                if (!empty($matrixKelasGlobal[$kelasId][$hari][$jamCek]) ||
                                (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                                    $bisa = false;
                                    break;
                                }
                            }
                            if ($bisa) {
                                $assignedHari = $hari;
                                $assignedJam = $jm;
                                break 2;
                            }
                        }
                    }

                    // Jika Steril berhasil, langsung pasang. Jika gagal, lempar ke Buffer
                    if ($assignedHari && $assignedJam) {
                        for ($d = 0; $d < $durasiChunk; $d++) {
                            $jamCek = $assignedJam + $d;
                            $matrixKelasGlobal[$kelasId][$assignedHari][$jamCek] = true;
                            if (!$isPenjaskes && $guruId !== 'none') {
                                $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                            }
                        }

                        $kromosom[$kelasId][$chunkId] = [
                            'guru_id' => $gm->guru_id ?? null,
                            'nip' => $gm->nip ?? null,
                            't_list_guru_mapel_id' => $gm->id,
                            'blok_id' => $chunkId,
                            'mapel_id' => $gm->mapel_id,
                            'nama_mapel' => $namaMapel,
                            'kelas_id' => $kelasId,
                            'hari' => $assignedHari,
                            'jam_mulai' => (int) $assignedJam,
                            'durasi' => (int) $durasiChunk,
                            'is_penjaskes' => $isPenjaskes
                        ];
                    } else {
                        $globalUnassignedChunks[] = [
                            'kelas_id' => $kelasId,
                            'gm' => $gm,
                            'chunk_id' => $chunkId,
                            'durasi' => $durasiChunk,
                            'is_penjaskes' => $isPenjaskes,
                            'nama_mapel' => $namaMapel,
                            'guru_id' => $guruId
                        ];
                    }
                }
            }

            // FASE 2: Tangani sisa blok yang ada di Buffer (Izinkan Bentrok Guru untuk mapel biasa)
            foreach ($globalUnassignedChunks as $unassigned) {
                $kelasId = $unassigned['kelas_id'];
                $gm = $unassigned['gm'];
                $chunkId = $unassigned['chunk_id'];
                $durasiChunk = $unassigned['durasi'];
                $isPenjaskes = $unassigned['is_penjaskes'];
                $namaMapel = $unassigned['nama_mapel'];
                $guruId = $unassigned['guru_id'];

                $assignedHari = null;
                $assignedJam = null;
                $hariAcak = $this->hari;
                shuffle($hariAcak);

                // TAHAP 2A: Coba ulang cari slot steril (siapa tahu ada ruang setelah dikocok ulang)
                foreach ($hariAcak as $hari) {
                    $maxH = $this->getMaxJamInternal($hari);
                    // Tetap pertahankan aturan pagi hari untuk Penjaskes di Fase Fallback
                    $batasMulaiJam = $isPenjaskes ? min(3, $maxH - $durasiChunk + 1) : ($maxH - $durasiChunk + 1);

                    for ($jm = 1; $jm <= $batasMulaiJam; $jm++) {
                        $bisaSteril = true;
                        for ($d = 0; $d < $durasiChunk; $d++) {
                            $jamCek = $jm + $d;
                            if (!empty($matrixKelasGlobal[$kelasId][$hari][$jamCek]) ||
                            (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                                $bisaSteril = false;
                                break;
                            }
                        }
                        if ($bisaSteril) {
                            $assignedHari = $hari;
                            $assignedJam = $jm;
                            break 2;
                        }
                    }
                }

                // TAHAP 2B: Jika gagal steril, IZINKAN BENTROK GURU asal Kelasnya KOSONG
                if (!$assignedHari || !$assignedJam) {
                    foreach ($hariAcak as $hari) {
                        $maxH = $this->getMaxJamInternal($hari);
                        // Tetap pertahankan aturan pagi hari untuk Penjaskes
                        $batasMulaiJam = $isPenjaskes ? min(3, $maxH - $durasiChunk + 1) : ($maxH - $durasiChunk + 1);

                        for ($jm = 1; $jm <= $batasMulaiJam; $jm++) {
                            $bisaKelasKosong = true;
                            for ($d = 0; $d < $durasiChunk; $d++) {
                                $jamCek = $jm + $d;
                                // HANYA CEK KELAS, abaikan kondisi guru
                                if (!empty($matrixKelasGlobal[$kelasId][$hari][$jamCek])) {
                                    $bisaKelasKosong = false;
                                    break;
                                }
                            }
                            if ($bisaKelasKosong) {
                                $assignedHari = $hari;
                                $assignedJam = $jm;
                                break 2;
                            }
                        }
                    }
                }

                // TAHAP 2C: FALLBACK DARURAT MUTLAK (Jika kelas benar-benar penuh di pagi hari, paksa ke jam 1)
                if (!$assignedHari || !$assignedJam) {
                    $assignedHari = $this->hari[0];
                    $assignedJam = 1; // Paksa jam 1 (Pagi) agar tetap mematuhi rule Penjaskes
                }

                // EKSEKUSI PENEMPATAN KROMOSOM
                for ($d = 0; $d < $durasiChunk; $d++) {
                    $jamCek = $assignedJam + $d;
                    $maxHInternal = $this->getMaxJamInternal($assignedHari);
                    if ($jamCek <= $maxHInternal) {
                        $matrixKelasGlobal[$kelasId][$assignedHari][$jamCek] = true;
                        if (!$isPenjaskes && $guruId !== 'none') {
                            $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                        }
                    }
                }

                $kromosom[$kelasId][$chunkId] = [
                    'guru_id' => $gm->guru_id ?? null,
                    'nip' => $gm->nip ?? null,
                    't_list_guru_mapel_id' => $gm->id,
                    'blok_id' => $chunkId,
                    'mapel_id' => $gm->mapel_id,
                    'nama_mapel' => $namaMapel,
                    'kelas_id' => $kelasId,
                    'hari' => $assignedHari,
                    'jam_mulai' => (int) $assignedJam,
                    'durasi' => (int) $durasiChunk,
                    'is_penjaskes' => $isPenjaskes
                ];
            }

            $populasi[] = $kromosom;
        }

        return $populasi;
    }
private function hitungFitness($kromosom, $isDebug = false)
    {
        $penalty = 0;

        // Variabel pelacak rincian penalti untuk kebutuhan Log
        $detailPenalti = [
            'fatal' => 0,
            'mapel_harian' => 0,
            'out_of_bounds' => 0,
            'bentrok_kelas' => 0,
            'bentrok_guru' => 0,
            'beban_jam' => 0,
            'struktur_jam' => 0,
            'blok_sendirian' => 0
        ];

        $trackerGuru = [];
        $trackerKelas = [];
        $trackerMapelHarian = [];
        $totalDurasiMapel = []; // Untuk mengetahui total jam per mapel

        // PRE-CALCULATION: Hitung total jam per mapel di setiap kelas
        foreach ($kromosom as $kelasId => $gens) {
            foreach ($gens as $gen) {
                $mapelId = $gen['mapel_id'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                if ($mapelId) {
                    $totalDurasiMapel[$kelasId][$mapelId] = ($totalDurasiMapel[$kelasId][$mapelId] ?? 0) + $durasi;
                }
            }
        }

        foreach ($kromosom as $kelasId => $gens) {
            foreach ($gens as $gen) {
                $hari = $gen['hari'] ?? null;
                $jamMulai = $gen['jam_mulai'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $mapelId = $gen['mapel_id'] ?? null;

                // 1. Error Fatal (Kromosom Kosong)
                if (!$hari || !$jamMulai) {
                    $penalty += 200.0;
                    $detailPenalti['fatal'] += 200.0;
                    continue;
                }

                // DETEKSI BLOK SENDIRIAN: Durasi 1 padahal total bebannya > 1
                if ($durasi == 1 && $mapelId) {
                    $totalBebanMapelIni = $totalDurasiMapel[$kelasId][$mapelId] ?? 1;
                    if ($totalBebanMapelIni > 1) {
                        $penalty += 50.0;
                        $detailPenalti['blok_sendirian'] += 50.0;
                    }
                }

                // 2. STRONG SOFT CONSTRAINT: Sebaran Mapel Harian
                // Hukum berat mapel yang muncul lebih dari 1 blok di hari yang sama
                if ($mapelId) {
                    if (!isset($trackerMapelHarian[$kelasId][$hari][$mapelId])) {
                        $trackerMapelHarian[$kelasId][$hari][$mapelId] = 0;
                    }

                    $trackerMapelHarian[$kelasId][$hari][$mapelId]++;

                    // Jika mapel yang sama muncul ke-2 kalinya (atau lebih) di hari yang sama
                    if ($trackerMapelHarian[$kelasId][$hari][$mapelId] > 1) {
                        $penalty += 200.0; // PENALTI BERAT agar algoritma memecahnya ke hari lain
                        $detailPenalti['mapel_harian'] += 200.0;
                    }
                }

                for ($d = 0; $d < $durasi; $d++) {
                    $jam = $jamMulai + $d;
                    $maxReal = $this->getMaxJam($hari);
                    $maxInternal = $this->getMaxJamInternal($hari);

                    // Out of Bounds / Slot Bayangan
                    if ($jam > $maxInternal || $jam < 1) {
                        $penalty += 200.0;
                        $detailPenalti['out_of_bounds'] += 200.0;
                    }
                    elseif ($jam > $maxReal) {
                        $penalty += 10.0;
                        $detailPenalti['out_of_bounds'] += 10.0;
                    }

                    // HARD CONSTRAINT: Bentrok Kelas
                    if (isset($trackerKelas[$kelasId][$hari][$jam])) {
                        $penalty += 1000.0;
                        $detailPenalti['bentrok_kelas'] += 1000.0;
                    } else {
                        $trackerKelas[$kelasId][$hari][$jam] = true;
                    }

                    // HARD CONSTRAINT: Bentrok Guru (Kecuali Penjaskes diberi kelonggaran jika diperlukan)
                    if ($guruId !== 'none' && !($gen['is_penjaskes'] ?? false)) {
                        if (isset($trackerGuru[$guruId][$hari][$jam])) {
                            $penalty += 10000.0;
                            $detailPenalti['bentrok_guru'] += 10000.0;
                        } else {
                            $trackerGuru[$guruId][$hari][$jam] = true;
                        }
                    }
                }
            }
        }

        // 3. HARD CONSTRAINT: Total Beban Jam Per Kelas (Harus Pas 57 Jam)
        foreach ($kromosom as $kelasId => $gens) {
            $totalJamPerKelas = 0;
            foreach ($gens as $gen) {
                $totalJamPerKelas += (int) ($gen['durasi'] ?? 0);
            }
            if ($totalJamPerKelas !== 57) {
                $p = abs(57 - $totalJamPerKelas) * 1000.0;
                $penalty += $p;
                $detailPenalti['beban_jam'] += $p;
            }
        }

        // 4. SOFT CONSTRAINT: Struktur Jam (Datang Siang & Gap)
        foreach ($trackerKelas as $kelasId => $hariList) {
            foreach ($hariList as $hariCek => $jamList) {
                if (empty($jamList)) continue;
                $jams = array_keys($jamList);
                $minJ = min($jams);
                $maxJ = max($jams);
                $terisi = count($jams);

                if ($minJ > 1) {
                    $p = (($minJ - 1) * 2.0);
                    $penalty += $p;
                    $detailPenalti['struktur_jam'] += $p;
                }

                $seharusnya = $maxJ - $minJ + 1;
                if ($terisi < $seharusnya) {
                    $gaps = $seharusnya - $terisi;
                    $p = ($gaps * 2.0);
                    $penalty += $p;
                    $detailPenalti['struktur_jam'] += $p;
                }
            }
        }

        // 5. KONVERSI KE FITNESS SCORE
        $fitness = 5000.0 / (5000.0 + $penalty);
        $finalFitness = max(0.0001, round($fitness, 6));

        // 6. LOG TRACKING
        if ($isDebug) {
            $softTotal = $detailPenalti['mapel_harian'] + $detailPenalti['struktur_jam'] + $detailPenalti['blok_sendirian'];
            \Illuminate\Support\Facades\Log::debug("📊 [Hitung Fitness] Skor: {$finalFitness} | Total Penalti: {$penalty} | Rincian -> B.Guru: {$detailPenalti['bentrok_guru']} | B.Kelas: {$detailPenalti['bentrok_kelas']} | Mapel Double: {$detailPenalti['mapel_harian']} | Jam tdk 57: {$detailPenalti['beban_jam']} | Blok Sendiri: {$detailPenalti['blok_sendirian']}");
        }

        return $finalFitness;
    }
    private function repairKromosom($kromosom)
    {
        $matrixKelas = [];
        $matrixGuru = [];
        $cleanedKromosom = [];
        $unassignedChunks = [];

        $kelasArray = $this->kelas instanceof \Illuminate\Support\Collection ? $this->kelas->all() : (array) $this->kelas;

        // Inisialisasi Matriks Kelas
        foreach ($kelasArray as $kls) {
            $kId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
            if (!$kId) continue;
            foreach ($this->hari as $h) {
                $maxHInternal = $this->getMaxJamInternal($h);
                for ($jm = 1; $jm <= $maxHInternal; $jm++) {
                    $matrixKelas[$kId][$h][$jm] = false;
                }
            }
        }

        // 1. VALIDASI KROMOSOM LAMA: Simpan yang Valid, Buang yang Bentrok / Out of Bounds
        foreach ($kromosom as $kelasId => $gens) {
            if (!isset($cleanedKromosom[$kelasId])) $cleanedKromosom[$kelasId] = [];

            foreach ($gens as $cId => $gen) {
                $hari = $gen['hari'] ?? null;
                $jamMulai = $gen['jam_mulai'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                // Jika data rusak, langsung masukkan antrean perbaikan
                if (!$hari || !$jamMulai || $durasi <= 0) {
                    $unassignedChunks[] = $gen;
                    continue;
                }

                $maxHInternal = $this->getMaxJamInternal($hari);
                $bisa = true;

                for ($d = 0; $d < $durasi; $d++) {
                    $jamCek = $jamMulai + $d;
                    // Cek Out of bounds
                    if ($jamCek > $maxHInternal || $jamCek < 1) {
                        $bisa = false; break;
                    }
                    // Cek Bentrok Kelas
                    if ($matrixKelas[$kelasId][$hari][$jamCek] === true) {
                        $bisa = false; break;
                    }
                    // Cek Bentrok Guru
                    if (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek])) {
                        $bisa = false; break;
                    }
                }

                if ($bisa) {
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamCek = $jamMulai + $d;
                        $matrixKelas[$kelasId][$hari][$jamCek] = true;
                        if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$hari][$jamCek] = true;
                    }
                    $cleanedKromosom[$kelasId][$cId] = $gen;
                } else {
                    $unassignedChunks[] = $gen;
                }
            }
        }

        // 2. REASSIGNMENT: Tangani Sisa Blok (Unassigned Chunks) TANPA BENTROK GURU
        foreach ($unassignedChunks as $gen) {
            $kelasId = $gen['kelas_id'] ?? null;
            if (!$kelasId) continue;

            $durasi = $gen['durasi'] ?? 1;
            $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
            $isPenjaskes = $gen['is_penjaskes'] ?? false;
            $cId = $gen['blok_id'] ?? ('chunk_' . uniqid());

            $assignedHari = null;
            $assignedJam = null;

            // Buat daftar semua kemungkinan Hari & Jam secara acak
            $kemungkinanSlot = [];
            foreach ($this->hari as $hari) {
                $maxHInternal = $this->getMaxJamInternal($hari);
                // Aturan Penjaskes: Maksimal mulai jam ke-3
                $batasMulai = $isPenjaskes ? min(3, $maxHInternal - $durasi + 1) : ($maxHInternal - $durasi + 1);

                for ($jm = 1; $jm <= $batasMulai; $jm++) {
                    $kemungkinanSlot[] = ['hari' => $hari, 'jam' => $jm];
                }
            }
            shuffle($kemungkinanSlot);

            // TIER 1: Cari Slot Steril Mutlak (Kelas Kosong DAN Guru Kosong)
            foreach ($kemungkinanSlot as $slot) {
                $hariCoba = $slot['hari'];
                $jmCoba = $slot['jam'];

                $bisaSteril = true;
                for ($d = 0; $d < $durasi; $d++) {
                    $jamCek = $jmCoba + $d;
                    // Pastikan kelas kosong DAN guru juga kosong di jam tersebut
                    if (!empty($matrixKelas[$kelasId][$hariCoba][$jamCek]) ||
                    (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jamCek]))) {
                        $bisaSteril = false; break;
                    }
                }

                if ($bisaSteril) {
                    $assignedHari = $hariCoba;
                    $assignedJam = $jmCoba;
                    break;
                }
            }

            // TIER 2: JIKA GAGAL STERIL, CARI SLOT LAIN YANG GURU & KELASNYA KOSONG (Perluas Pencarian, Jangan Langsung Tabrak Guru)
            if (!$assignedHari || !$assignedJam) {
                foreach ($this->hari as $hari) {
                    $maxHInternal = $this->getMaxJamInternal($hari);
                    $batasMulai = $isPenjaskes ? min(3, $maxHInternal - $durasi + 1) : ($maxHInternal - $durasi + 1);

                    for ($jm = 1; $jm <= $batasMulai; $jm++) {
                        $bisaLagi = true;
                        for ($d = 0; $d < $durasi; $d++) {
                            $jamCek = $jm + $d;
                            if (!empty($matrixKelas[$kelasId][$hari][$jamCek]) ||
                            (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                                $bisaLagi = false; break;
                            }
                        }
                        if ($bisaLagi) {
                            $assignedHari = $hari;
                            $assignedJam = $jm;
                            break 2;
                        }
                    }
                }
            }

            // TIER 3: EXTREME FALLBACK (Jika benar-benar buntu, cari jam kosong di kelas saja demi 57 jam, tapi catat peringatan)
            if (!$assignedHari || !$assignedJam) {
                foreach ($kemungkinanSlot as $slot) {
                    $hariCoba = $slot['hari'];
                    $jmCoba = $slot['jam'];
                    $bisaKelas = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        if (!empty($matrixKelas[$kelasId][$hariCoba][$jmCoba + $d])) {
                            $bisaKelas = false; break;
                        }
                    }
                    if ($bisaKelas) {
                        $assignedHari = $hariCoba;
                        $assignedJam = $jmCoba;
                        break;
                    }
                }
            }

            // Jika masih buntu total, fallback terakhir ke hari pertama jam pertama
            if (!$assignedHari || !$assignedJam) {
                $assignedHari = $this->hari[0];
                $assignedJam = 1;
            }

            // EKSEKUSI PENEMPATAN KE MATRIKS DAN KROMOSOM
            for ($d = 0; $d < $durasi; $d++) {
                $jamCek = $assignedJam + $d;
                $maxHInternal = $this->getMaxJamInternal($assignedHari);
                if ($jamCek <= $maxHInternal) {
                    $matrixKelas[$kelasId][$assignedHari][$jamCek] = true;
                    if (!$isPenjaskes && $guruId !== 'none') {
                        $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                    }
                }
            }

            $gen['hari'] = $assignedHari;
            $gen['jam_mulai'] = (int) $assignedJam;

            if (!isset($cleanedKromosom[$kelasId])) {
                $cleanedKromosom[$kelasId] = [];
            }
            $cleanedKromosom[$kelasId][$cId] = $gen;
        }

        return $cleanedKromosom;
    }
    private function seleksi($fitnessPopulasi)
    {
        $ukuranTurnamen = 3;
        $kandidatTerbaik = null;
        for ($i = 0; $i < $ukuranTurnamen; $i++) {
            $kandidatAcak = $fitnessPopulasi[array_rand($fitnessPopulasi)];
            if ($kandidatTerbaik === null || $kandidatAcak['fitness'] > $kandidatTerbaik['fitness']) {
                $kandidatTerbaik = $kandidatAcak;
            }
        }
        return $kandidatTerbaik['kromosom'];
    }

 private function crossover($parent1, $parent2)
    {
        // Cek peluang crossover
        if ((mt_rand() / mt_getrandmax()) > $this->crossoverRate) {
            return $parent1; // Kembalikan parent1 utuh tanpa diubah
        }

        // SAFE CROSSOVER: Jadikan Parent 1 sebagai dominan (fondasi utama yang steril)
        $child = $parent1;
        $kelasKeysParent2 = array_keys($parent2);

        if (!empty($kelasKeysParent2)) {
            // SANGAT PENTING: Jangan menukar setengah kelas secara 50/50!
            // Cukup suntikkan 1 atau maksimal 2 kelas dari Parent 2 ke dalam Child.
            // Ini meminimalisir kerusakan jadwal guru, dan sisa tabrakannya akan disembuhkan oleh Mutasi.
            $jumlahTukar = mt_rand(1, 2);

            for ($i = 0; $i < $jumlahTukar; $i++) {
                $randomKelasId = $kelasKeysParent2[array_rand($kelasKeysParent2)];

                // Timpa jadwal kelas tersebut dengan gen dari Parent 2
                if (isset($parent2[$randomKelasId])) {
                    $child[$randomKelasId] = $parent2[$randomKelasId];
                }
            }
        }

        return $child;
    }
 private function mutasi($kromosom)
    {
        // Cek peluang mutasi
        if ((mt_rand() / mt_getrandmax()) > $this->mutationRate) {
            return $kromosom;
        }

        $bentrokChunks = [];
        $matrixGuru = [];
        $matrixKelas = [];

        // 1. SCANNING: Petakan jadwal untuk mencari yang bentrok
        foreach ($kromosom as $kId => $gens) {
            foreach ($gens as $cId => $gen) {
                $h = $gen['hari'] ?? null;
                $jm = $gen['jam_mulai'] ?? null;
                $dur = $gen['durasi'] ?? 0;
                $gId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (!$h || !$jm) {
                    $bentrokChunks[] = ['kelasId' => $kId, 'chunkId' => $cId, 'durasi' => $dur, 'guruId' => $gId, 'isPenjaskes' => $isPenjaskes];
                    continue;
                }

                $isBentrok = false;
                for ($d = 0; $d < $dur; $d++) {
                    $jam = $jm + $d;
                    if (isset($matrixKelas[$kId][$h][$jam])) $isBentrok = true;
                    if (!$isPenjaskes && $gId !== 'none' && isset($matrixGuru[$gId][$h][$jam])) $isBentrok = true;
                }

                if ($isBentrok) {
                    $bentrokChunks[] = ['kelasId' => $kId, 'chunkId' => $cId, 'durasi' => $dur, 'guruId' => $gId, 'isPenjaskes' => $isPenjaskes];
                } else {
                    for ($d = 0; $d < $dur; $d++) {
                        $jam = $jm + $d;
                        $matrixKelas[$kId][$h][$jam] = true;
                        if (!$isPenjaskes && $gId !== 'none') $matrixGuru[$gId][$h][$jam] = true;
                    }
                }
            }
        }

        // 2. RESOLUSI BENTROK
        if (!empty($bentrokChunks)) {
            shuffle($bentrokChunks);
            $jumlahMutasiTarget = min(count($bentrokChunks), mt_rand(3, max(3, intval(count($bentrokChunks) * 0.7))));

            for ($i = 0; $i < $jumlahMutasiTarget; $i++) {
                if (!isset($bentrokChunks[$i])) break;

                $target = $bentrokChunks[$i];

                // Mencegah mapel Penjaskes diacak saat resolusi bentrok
                if ($target['isPenjaskes']) continue;

                $kId = $target['kelasId'];
                $cId = $target['chunkId'];
                $dur = $target['durasi'];

                // Geser secara acak untuk mendobrak posisi bentrok
                $hariAcak = $this->hari[array_rand($this->hari)];
                $maxH = $this->getMaxJamInternal($hariAcak);
                $jmRandom = mt_rand(1, max(1, $maxH - $dur + 1));

                $kromosom[$kId][$cId]['hari'] = $hariAcak;
                $kromosom[$kId][$cId]['jam_mulai'] = $jmRandom;
            }
        }

        // 3. EKSPLORASI RADIKAL ANTI-STAGNASI (Selalu rombak 10% s.d. 20% blok jadwal)
        $kelasKeys = array_keys($kromosom);
        if (!empty($kelasKeys)) {
            // Tingkatkan jumlah acakan menjadi 8 sampai 12 blok sekaligus agar keluar dari local optima
            $jumlahEksplorasi = mt_rand(8, 12);
            for ($i = 0; $i < $jumlahEksplorasi; $i++) {
                $randomKelasId = $kelasKeys[array_rand($kelasKeys)];
                if (empty($kromosom[$randomKelasId])) continue;

                $chunkIds = array_keys($kromosom[$randomKelasId]);
                $randomChunkId = $chunkIds[array_rand($chunkIds)];

                // Mencegah mapel Penjaskes terpilih untuk eksplorasi radikal
                $isPenjaskes = $kromosom[$randomKelasId][$randomChunkId]['is_penjaskes'] ?? false;
                if ($isPenjaskes) continue;

                $hariAcak = $this->hari[array_rand($this->hari)];
                $durasi = $kromosom[$randomKelasId][$randomChunkId]['durasi'] ?? 1;
                $maxH = $this->getMaxJamInternal($hariAcak);
                $jmRandom = mt_rand(1, max(1, $maxH - $durasi + 1));

                $kromosom[$randomKelasId][$randomChunkId]['hari'] = $hariAcak;
                $kromosom[$randomKelasId][$randomChunkId]['jam_mulai'] = $jmRandom;
            }
        }

        return $kromosom;
    }

    private function getValidStartJam($hari, $durasi)
    {
        $maxJamInternal = $this->getMaxJamInternal($hari);
        $validStarts = [];
        for ($start = 1; $start <= ($maxJamInternal - $durasi + 1); $start++) {
            $validStarts[] = $start;
        }
        if (empty($validStarts)) return 1;
        return $validStarts[array_rand($validStarts)];
    }
}
