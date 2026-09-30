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
            $matrixMapel = []; // Tambahan Mapel Tracking
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
                    $matrixMapel[$kId][$h] = [];
                }
            }

            // 1. KUNCI JADWAL YANG 100% BERSIH
            foreach ($bestKromosom as $kelasId => &$gens) {
                foreach ($gens as $chunkId => $gen) {
                    $h = $gen['hari'] ?? null;
                    $jm = $gen['jam_mulai'] ?? null;
                    $dur = $gen['durasi'] ?? 1;
                    $mapelId = $gen['mapel_id'] ?? null;
                    $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                    $isPenjaskes = $gen['is_penjaskes'] ?? false;

                    $isBentrok = false;

                    if (!$h || !$jm || isset($matrixMapel[$kelasId][$h][$mapelId])) {
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
                        $matrixMapel[$kelasId][$h][$mapelId] = true;
                    }
                }
            }
            unset($gens);

            $sisaKonflikUtuhNormal = [];

            // 2. AMANKAN BLOK UTUH
            foreach ($konflikUtuh as $gen) {
                $kelasId = $gen['kelas_id_asli'];
                $durasi = $gen['durasi'];
                $mapelId = $gen['mapel_id'] ?? null;
                $isPenjaskes = $gen['is_penjaskes'] ?? false;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');

                $kemungkinanSlotUtuh = [];
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJam($h);
                    $batasMulai = $isPenjaskes ? min(3, $maxH - $durasi + 1) : ($maxH - $durasi + 1);
                    for ($jm = 1; $jm <= $batasMulai; $jm++) {
                        $kemungkinanSlotUtuh[] = ['hari' => $h, 'jam' => $jm];
                    }
                }
                shuffle($kemungkinanSlotUtuh);

                $ditemukan = false;

                foreach ($kemungkinanSlotUtuh as $slot) {
                    $hariCoba = $slot['hari']; $jm = $slot['jam'];
                    if (isset($matrixMapel[$kelasId][$hariCoba][$mapelId])) continue; // Mapel jangan ganda

                    $bisa = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        $jCek = $jm + $d;
                        if (!empty($matrixKelas[$kelasId][$hariCoba][$jCek]) ||
                            (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jCek]))) {
                            $bisa = false; break;
                        }
                    }

                    if ($bisa) {
                        $gen['hari'] = $hariCoba; $gen['jam_mulai'] = $jm; unset($gen['kelas_id_asli']);
                        for ($d = 0; $d < $durasi; $d++) {
                            $jCek = $jm + $d;
                            $matrixKelas[$kelasId][$hariCoba][$jCek] = true;
                            if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$hariCoba][$jCek] = true;
                        }
                        $matrixMapel[$kelasId][$hariCoba][$mapelId] = true;
                        $bestKromosom[$kelasId]['patched_utuh_'.uniqid()] = $gen;
                        $ditemukan = true; break;
                    }
                }

                if (!$ditemukan) {
                    $sisaKonflikUtuhNormal[] = $gen;
                }
            }

            foreach ($sisaKonflikUtuhNormal as $gen) {
                for ($d = 0; $d < $gen['durasi']; $d++) {
                    $potongan = $gen; $potongan['durasi'] = 1; $konflik1Jam[] = $potongan;
                }
            }

            // 3. TAMBAL JADWAL 1 JAM
            foreach ($konflik1Jam as $gen) {
                $kelasId = $gen['kelas_id_asli'] ?? $gen['kelas_id'];
                $mapelId = $gen['mapel_id'] ?? null;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                $kemungkinanSlot1Jam = [];
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJam($h);
                    for ($jm = 1; $jm <= $maxH; $jm++) {
                        $kemungkinanSlot1Jam[] = ['hari' => $h, 'jam' => $jm];
                    }
                }
                shuffle($kemungkinanSlot1Jam);

                $ditemukan = false;

                foreach ($kemungkinanSlot1Jam as $slot) {
                    $hariCoba = $slot['hari']; $jm = $slot['jam'];
                    if (empty($matrixKelas[$kelasId][$hariCoba][$jm]) &&
                       ($isPenjaskes || $guruId === 'none' || empty($matrixGuru[$guruId][$hariCoba][$jm]))) {

                        $gen['hari'] = $hariCoba; $gen['jam_mulai'] = $jm; unset($gen['kelas_id_asli']);
                        $matrixKelas[$kelasId][$hariCoba][$jm] = true;
                        if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$hariCoba][$jm] = true;
                        $matrixMapel[$kelasId][$hariCoba][$mapelId] = true;
                        $bestKromosom[$kelasId]['patched_1jam_'.uniqid()] = $gen;
                        $ditemukan = true; break;
                    }
                }

                if (!$ditemukan) {
                    $slotDarurat = $kemungkinanSlot1Jam[0];
                    $gen['hari'] = $slotDarurat['hari']; $gen['jam_mulai'] = $slotDarurat['jam'];
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

        $kelasArray = $this->kelas instanceof \Illuminate\Support\Collection ? $this->kelas->all() : (array) $this->kelas;

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
            $matrixMapelGlobal = []; 

            foreach ($kelasPrioritas as $kls) {
                $kId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
                if (!$kId) continue;
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJamInternal($h);
                    $matrixKelasGlobal[$kId][$h] = array_fill(1, $maxH, false);
                    $matrixMapelGlobal[$kId][$h] = [];
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
                        $chunksDurasi = [$bebanSeharusnya];
                    } else {
                        $sisa = $bebanSeharusnya;
                        if ($sisa == 1) {
                            $chunksDurasi = [1];
                        } else {
                            while ($sisa > 0) {
                                if ($sisa == 4) { array_push($chunksDurasi, 2, 2); $sisa = 0; }
                                elseif ($sisa == 5) { array_push($chunksDurasi, 3, 2); $sisa = 0; }
                                elseif ($sisa == 2) { $chunksDurasi[] = 2; $sisa = 0; }
                                elseif ($sisa >= 3) { $chunksDurasi[] = 3; $sisa -= 3; }
                            }
                        }
                    }

                    foreach ($chunksDurasi as $dur) {
                        $allChunksToAllocate[] = [
                            'gm' => $gm, 'durasi' => $dur, 'is_penjaskes' => $isPenjaskes, 'nama_mapel' => $namaMapel
                        ];
                    }
                }

                usort($allChunksToAllocate, function($a, $b) use ($totalBebanGuru) {
                    if ($a['is_penjaskes'] && !$b['is_penjaskes']) return -1;
                    if (!$a['is_penjaskes'] && $b['is_penjaskes']) return 1;
                    if ($a['durasi'] !== $b['durasi']) return $b['durasi'] <=> $a['durasi'];

                    $gA = !empty($a['gm']->guru_id) ? 'g_'.$a['gm']->guru_id : 'none';
                    $gB = !empty($b['gm']->guru_id) ? 'g_'.$b['gm']->guru_id : 'none';
                    return ($totalBebanGuru[$gB] ?? 0) <=> ($totalBebanGuru[$gA] ?? 0);
                });

                $counterId = 1;
                foreach ($allChunksToAllocate as $item) {
                    $gm = $item['gm'];
                    $durasiChunk = $item['durasi'];
                    $isPenjaskes = $item['is_penjaskes'];
                    $namaMapel = $item['nama_mapel'];
                    $mapelId = $gm->mapel_id;
                    $guruId = !empty($gm->guru_id) ? 'g_' . $gm->guru_id : (!empty($gm->nip) ? 'n_' . $gm->nip : 'none');

                    $chunkId = 'gm_' . $gm->id . '_b_' . $counterId . '_p_' . $i;
                    $counterId++;

                    $assignedHari = null;
                    $assignedJam = null;
                    $hariAcak = $this->hari;
                    shuffle($hariAcak);

                    foreach ($hariAcak as $hari) {
                        $maxH = $this->getMaxJamInternal($hari);
                        $batasMulaiJam = $isPenjaskes ? min(3, $maxH - $durasiChunk + 1) : ($maxH - $durasiChunk + 1);

                        if (isset($matrixMapelGlobal[$kelasId][$hari][$mapelId])) continue;

                        for ($jm = 1; $jm <= $batasMulaiJam; $jm++) {
                            $bisa = true;
                            for ($d = 0; $d < $durasiChunk; $d++) {
                                $jamCek = $jm + $d;
                                if (!empty($matrixKelasGlobal[$kelasId][$hari][$jamCek]) ||
                                (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                                    $bisa = false; break;
                                }
                            }
                            if ($bisa) {
                                $assignedHari = $hari; $assignedJam = $jm; break 2;
                            }
                        }
                    }

                    if ($assignedHari && $assignedJam) {
                        for ($d = 0; $d < $durasiChunk; $d++) {
                            $jamCek = $assignedJam + $d;
                            $matrixKelasGlobal[$kelasId][$assignedHari][$jamCek] = true;
                            if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                        }
                        $matrixMapelGlobal[$kelasId][$assignedHari][$mapelId] = true;

                        $kromosom[$kelasId][$chunkId] = [
                            'guru_id' => $gm->guru_id ?? null, 'nip' => $gm->nip ?? null,
                            't_list_guru_mapel_id' => $gm->id, 'blok_id' => $chunkId,
                            'mapel_id' => $mapelId, 'nama_mapel' => $namaMapel, 'kelas_id' => $kelasId,
                            'hari' => $assignedHari, 'jam_mulai' => (int) $assignedJam,
                            'durasi' => (int) $durasiChunk, 'is_penjaskes' => $isPenjaskes
                        ];
                    } else {
                        $globalUnassignedChunks[] = [
                            'kelas_id' => $kelasId, 'gm' => $gm, 'chunk_id' => $chunkId,
                            'durasi' => $durasiChunk, 'is_penjaskes' => $isPenjaskes,
                            'nama_mapel' => $namaMapel, 'guru_id' => $guruId, 'mapel_id' => $mapelId
                        ];
                    }
                }
            }
            
            foreach ($globalUnassignedChunks as $unassigned) {
                $kelasId = $unassigned['kelas_id']; $gm = $unassigned['gm'];
                $chunkId = $unassigned['chunk_id']; $durasiChunk = $unassigned['durasi'];
                $isPenjaskes = $unassigned['is_penjaskes']; $namaMapel = $unassigned['nama_mapel'];
                $guruId = $unassigned['guru_id']; $mapelId = $unassigned['mapel_id'];

                $assignedHari = null; $assignedJam = null;
                $hariAcak = $this->hari; shuffle($hariAcak);

                foreach ($hariAcak as $hari) {
                    $maxH = $this->getMaxJamInternal($hari);
                    $batasMulaiJam = $isPenjaskes ? min(3, $maxH - $durasiChunk + 1) : ($maxH - $durasiChunk + 1);

                    for ($jm = 1; $jm <= $batasMulaiJam; $jm++) {
                        $bisaSteril = true;
                        for ($d = 0; $d < $durasiChunk; $d++) {
                            $jamCek = $jm + $d;
                            if (!empty($matrixKelasGlobal[$kelasId][$hari][$jamCek]) ||
                                (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                                $bisaSteril = false; break;
                            }
                        }
                        if ($bisaSteril) {
                            $assignedHari = $hari; $assignedJam = $jm; break 2;
                        }
                    }
                }

                if (!$assignedHari || !$assignedJam) {
                    foreach ($hariAcak as $hari) {
                        $maxH = $this->getMaxJamInternal($hari);
                        $batasMulaiJam = $maxH - $durasiChunk + 1;

                        for ($jm = 1; $jm <= $batasMulaiJam; $jm++) {
                            $bisaSteril = true;
                            for ($d = 0; $d < $durasiChunk; $d++) {
                                $jamCek = $jm + $d;
                                if (!empty($matrixKelasGlobal[$kelasId][$hari][$jamCek]) ||
                                    (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                                    $bisaSteril = false; break;
                                }
                            }
                            if ($bisaSteril) {
                                $assignedHari = $hari; $assignedJam = $jm; break 2;
                            }
                        }
                    }
                }

                if (!$assignedHari || !$assignedJam) {
                    foreach ($this->hari as $hariCoba) {
                        $maxH = $this->getMaxJamInternal($hariCoba);
                        for ($jm = 1; $jm <= ($maxH - $durasiChunk + 1); $jm++) {
                            $bisaAman = true;
                            for ($d = 0; $d < $durasiChunk; $d++) {
                                $jamCek = $jm + $d;
                                if (!empty($matrixKelasGlobal[$kelasId][$hariCoba][$jamCek]) ||
                                    (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jamCek]))) {
                                    $bisaAman = false; break;
                                }
                            }
                            if ($bisaAman) {
                                $assignedHari = $hariCoba;
                                $assignedJam = $jm;
                                break 2;
                            }
                        }
                    }
                }

                // SMART SPLIT RESCUE (INISIALISASI)
                if ($assignedHari && $assignedJam) {
                    for ($d = 0; $d < $durasiChunk; $d++) {
                        $jamCek = $assignedJam + $d;
                        $matrixKelasGlobal[$kelasId][$assignedHari][$jamCek] = true;
                        if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                    }
                    $matrixMapelGlobal[$kelasId][$assignedHari][$mapelId] = true;

                    $kromosom[$kelasId][$chunkId] = [
                        'guru_id' => $gm->guru_id ?? null, 'nip' => $gm->nip ?? null,
                        't_list_guru_mapel_id' => $gm->id, 'blok_id' => $chunkId,
                        'mapel_id' => $mapelId, 'nama_mapel' => $namaMapel, 'kelas_id' => $kelasId,
                        'hari' => $assignedHari, 'jam_mulai' => (int) $assignedJam,
                        'durasi' => (int) $durasiChunk, 'is_penjaskes' => $isPenjaskes
                    ];
                } else {
                    $sisaDurasi = $durasiChunk;
                    foreach ($this->hari as $hCoba) {
                        $maxHInternal = $this->getMaxJamInternal($hCoba);
                        for ($jCoba = 1; $jCoba <= $maxHInternal; $jCoba++) {
                            // PASTIKAN SLOT BENAR-BENAR KOSONG
                            if ($matrixKelasGlobal[$kelasId][$hCoba][$jCoba] === false) {
                                
                                $newChunkId = $chunkId . '_split_' . $sisaDurasi;
                                $matrixKelasGlobal[$kelasId][$hCoba][$jCoba] = true;
                                if (!$isPenjaskes && $guruId !== 'none') {
                                    $matrixGuru[$guruId][$hCoba][$jCoba] = true;
                                }
                                $matrixMapelGlobal[$kelasId][$hCoba][$mapelId] = true;

                                $kromosom[$kelasId][$newChunkId] = [
                                    'guru_id' => $gm->guru_id ?? null, 'nip' => $gm->nip ?? null,
                                    't_list_guru_mapel_id' => $gm->id, 'blok_id' => $newChunkId,
                                    'mapel_id' => $mapelId, 'nama_mapel' => $namaMapel, 'kelas_id' => $kelasId,
                                    'hari' => $hCoba, 'jam_mulai' => (int) $jCoba,
                                    'durasi' => 1, 'is_penjaskes' => $isPenjaskes
                                ];

                                $sisaDurasi--;
                                if ($sisaDurasi == 0) break 2;
                            }
                        }
                    }
                }
            }
            $populasi[] = $kromosom;
        }

        return $populasi;
    }
   private function hitungFitness($kromosom, $isDebug = false)
    {
        $penalty = 0;
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
        $totalDurasiMapel = [];
        $mapelSlotsPerHari = [];

        foreach ($kromosom as $kelasId => $gens) {
            foreach ($gens as $gen) {
                $mapelId = $gen['mapel_id'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                $hari = $gen['hari'] ?? null;
                $jamMulai = $gen['jam_mulai'] ?? null;

                if ($mapelId) {
                    $totalDurasiMapel[$kelasId][$mapelId] = ($totalDurasiMapel[$kelasId][$mapelId] ?? 0) + $durasi;
                }

                if ($hari && $jamMulai && $mapelId) {
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamKe = $jamMulai + $d;
                        $mapelSlotsPerHari[$kelasId][$hari][$mapelId][] = $jamKe;
                    }
                }
            }
        }

        foreach ($mapelSlotsPerHari as $kelasId => $hariList) {
            foreach ($hariList as $hari => $mapelList) {
                foreach ($mapelList as $mapelId => $jams) {
                    sort($jams);
                    for ($i = 0; $i < count($jams) - 1; $i++) {
                        if ($jams[$i + 1] - $jams[$i] > 1) {
                            $penalty += 500.0;
                            $detailPenalti['mapel_harian'] += 2500.0;
                            
                            $jamString = implode(', ', $jams);
                            Log::warning("⚠️ [Mapel Terpecah] Kelas ID: {$kelasId} | Hari: {$hari} | Mapel ID: {$mapelId} memiliki jam yang tidak berurutan/terpecah: (Jam ke- {$jamString})");
                            
                            break;
                        }
                    }
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

                if (!$hari || !$jamMulai) {
                    $penalty += 5000.0;
                    $detailPenalti['fatal'] += 5000.0;
                    continue;
                }

                if ($durasi == 1 && $mapelId) {
                    $totalBebanMapelIni = $totalDurasiMapel[$kelasId][$mapelId] ?? 1;
                    if ($totalBebanMapelIni > 1) {
                        $penalty += 50.0;
                        $detailPenalti['blok_sendirian'] += 50.0;
                    }
                }

                for ($d = 0; $d < $durasi; $d++) {
                    $jam = $jamMulai + $d;
                    $maxReal = $this->getMaxJam($hari);
                    $maxInternal = $this->getMaxJamInternal($hari);

                    // Out of Bounds Extremes
                    if ($jam > $maxInternal || $jam < 1) {
                        $penalty += 5000.0; 
                        $detailPenalti['out_of_bounds'] += 5000.0;
                        Log::warning("⚠️ [Out of Bounds Fatal] Kelas ID: {$kelasId} | Hari: {$hari} | Jam ke-{$jam} melewati batas internal maksimal!");
                    } elseif ($jam > $maxReal) {
                        $penalty += 100.0;
                        $detailPenalti['out_of_bounds'] += 100.0;
                    }

                    // Bentrok Kelas Extremes
                    if (isset($trackerKelas[$kelasId][$hari][$jam])) {
                        $penalty += 5000.0; 
                        $detailPenalti['bentrok_kelas'] += 5000.0;
                        
                        $namaMapel = $gen['nama_mapel'] ?? 'Mapel ID: ' . $mapelId;
                        Log::warning("🚨 [Bentrok Kelas] Kelas ID: {$kelasId} | Hari: {$hari} | Jam ke-{$jam} tertimpa ganda! (Mapel: {$namaMapel})");
                    } else {
                        $trackerKelas[$kelasId][$hari][$jam] = true;
                    }

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

        foreach ($kromosom as $kelasId => $gens) {
            $totalJamPerKelas = 0;
            foreach ($gens as $gen) {
                $totalJamPerKelas += (int) ($gen['durasi'] ?? 0);
            }
            if ($totalJamPerKelas !== 57) {
                $p = abs(57 - $totalJamPerKelas) * 10000.0;
                $penalty += $p;
                $detailPenalti['beban_jam'] += $p;
            }
        }

        foreach ($trackerKelas as $kelasId => $hariList) {
            foreach ($hariList as $hariCek => $jamList) {
                if (empty($jamList)) continue;
                $jams = array_keys($jamList);
                $minJ = min($jams);
                $maxJ = max($jams);
                $terisi = count($jams);

                if ($minJ > 1) {
                    $p = (($minJ - 1) * 20.0);
                    $penalty += $p;
                    $detailPenalti['struktur_jam'] += $p;
                }

                $seharusnya = $maxJ - $minJ + 1;
                if ($terisi < $seharusnya) {
                    $gaps = $seharusnya - $terisi;
                    $p = ($gaps * 200.0);
                    $penalty += $p;
                    $detailPenalti['struktur_jam'] += $p;
                }
            }
        }

        $fitness = 5000.0 / (5000.0 + $penalty);
        $finalFitness = max(0.0001, round($fitness, 6));

        if ($isDebug) {
            Log::debug("📊 [Hitung Fitness] Skor: {$finalFitness} | Total Penalti: {$penalty} | B.Guru : {$detailPenalti['bentrok_guru']} | B.MapelNumpuk : {$detailPenalti['bentrok_kelas']} | Mapel < 57 : {$detailPenalti['beban_jam']} | STRUKTUR JAM :{$detailPenalti['struktur_jam']} ");
        }

        return $finalFitness;
    }
private function repairKromosom($kromosom)
    {
        $matrixKelas = [];
        $matrixGuru = [];
        $matrixMapel = []; 
        $cleanedKromosom = [];
        $unassignedChunks = [];

        $kelasArray = $this->kelas instanceof \Illuminate\Support\Collection ? $this->kelas->all() : (array) $this->kelas;

        foreach ($kelasArray as $kls) {
            $kId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
            if (!$kId) continue;
            foreach ($this->hari as $h) {
                $maxHInternal = $this->getMaxJamInternal($h);
                for ($jm = 1; $jm <= $maxHInternal; $jm++) {
                    $matrixKelas[$kId][$h][$jm] = false;
                }
                $matrixMapel[$kId][$h] = [];
            }
        }

        foreach ($kromosom as $kelasId => $gens) {
            if (!isset($cleanedKromosom[$kelasId])) $cleanedKromosom[$kelasId] = [];

            foreach ($gens as $cId => $gen) {
                $hari = $gen['hari'] ?? null;
                $jamMulai = $gen['jam_mulai'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                $mapelId = $gen['mapel_id'] ?? null;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (!$hari || !$jamMulai || $durasi <= 0 || isset($matrixMapel[$kelasId][$hari][$mapelId])) {
                    $unassignedChunks[] = $gen;
                    continue;
                }

                $maxHInternal = $this->getMaxJamInternal($hari);
                $bisa = true;

                for ($d = 0; $d < $durasi; $d++) {
                    $jamCek = $jamMulai + $d;
                    if ($jamCek > $maxHInternal || $jamCek < 1) { $bisa = false; break; }
                    if ($matrixKelas[$kelasId][$hari][$jamCek] === true) { $bisa = false; break; }
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
                    $matrixMapel[$kelasId][$hari][$mapelId] = true;
                    $cleanedKromosom[$kelasId][$cId] = $gen;
                } else {
                    $unassignedChunks[] = $gen;
                }
            }
        }

        foreach ($unassignedChunks as $gen) {
            $kelasId = $gen['kelas_id'] ?? null;
            if (!$kelasId) continue;

            $durasi = $gen['durasi'] ?? 1;
            $mapelId = $gen['mapel_id'] ?? null;
            $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
            $isPenjaskes = $gen['is_penjaskes'] ?? false;
            $cId = $gen['blok_id'] ?? ('chunk_' . uniqid());

            $assignedHari = null; $assignedJam = null;
            $kemungkinanSlot = [];

            foreach ($this->hari as $hari) {
                $maxHInternal = $this->getMaxJamInternal($hari);
                $batasMulai = $isPenjaskes ? min(3, $maxHInternal - $durasi + 1) : ($maxHInternal - $durasi + 1);
                for ($jm = 1; $jm <= $batasMulai; $jm++) {
                    $kemungkinanSlot[] = ['hari' => $hari, 'jam' => $jm];
                }
            }
            shuffle($kemungkinanSlot);

            foreach ($kemungkinanSlot as $slot) {
                $hariCoba = $slot['hari']; $jmCoba = $slot['jam'];
                $bisaSteril = true;
                for ($d = 0; $d < $durasi; $d++) {
                    $jamCek = $jmCoba + $d;
                    if (!empty($matrixKelas[$kelasId][$hariCoba][$jamCek]) ||
                        (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jamCek]))) {
                        $bisaSteril = false; break;
                    }
                }
                if ($bisaSteril) { $assignedHari = $hariCoba; $assignedJam = $jmCoba; break; }
            }

            if (!$assignedHari || !$assignedJam) {
                $semuaSlotDarurat = [];
                foreach ($this->hari as $hari) {
                    $maxHInternal = $this->getMaxJamInternal($hari);
                    for ($jm = 1; $jm <= ($maxHInternal - $durasi + 1); $jm++) {
                        $semuaSlotDarurat[] = ['hari' => $hari, 'jam' => $jm];
                    }
                }
                shuffle($semuaSlotDarurat);

                foreach ($semuaSlotDarurat as $slot) {
                    $hariCoba = $slot['hari']; $jmCoba = $slot['jam'];
                    $bisaAman = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamCek = $jmCoba + $d;
                        if (!empty($matrixKelas[$kelasId][$hariCoba][$jamCek]) ||
                            (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jamCek]))) {
                            $bisaAman = false; break;
                        }
                    }
                    if ($bisaAman) {
                        $assignedHari = $hariCoba;
                        $assignedJam = $jmCoba;
                        break;
                    }
                }
            }

            // SMART SPLIT RESCUE (REPAIR)
            if ($assignedHari && $assignedJam) {
                for ($d = 0; $d < $durasi; $d++) {
                    $jamCek = $assignedJam + $d;
                    $maxHInternal = $this->getMaxJamInternal($assignedHari);
                    if ($jamCek <= $maxHInternal) {
                        $matrixKelas[$kelasId][$assignedHari][$jamCek] = true;
                        if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                    }
                }

                if ($mapelId) {
                    $matrixMapel[$kelasId][$assignedHari][$mapelId] = true;
                }

                $gen['hari'] = $assignedHari;
                $gen['jam_mulai'] = (int) $assignedJam;

                if (!isset($cleanedKromosom[$kelasId])) $cleanedKromosom[$kelasId] = [];
                $cleanedKromosom[$kelasId][$cId] = $gen;
                
            } else {
                $sisaDurasi = $durasi;
                foreach ($this->hari as $hCoba) {
                    $maxHInternal = $this->getMaxJamInternal($hCoba);
                    for ($jCoba = 1; $jCoba <= $maxHInternal; $jCoba++) {
                        
                        // PASTIKAN SLOT BENAR-BENAR KOSONG
                        if ($matrixKelas[$kelasId][$hCoba][$jCoba] === false) {
                            
                            $newChunkId = $cId . '_split_' . $sisaDurasi;
                            $genSplit = $gen;
                            $genSplit['hari'] = $hCoba;
                            $genSplit['jam_mulai'] = $jCoba;
                            $genSplit['durasi'] = 1;
                            $genSplit['blok_id'] = $newChunkId;

                            $matrixKelas[$kelasId][$hCoba][$jCoba] = true;
                            if (!$isPenjaskes && $guruId !== 'none') {
                                $matrixGuru[$guruId][$hCoba][$jCoba] = true;
                            }
                            if ($mapelId) {
                                $matrixMapel[$kelasId][$hCoba][$mapelId] = true;
                            }

                            if (!isset($cleanedKromosom[$kelasId])) $cleanedKromosom[$kelasId] = [];
                            $cleanedKromosom[$kelasId][$newChunkId] = $genSplit;

                            $sisaDurasi--;
                            if ($sisaDurasi == 0) {
                                break 2;
                            }
                        }
                    }
                }
            }
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
        if ((mt_rand() / mt_getrandmax()) > $this->mutationRate) {
            return $kromosom;
        }

        $matrixGuru = [];
        $matrixKelas = [];
        $matrixMapel = []; 
        $blokPrioritasMutasi = []; 

        foreach ($kromosom as $kId => $gens) {
            foreach ($gens as $cId => $gen) {
                $h = $gen['hari'] ?? null;
                $jm = $gen['jam_mulai'] ?? null;
                $dur = $gen['durasi'] ?? 0;
                $mapelId = $gen['mapel_id'] ?? null;
                $gId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (!$h || !$jm) continue;

                $isBentrok = false;

                for ($d = 0; $d < $dur; $d++) {
                    $jam = $jm + $d;
                    
                    if (isset($matrixKelas[$kId][$h][$jam])) {
                        $isBentrok = true;
                    }
                    $matrixKelas[$kId][$h][$jam] = true;

                    if (!$isPenjaskes && $gId !== 'none') {
                        if (isset($matrixGuru[$gId][$h][$jam])) {
                            $isBentrok = true;
                        }
                        $matrixGuru[$gId][$h][$jam] = true;
                    }
                }

                if ($mapelId) {
                    if (isset($matrixMapel[$kId][$h][$mapelId])) {
                        $isBentrok = true;
                    }
                    $matrixMapel[$kId][$h][$mapelId] = true;
                }

                if ($isBentrok) {
                    $blokPrioritasMutasi[$kId][$cId] = true;
                }
            }
        }

        $cariSlotMutasi = function($durasi, $isPenjaskes, $guruId, $mapelId, $kelasId, &$matrixKelas, &$matrixGuru, &$matrixMapel) {
            $hariAcakList = $this->hari;
            shuffle($hariAcakList);

            foreach ($hariAcakList as $hari) {
                if (isset($matrixMapel[$kelasId][$hari][$mapelId])) continue;
                $maxH = $this->getMaxJamInternal($hari);
                $batasMulai = $isPenjaskes ? min(3, $maxH - $durasi + 1) : ($maxH - $durasi + 1);

                for ($jm = 1; $jm <= $batasMulai; $jm++) {
                    $bisa = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamCek = $jm + $d;
                        if (!empty($matrixKelas[$kelasId][$hari][$jamCek]) ||
                            (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                            $bisa = false; break;
                        }
                    }
                    if ($bisa) return ['hari' => $hari, 'jam_mulai' => $jm];
                }
            }

            foreach ($this->hari as $hari) {
                $maxH = $this->getMaxJamInternal($hari);
                for ($jm = 1; $jm <= ($maxH - $durasi + 1); $jm++) {
                    $bisaAman = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamCek = $jm + $d;
                        if (!empty($matrixKelas[$kelasId][$hari][$jamCek]) ||
                            (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                            $bisaAman = false; break;
                        }
                    }
                    if ($bisaAman) return ['hari' => $hari, 'jam_mulai' => $jm];
                }
            }

            return null;
        };

        foreach ($kromosom as $kId => &$gens) {
            foreach ($gens as $cId => &$gen) {
                
                $isTargetMutasi = isset($blokPrioritasMutasi[$kId][$cId]);
                
                if (!$isTargetMutasi && (mt_rand() / mt_getrandmax()) > 0.1) {
                    continue; 
                }

                $isPenjaskes = $gen['is_penjaskes'] ?? false;
                if ($isPenjaskes) continue;

                $dur = $gen['durasi'] ?? 1;
                $mapelId = $gen['mapel_id'] ?? null;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $hariLama = $gen['hari'] ?? null;
                $jamLama = $gen['jam_mulai'] ?? null;

                if ($hariLama && $jamLama) {
                    for ($d = 0; $d < $dur; $d++) {
                        $jCek = $jamLama + $d;
                        unset($matrixKelas[$kId][$hariLama][$jCek]);
                        if ($guruId !== 'none') unset($matrixGuru[$guruId][$hariLama][$jCek]);
                    }
                    if ($mapelId && isset($matrixMapel[$kId][$hariLama][$mapelId])) {
                        unset($matrixMapel[$kId][$hariLama][$mapelId]);
                    }
                }

                $slotBaru = $cariSlotMutasi($dur, $isPenjaskes, $guruId, $mapelId, $kId, $matrixKelas, $matrixGuru, $matrixMapel);

                if ($slotBaru) {
                    $gen['hari'] = $slotBaru['hari'];
                    $gen['jam_mulai'] = $slotBaru['jam_mulai'];

                    for ($d = 0; $d < $dur; $d++) {
                        $jCek = $slotBaru['jam_mulai'] + $d;
                        $matrixKelas[$kId][$slotBaru['hari']][$jCek] = true;
                        if ($guruId !== 'none') {
                            $matrixGuru[$guruId][$slotBaru['hari']][$jCek] = true;
                        }
                    }
                    if ($mapelId) {
                        $matrixMapel[$kId][$slotBaru['hari']][$mapelId] = true;
                    }

                } else {
                    if ($hariLama && $jamLama) {
                        $gen['hari'] = $hariLama;
                        $gen['jam_mulai'] = $jamLama;

                        for ($d = 0; $d < $dur; $d++) {
                            $jCek = $jamLama + $d;
                            $matrixKelas[$kId][$hariLama][$jCek] = true;
                            if ($guruId !== 'none') {
                                $matrixGuru[$guruId][$hariLama][$jCek] = true;
                            }
                        }
                        if ($mapelId) {
                            $matrixMapel[$kId][$hariLama][$mapelId] = true;
                        }
                    }
                }
            }
        }
        unset($gen, $gens);

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
