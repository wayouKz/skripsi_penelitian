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

    public $onNewBest = null;

    public function __construct($params, $guruMapels, $kelas, $prioritasPagi = [])
    {
        $this->populasi = $params['populasi'] ?? 100;
        $this->maxGenerasi = $params['generasi'] ?? 500;
        $this->crossoverRate = $params['crossover_rate'] ?? 0.85;
        $this->mutationRate = $params['mutation_rate'] ?? 0.3;

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
        Log::info("🚀 [GA Start] Memulai inisialisasi populasi penjadwalan...");
        $populasiSaatIni = $this->inisialisasiPopulasi();

        foreach ($populasiSaatIni as $index => $kromosom) {
            $populasiSaatIni[$index] = $this->repairKromosom($kromosom);
            $populasiSaatIni[$index] = $this->smartMergeMapelKepecah($populasiSaatIni[$index]);
            $populasiSaatIni[$index] = $this->eliminasiMapelPecahHarian($populasiSaatIni[$index]);
            if (method_exists($this, 'perbaikiDanKonsolidasiKromosom')) {
                $populasiSaatIni[$index] = $this->perbaikiDanKonsolidasiKromosom($populasiSaatIni[$index]);
            }
        }

        $generasi = 0;
        $bestFitness = -999999.0;
        $bestKromosom = [];
        $stagnantGenerations = 0;
        $totalStagnantGenerations = 0;
        $lastBestFitness = -999999.0;

        $currentMutationRate = $this->mutationRate ?? 0.25;
        $baseMutationRate = $currentMutationRate;

        while ($generasi < $this->maxGenerasi) {
            $fitnessPopulasi = [];

            foreach ($populasiSaatIni as $kromosom) {
                $kromosom = $this->eliminasiMapelPecahHarian($kromosom);

                $fitness = $this->hitungFitness($kromosom, true);
                $fitnessPopulasi[] = [
                    'kromosom' => $kromosom,
                    'fitness'  => $fitness
                ];

                if ($fitness > $bestFitness) {
                    $bestFitness = $fitness;
                    $bestKromosom = $kromosom;
                    $stagnantGenerations = 0;

                    Log::info("=== NEW BEST KROMOSOM [Gen: {$generasi}] ===");
                    Log::info("Fitness Terbaik: {$bestFitness}");

                    if (is_callable($this->onNewBest)) {
                        ($this->onNewBest)($generasi, $bestFitness, $bestKromosom);
                    }
                }
            }

            usort($fitnessPopulasi, function ($a, $b) {
                return $b['fitness'] <=> $a['fitness'];
            });

            if ($bestFitness > $lastBestFitness) {
                $lastBestFitness = $bestFitness;
                $stagnantGenerations = 0;
                $totalStagnantGenerations = 0;
            } else {
                $stagnantGenerations++;
                $totalStagnantGenerations++;
            }

            if ($stagnantGenerations >= 3) {
                $isSuperStagnant = ($stagnantGenerations >= 6);
                $rasioImigran = $isSuperStagnant ? 0.80 : 0.45;
                $currentMutationRate = min(0.98, $baseMutationRate * ($isSuperStagnant ? 5.0 : 3.0));

                $jumlahImigrant = (int) ($this->populasi * $rasioImigran);
                $populasiBaruImigrant = $this->inisialisasiPopulasi();

                $popSize = count($fitnessPopulasi);
                for ($imm = 0; $imm < min($jumlahImigrant, count($populasiBaruImigrant)); $imm++) {
                    $targetIndex = $popSize - 1 - $imm;
                    if ($targetIndex >= 0) {
                        $immKromosom = $this->repairKromosom($populasiBaruImigrant[$imm]);
                        $immKromosom = $this->smartMergeMapelKepecah($immKromosom);
                        $immKromosom = $this->eliminasiMapelPecahHarian($immKromosom);

                        if (method_exists($this, 'perbaikiDanKonsolidasiKromosom')) {
                            $immKromosom = $this->perbaikiDanKonsolidasiKromosom($immKromosom);
                        }

                        $immFitness = $this->hitungFitness($immKromosom, true);

                        $fitnessPopulasi[$targetIndex] = [
                            'kromosom' => $immKromosom,
                            'fitness'  => $immFitness
                        ];
                    }
                }

                usort($fitnessPopulasi, function ($a, $b) {
                    return $b['fitness'] <=> $a['fitness'];
                });

                if ($isSuperStagnant) {
                    $stagnantGenerations = 0;
                }
            } else {
                $currentMutationRate = max($baseMutationRate, $currentMutationRate * 0.98);
            }

            if (is_callable($this->onGenerationComplete)) {
                ($this->onGenerationComplete)($generasi, $bestFitness);
            }

            $populasiBaru = [];
            $jumlahElitisme = max(1, (int) ($this->populasi * 0.03));
            for ($e = 0; $e < $jumlahElitisme; $e++) {
                if (isset($fitnessPopulasi[$e])) {
                    $populasiBaru[] = $fitnessPopulasi[$e]['kromosom'];
                }
            }

            $sisaPopulasi = $this->populasi - count($populasiBaru);
            $this->mutationRate = $currentMutationRate;

            for ($i = 0; $i < $sisaPopulasi; $i++) {
                $parent1 = $this->seleksi($fitnessPopulasi);
                $parent2 = $this->seleksi($fitnessPopulasi);

                $child = $this->crossover($parent1, $parent2);
                $child = $this->mutasi($child);

                $child = $this->repairKromosom($child);
                $child = $this->smartMergeMapelKepecah($child);
                $child = $this->eliminasiMapelPecahHarian($child);
                if (method_exists($this, 'perbaikiDanKonsolidasiKromosom')) {
                    $child = $this->perbaikiDanKonsolidasiKromosom($child);
                }

                $populasiBaru[] = $child;
            }

            if ($bestFitness >= 0.95 || $generasi >= $this->maxGenerasi) {
                Log::info("=== GENERASI DIHENTIKAN: Selesai pada Generasi {$generasi} ===");
                break;
            }

            $populasiSaatIni = $populasiBaru;
            $generasi++;
        }

        $flatJadwal = [];
        if (!empty($bestKromosom)) {
            if (method_exists($this, 'perbaikiDanKonsolidasiKromosom')) {
                $bestKromosom = $this->perbaikiDanKonsolidasiKromosom($bestKromosom);
            }
            $bestKromosom = $this->smartMergeMapelKepecah($bestKromosom);
            $bestKromosom = $this->eliminasiMapelPecahHarian($bestKromosom);
            $bestKromosom = $this->repairKromosom($bestKromosom);

            foreach ($bestKromosom as $kelasId => $gens) {
                foreach ($gens as $chunkId => $gen) {
                    $durasi = (int) ($gen['durasi'] ?? 1);
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamKe = (int) ($gen['jam_mulai'] ?? 1) + $d;
                        $waktu = $this->getSlotWaktu($gen['hari'], $jamKe);

                        $flatJadwal[] = [
                            'guru_id'              => $gen['guru_id'] ?? null,
                            't_list_guru_mapel_id' => $gen['t_list_guru_mapel_id'] ?? null,
                            'blok_id'              => $chunkId . '_' . $d,
                            'mapel_id'             => $gen['mapel_id'] ?? null,
                            'kelas_id'             => $gen['kelas_id'] ?? $kelasId,
                            'hari'                 => $gen['hari'],
                            'jam'                  => $jamKe,
                            'jam_mulai'            => $waktu['mulai'] ?? '00:00',
                            'jam_selesai'          => $waktu['selesai'] ?? '00:00',
                            'is_penjaskes'         => $gen['is_penjaskes'] ?? false
                        ];
                    }
                }
            }
        }

        usort($flatJadwal, function ($a, $b) {
            $hariOrder = ['Senin' => 1, 'Selasa' => 2, 'Rabu' => 3, 'Kamis' => 4, 'Jumat' => 5];
            $kelasCompare = strcmp((string) $a['kelas_id'], (string) $b['kelas_id']);
            if ($kelasCompare !== 0) return $kelasCompare;

            $hariA = $hariOrder[$a['hari']] ?? 99;
            $hariB = $hariOrder[$b['hari']] ?? 99;
            if ($hariA !== $hariB) return $hariA <=> $hariB;

            return $a['jam'] <=> $b['jam'];
        });

        return [
            'status'            => 'success',
            'generasi_terakhir' => $generasi,
            'fitness_terbaik'   => round($bestFitness, 6),
            'best_kromosom'     => $bestKromosom,
            'jadwal'            => $flatJadwal
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

                        if (!$isPenjaskes && isset($matrixMapelGlobal[$kelasId][$hari][$mapelId])) continue;

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
                        if (!$isPenjaskes) $matrixMapelGlobal[$kelasId][$assignedHari][$mapelId] = true;

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

                if ($assignedHari && $assignedJam) {
                    for ($d = 0; $d < $durasiChunk; $d++) {
                        $jamCek = $assignedJam + $d;
                        $matrixKelasGlobal[$kelasId][$assignedHari][$jamCek] = true;
                        if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                    }
                    if (!$isPenjaskes) $matrixMapelGlobal[$kelasId][$assignedHari][$mapelId] = true;

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
                            if ($matrixKelasGlobal[$kelasId][$hCoba][$jCoba] === false) {
                                $newChunkId = $chunkId . '_split_' . $sisaDurasi;
                                $matrixKelasGlobal[$kelasId][$hCoba][$jCoba] = true;
                                if (!$isPenjaskes && $guruId !== 'none') {
                                    $matrixGuru[$guruId][$hCoba][$jCoba] = true;
                                }
                                if (!$isPenjaskes) $matrixMapelGlobal[$kelasId][$hCoba][$mapelId] = true;

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

    private function hitungJumlahBlokIdeal($kelasId, $guruMapelsArray)
    {
        $totalBlokIdeal = 0;
        foreach ($guruMapelsArray as $gm) {
            if (($gm->kelas_id ?? null) != $kelasId) continue;

            $beban = (int) $gm->beban_jam;
            if ($beban <= 0) continue;

            $namaMapelLower = strtolower($gm->nama_mapel ?? '');
            $isPenjaskes = str_contains($namaMapelLower, 'penjas') || str_contains($namaMapelLower, 'olahraga');

            if ($isPenjaskes) {
                $totalBlokIdeal += 1;
            } else {
                $sisa = $beban;
                while ($sisa > 0) {
                    if ($sisa == 4) { $totalBlokIdeal += 2; $sisa = 0; }
                    elseif ($sisa == 5) { $totalBlokIdeal += 2; $sisa = 0; }
                    elseif ($sisa == 2) { $totalBlokIdeal += 1; $sisa = 0; }
                    elseif ($sisa >= 3) { $totalBlokIdeal += 1; $sisa -= 3; }
                    elseif ($sisa == 1) { $totalBlokIdeal += 1; $sisa = 0; }
                    else { $sisa = 0; }
                }
            }
        }
        return $totalBlokIdeal;
    }

 private function hitungFitness($kromosom, $isDebug = false)
    {
        $penalty = 0;
        $detailPenalti = [
            'fatal' => 0, 'mapel_harian' => 0, 'out_of_bounds' => 0,
            'bentrok_kelas' => 0, 'bentrok_guru' => 0, 'beban_jam' => 0,
            'struktur_jam' => 0, 'blok_sendirian' => 0, 'jumlah_blok' => 0, 'penjaskes_pagi' => 0
        ];

        $trackerGuru = [];
        $trackerKelas = [];
        $mapelHarianTracker = [];
        $totalDurasiMapel = [];
        $totalDurasiKelas = [];

        $guruMapelsArray = $this->guruMapels instanceof \Illuminate\Support\Collection
            ? $this->guruMapels->all()
            : (array) $this->guruMapels;

        foreach ($kromosom as $kelasId => $gens) {
            $jamKelas = 0;
            foreach ($gens as $gen) {
                $mapelId = $gen['mapel_id'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                $hari = $gen['hari'] ?? null;
                $jamMulai = $gen['jam_mulai'] ?? null;
                $isPenjaskes = $gen['is_penjaskes'] ?? false;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');

                if (!$hari || !$jamMulai) {
                    $penalty += 200; // Dikurangi agar tidak terlalu mematikan
                    $detailPenalti['fatal'] += 200;
                    continue;
                }

                // Penalti ringan jika Penjaskes di atas jam ke-3
                if ($isPenjaskes && $jamMulai > 3) {
                    $penalty += 50;
                    $detailPenalti['penjaskes_pagi'] += 50;
                }

                $jamKelas += $durasi;

                if ($mapelId) {
                    $totalDurasiMapel[$kelasId][$mapelId] = ($totalDurasiMapel[$kelasId][$mapelId] ?? 0) + $durasi;

                    if (!isset($mapelHarianTracker[$kelasId][$hari][$mapelId])) {
                        $mapelHarianTracker[$kelasId][$hari][$mapelId] = [
                            'blok_count' => 0, 'min_jam' => 99, 'max_jam' => 0, 'durasi_total' => 0
                        ];
                    }

                    $mapelHarianTracker[$kelasId][$hari][$mapelId]['blok_count']++;
                    $mapelHarianTracker[$kelasId][$hari][$mapelId]['durasi_total'] += $durasi;

                    if ($jamMulai < $mapelHarianTracker[$kelasId][$hari][$mapelId]['min_jam']) {
                        $mapelHarianTracker[$kelasId][$hari][$mapelId]['min_jam'] = $jamMulai;
                    }
                    $jamAkhirBlok = $jamMulai + $durasi - 1;
                    if ($jamAkhirBlok > $mapelHarianTracker[$kelasId][$hari][$mapelId]['max_jam']) {
                        $mapelHarianTracker[$kelasId][$hari][$mapelId]['max_jam'] = $jamAkhirBlok;
                    }
                }

                $maxReal = $this->getMaxJam($hari);
                $maxInternal = $this->getMaxJamInternal($hari);

                for ($d = 0; $d < $durasi; $d++) {
                    $jam = $jamMulai + $d;

                    if ($jam > $maxInternal || $jam < 1) {
                        $penalty += 100;
                        $detailPenalti['out_of_bounds'] += 100;
                    } elseif ($jam > $maxReal) {
                        $penalty += 10;
                        $detailPenalti['out_of_bounds'] += 10;
                    }

                    if (!isset($trackerKelas[$kelasId][$hari])) {
                        $trackerKelas[$kelasId][$hari] = ['min' => 99, 'max' => 0, 'terisi' => 0, 'jams' => []];
                    }
                    if ($jam < $trackerKelas[$kelasId][$hari]['min']) $trackerKelas[$kelasId][$hari]['min'] = $jam;
                    if ($jam > $trackerKelas[$kelasId][$hari]['max']) $trackerKelas[$kelasId][$hari]['max'] = $jam;

                    if (isset($trackerKelas[$kelasId][$hari]['jams'][$jam])) {
                        $penalty += 100; // Dikurangi agar penalti bentrok lebih toleran di awal
                        $detailPenalti['bentrok_kelas'] += 100;
                    } else {
                        $trackerKelas[$kelasId][$hari]['jams'][$jam] = true;
                        $trackerKelas[$kelasId][$hari]['terisi']++;
                    }

                    if ($guruId !== 'none' && !($gen['is_penjaskes'] ?? false)) {
                        if (isset($trackerGuru[$guruId][$hari][$jam])) {
                            $penalty += 100; // Dikurangi agar tidak langsung nge-lock fitness kecil
                            $detailPenalti['bentrok_guru'] += 100;
                        } else {
                            $trackerGuru[$guruId][$hari][$jam] = true;
                        }
                    }
                }
            }
            $totalDurasiKelas[$kelasId] = $jamKelas;

            $targetBlokIdeal = $this->hitungJumlahBlokIdeal($kelasId, $guruMapelsArray);
            $aktualBlok = count($gens);
            if ($aktualBlok !== $targetBlokIdeal) {
                $p = abs($targetBlokIdeal - $aktualBlok) * 50.0; // Bobot penalti jumlah blok diperhalus
                $penalty += $p;
                $detailPenalti['jumlah_blok'] += $p;
            }
        }

        foreach ($mapelHarianTracker as $kelasId => $hariList) {
            foreach ($hariList as $hari => $mapels) {
                foreach ($mapels as $mapelId => $data) {
                    if ($data['blok_count'] > 1) {
                        $p = ($data['blok_count'] - 1) * 20;
                        $penalty += $p;
                        $detailPenalti['mapel_harian'] += $p;
                    }

                    $rentangJam = $data['max_jam'] - $data['min_jam'] + 1;
                    if ($rentangJam > $data['durasi_total']) {
                        $p = 30;
                        $penalty += $p;
                        $detailPenalti['mapel_harian'] += $p;
                    }
                }
            }
        }

        foreach ($totalDurasiKelas as $kId => $totalJamPerKelas) {
            if ($totalJamPerKelas !== 57) {
                $p = abs(57 - $totalJamPerKelas) * 30;
                $penalty += $p;
                $detailPenalti['beban_jam'] += $p;
            }
        }

        // PERUBAHAN UTAMA: Pembagi diperbesar dari 100.0 menjadi 1000.0 agar nilai fitness melunak (bisa bernapas)
        $fitness = max(0.001, 1.0 / (1.0 + ($penalty / 1000.0)));
        $finalFitness = round($fitness, 6);

        if ($isDebug) {
            Log::debug("📊 [Hitung Fitness] Skor: {$finalFitness} | Total Penalti: {$penalty}");
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
                $maxH = $this->getMaxJam($h);
                for ($jm = 1; $jm <= $maxH; $jm++) {
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

                if (!$hari || !$jamMulai || $durasi <= 0 || (!$isPenjaskes && isset($matrixMapel[$kelasId][$hari][$mapelId]))) {
                    $unassignedChunks[] = $gen;
                    continue;
                }

                $maxH = $this->getMaxJam($hari);
                $bisa = true;

                for ($d = 0; $d < $durasi; $d++) {
                    $jamCek = $jamMulai + $d;
                    if ($jamCek > $maxH || $jamCek < 1) { $bisa = false; break; }
                    if (!empty($matrixKelas[$kelasId][$hari][$jamCek])) { $bisa = false; break; }
                    if (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek])) {
                        $bisa = false; break;
                    }
                }

                if ($bisa) {
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamCek = $jamMulai + $d;
                        $matrixKelas[$kelasId][$hari][$jamCek] = true;
                        if (!$isPenjaskes && $guruId !== 'none') {
                            $matrixGuru[$guruId][$hari][$jamCek] = true;
                        }
                    }
                    if (!$isPenjaskes && $mapelId) {
                        $matrixMapel[$kelasId][$hari][$mapelId] = true;
                    }
                    $cleanedKromosom[$kelasId][$cId] = $gen;
                } else {
                    $unassignedChunks[] = $gen;
                }
            }
        }

        $failedChunks = [];
        foreach ($unassignedChunks as $gen) {
            $kelasId = $gen['kelas_id'] ?? null;
            if (!$kelasId) continue;

            $durasi = $gen['durasi'] ?? 1;
            $mapelId = $gen['mapel_id'] ?? null;
            $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
            $isPenjaskes = $gen['is_penjaskes'] ?? false;
            $cId = $gen['blok_id'] ?? ('chunk_' . uniqid());

            $assignedHari = null;
            $assignedJam = null;

            foreach ($this->hari as $hariCoba) {
                if (!$isPenjaskes && $mapelId && isset($matrixMapel[$kelasId][$hariCoba][$mapelId])) continue;

                $maxH = $this->getMaxJam($hariCoba);
                $batasMulai = $isPenjaskes ? min(3, $maxH - $durasi + 1) : ($maxH - $durasi + 1);

                for ($jmCoba = 1; $jmCoba <= $batasMulai; $jmCoba++) {
                    $bisaSteril = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamCek = $jmCoba + $d;
                        if (!empty($matrixKelas[$kelasId][$hariCoba][$jamCek]) ||
                            (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jamCek]))) {
                            $bisaSteril = false;
                            break;
                        }
                    }
                    if ($bisaSteril) {
                        $assignedHari = $hariCoba;
                        $assignedJam = $jmCoba;
                        break 2;
                    }
                }
            }

            if ($assignedHari && $assignedJam) {
                for ($d = 0; $d < $durasi; $d++) {
                    $jamCek = $assignedJam + $d;
                    $matrixKelas[$kelasId][$assignedHari][$jamCek] = true;
                    if (!$isPenjaskes && $guruId !== 'none') $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                }
                if (!$isPenjaskes && $mapelId) $matrixMapel[$kelasId][$assignedHari][$mapelId] = true;

                $gen['hari'] = $assignedHari;
                $gen['jam_mulai'] = (int) $assignedJam;
                $cleanedKromosom[$kelasId][$cId] = $gen;
            } else {
                $failedChunks[] = $gen;
            }
        }

        foreach ($failedChunks as $gen) {
            $kelasId = $gen['kelas_id'] ?? null;
            if (!$kelasId) continue;

            $durasi = $gen['durasi'] ?? 1;
            $mapelId = $gen['mapel_id'] ?? null;
            $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
            $isPenjaskes = $gen['is_penjaskes'] ?? false;
            $cId = $gen['blok_id'] ?? ('chunk_p3_' . uniqid());

            $placed = false;

            foreach ($this->hari as $hCoba) {
                if (!$isPenjaskes && $mapelId && isset($matrixMapel[$kelasId][$hCoba][$mapelId])) continue;

                $maxH = $this->getMaxJam($hCoba);
                $batasMulai = $maxH - $durasi + 1;

                for ($jCoba = 1; $jCoba <= $batasMulai; $jCoba++) {
                    $kelasKosong = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        if (!empty($matrixKelas[$kelasId][$hCoba][$jCoba + $d])) {
                            $kelasKosong = false;
                            break;
                        }
                    }

                    if ($kelasKosong) {
                        for ($d = 0; $d < $durasi; $d++) {
                            $jamCek = $jCoba + $d;
                            $matrixKelas[$kelasId][$hCoba][$jamCek] = true;
                            if (!$isPenjaskes && $guruId !== 'none') {
                                $matrixGuru[$guruId][$hCoba][$jamCek] = true;
                            }
                        }
                        if (!$isPenjaskes && $mapelId) $matrixMapel[$kelasId][$hCoba][$mapelId] = true;

                        $gen['hari'] = $hCoba;
                        $gen['jam_mulai'] = (int) $jCoba;
                        $cleanedKromosom[$kelasId][$cId] = $gen;
                        $placed = true;
                        break 2;
                    }
                }
            }

            if (!$placed) {
                $sisaJP = $durasi;
                foreach ($this->hari as $hCoba) {
                    $maxH = $this->getMaxJam($hCoba);
                    for ($jCoba = 1; $jCoba <= $maxH; $jCoba++) {
                        if ($sisaJP > 0 && empty($matrixKelas[$kelasId][$hCoba][$jCoba])) {
                            $newSubId = $cId . '_p4_' . $sisaJP . '_' . uniqid();
                            $genP4 = $gen;
                            $genP4['hari'] = $hCoba;
                            $genP4['jam_mulai'] = $jCoba;
                            $genP4['durasi'] = 1;

                            $matrixKelas[$kelasId][$hCoba][$jCoba] = true;
                            if (!$isPenjaskes && $guruId !== 'none') {
                                $matrixGuru[$guruId][$hCoba][$jCoba] = true;
                            }

                            $cleanedKromosom[$kelasId][$newSubId] = $genP4;
                            $sisaJP--;
                        }
                    }
                }
            }
        }

        $cleanedKromosom = $this->restoreBebanJamDatabase($cleanedKromosom);

        return $cleanedKromosom;
    }

    private function restoreBebanJamDatabase($kromosom)
    {
        $dbBebanMap = [];
        $guruMapelsArray = $this->guruMapels instanceof \Illuminate\Support\Collection
            ? $this->guruMapels->all()
            : (array) $this->guruMapels;

        foreach ($guruMapelsArray as $gm) {
            if (!empty($gm->kelas_id) && !empty($gm->mapel_id)) {
                $dbBebanMap[$gm->kelas_id][$gm->mapel_id] = [
                    'beban' => (int) $gm->beban_jam,
                    'gm'    => $gm
                ];
            }
        }

        foreach ($dbBebanMap as $kId => $mapels) {
            if (!isset($kromosom[$kId])) $kromosom[$kId] = [];

            $aktualMapel = [];
            foreach ($kromosom[$kId] as $cId => $gen) {
                $mId = $gen['mapel_id'] ?? null;
                if ($mId) {
                    $aktualMapel[$mId] = ($aktualMapel[$mId] ?? 0) + (int)($gen['durasi'] ?? 0);
                }
            }

            foreach ($mapels as $mId => $info) {
                $targetBeban = $info['beban'];
                $durasiAktual = $aktualMapel[$mId] ?? 0;

                if ($durasiAktual < $targetBeban) {
                    $kekurangan = $targetBeban - $durasiAktual;

                    $targetChunkKey = null;
                    foreach ($kromosom[$kId] as $cId => $gen) {
                        if (($gen['mapel_id'] ?? null) == $mId) {
                            $targetChunkKey = $cId;
                            break;
                        }
                    }

                    if ($targetChunkKey !== null) {
                        $kromosom[$kId][$targetChunkKey]['durasi'] += $kekurangan;
                    } else {
                        $gm = $info['gm'];
                        $newSubId = 'restore_' . $mId . '_' . uniqid();
                        $namaMapel = $gm->nama_mapel ?? 'Unknown';
                        $isPenjaskes = str_contains(strtolower($namaMapel), 'penjas');

                        $kromosom[$kId][$newSubId] = [
                            'guru_id'              => $gm->guru_id ?? null,
                            'nip'                  => $gm->nip ?? null,
                            't_list_guru_mapel_id' => $gm->id,
                            'blok_id'              => $newSubId,
                            'mapel_id'             => $mId,
                            'nama_mapel'           => $namaMapel,
                            'kelas_id'             => $kId,
                            'hari'                 => 'Senin',
                            'jam_mulai'            => 1,
                            'durasi'               => $kekurangan,
                            'is_penjaskes'         => $isPenjaskes
                        ];
                    }
                }
            }
        }

        return $kromosom;
    }

    private function eliminasiMapelPecahHarian($kromosom)
    {
        foreach ($kromosom as $kId => &$gens) {
            $mapelHariGroup = [];
            foreach ($gens as $cId => $gen) {
                $mId = $gen['mapel_id'] ?? null;
                $h = $gen['hari'] ?? null;
                if ($mId && $h && !($gen['is_penjaskes'] ?? false)) {
                    $mapelHariGroup[$mId][$h][$cId] = $gen;
                }
            }

            foreach ($mapelHariGroup as $mId => $hariList) {
                foreach ($hariList as $hari => $chunks) {
                    if (count($chunks) <= 1) continue;

                    uasort($chunks, function($a, $b) {
                        return ($a['jam_mulai'] ?? 1) <=> ($b['jam_mulai'] ?? 1);
                    });

                    $cIds = array_keys($chunks);
                    $cMainId = $cIds[0];

                    for ($i = 1; $i < count($cIds); $i++) {
                        $cPisahId = $cIds[$i];
                        if (!isset($gens[$cMainId]) || !isset($gens[$cPisahId])) continue;

                        $genMain = $gens[$cMainId];
                        $genPisah = $gens[$cPisahId];

                        $jMain = $genMain['jam_mulai'];
                        $durMain = $genMain['durasi'] ?? 1;
                        $jPisah = $genPisah['jam_mulai'];
                        $durPisah = $genPisah['durasi'] ?? 1;

                        if ($jMain + $durMain === $jPisah || $jPisah + $durPisah === $jMain) {
                            $durasiBaru = $durMain + $durPisah;
                            $jamMulaiBaru = min($jMain, $jPisah);

                            $gens[$cMainId]['durasi'] = $durasiBaru;
                            $gens[$cMainId]['jam_mulai'] = $jamMulaiBaru;
                            unset($gens[$cPisahId]);
                        }
                    }
                }
            }
        }
        unset($gens);

        $kromosom = $this->restoreBebanJamDatabase($kromosom);

        return $kromosom;
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
        if ((mt_rand() / mt_getrandmax()) > $this->crossoverRate) {
            return $parent1;
        }

        $child = $parent1;
        $kelasKeysParent2 = array_keys($parent2);

        if (!empty($kelasKeysParent2)) {
            $maxTukar = max(2, (int)(count($kelasKeysParent2) * 0.25));
            $jumlahTukar = mt_rand(1, $maxTukar);

            $keysTukar = array_rand($kelasKeysParent2, $jumlahTukar);
            if (!is_array($keysTukar)) {
                $keysTukar = [$keysTukar];
            }

            foreach ($keysTukar as $keyIndex) {
                $randomKelasId = $kelasKeysParent2[$keyIndex];
                if (isset($parent2[$randomKelasId])) {
                    $child[$randomKelasId] = $parent2[$randomKelasId];
                }
            }
        }

        return $child;
    }

    private function mutasi($kromosom)
    {
        $globalMatrixGuru = [];
        $globalMatrixKelas = [];
        $bentrokList = [];

        foreach ($kromosom as $kId => $gens) {
            foreach ($gens as $cId => $gen) {
                $h = $gen['hari'] ?? null;
                $jm = $gen['jam_mulai'] ?? null;
                $dur = $gen['durasi'] ?? 1;
                $gId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (!$h || !$jm) continue;

                for ($d = 0; $d < $dur; $d++) {
                    $jam = $jm + $d;

                    if (isset($globalMatrixKelas[$kId][$h][$jam])) {
                        $bentrokList[] = ['kelas_id' => $kId, 'chunk_id' => $cId];
                    }
                    $globalMatrixKelas[$kId][$h][$jam] = true;

                    if (!$isPenjaskes && $gId !== 'none') {
                        if (isset($globalMatrixGuru[$gId][$h][$jam])) {
                            $bentrokList[] = ['kelas_id' => $kId, 'chunk_id' => $cId];
                        }
                        $globalMatrixGuru[$gId][$h][$jam] = true;
                    }
                }
            }
        }

        $effectiveMutationRate = !empty($bentrokList) ? max($this->mutationRate, 0.4) : $this->mutationRate;

        if ((mt_rand() / mt_getrandmax()) > $effectiveMutationRate) {
            return $kromosom;
        }

        foreach ($kromosom as $kId => &$gens) {
            foreach ($gens as $cId => &$gen) {
                $isBentrok = false;
                foreach ($bentrokList as $b) {
                    if ($b['kelas_id'] == $kId && $b['chunk_id'] == $cId) {
                        $isBentrok = true;
                        break;
                    }
                }

                if (!$isBentrok && (mt_rand() / mt_getrandmax()) > 0.05) {
                    continue;
                }

                $dur = $gen['durasi'] ?? 1;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;
                $hariLama = $gen['hari'] ?? null;
                $jamLama = $gen['jam_mulai'] ?? null;

                if ($hariLama && $jamLama) {
                    for ($d = 0; $d < $dur; $d++) {
                        $jCek = $jamLama + $d;
                        unset($globalMatrixKelas[$kId][$hariLama][$jCek]);
                        if (!$isPenjaskes && $guruId !== 'none') {
                            unset($globalMatrixGuru[$guruId][$hariLama][$jCek]);
                        }
                    }
                }

                $hariList = $this->hari;
                shuffle($hariList);

                $slotFound = false;
                foreach ($hariList as $hCoba) {
                    $maxH = $this->getMaxJamInternal($hCoba);
                    $batasMulai = $isPenjaskes ? min(3, $maxH - $dur + 1) : ($maxH - $dur + 1);

                    for ($jCoba = 1; $jCoba <= $batasMulai; $jCoba++) {
                        $steril = true;

                        for ($d = 0; $d < $dur; $d++) {
                            $jamCek = $jCoba + $d;

                            if (!empty($globalMatrixKelas[$kId][$hCoba][$jamCek]) ||
                                (!$isPenjaskes && $guruId !== 'none' && !empty($globalMatrixGuru[$guruId][$hCoba][$jamCek]))) {
                                $steril = false;
                                break;
                            }
                        }

                        if ($steril) {
                            $gen['hari'] = $hCoba;
                            $gen['jam_mulai'] = $jCoba;
                            $slotFound = true;
                            break 2;
                        }
                    }
                }

                if (!$slotFound) {
                    $hAcak = $this->hari[array_rand($this->hari)];
                    $maxH = $this->getMaxJamInternal($hAcak);
                    $jAcak = mt_rand(1, max(1, $maxH - $dur + 1));

                    $gen['hari'] = $hAcak;
                    $gen['jam_mulai'] = $jAcak;
                }

                for ($d = 0; $d < $dur; $d++) {
                    $jCek = $gen['jam_mulai'] + $d;
                    $globalMatrixKelas[$kId][$gen['hari']][$jCek] = true;
                    if (!$isPenjaskes && $guruId !== 'none') {
                        $globalMatrixGuru[$guruId][$gen['hari']][$jCek] = true;
                    }
                }
            }
        }
        unset($gen, $gens);

        return $kromosom;
    }

    private function smartMergeMapelKepecah($kromosom)
    {
        $dbBebanMap = [];
        $guruMapelsArray = $this->guruMapels instanceof \Illuminate\Support\Collection
            ? $this->guruMapels->all()
            : (array) $this->guruMapels;

        foreach ($guruMapelsArray as $gm) {
            if (!empty($gm->kelas_id) && !empty($gm->mapel_id)) {
                $dbBebanMap[$gm->kelas_id][$gm->mapel_id] = (int) $gm->beban_jam;
            }
        }

        $matrixGuru = [];
        foreach ($kromosom as $kId => $gens) {
            foreach ($gens as $cId => $gen) {
                $h = $gen['hari'] ?? null;
                $jm = $gen['jam_mulai'] ?? null;
                $dur = $gen['durasi'] ?? 1;
                $gId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (!$h || !$jm || $isPenjaskes || $gId === 'none') continue;

                for ($d = 0; $d < $dur; $d++) {
                    $jam = $jm + $d;
                    $matrixGuru[$gId][$h][$jam][] = [
                        'kelas_id' => $kId,
                        'chunk_id' => $cId
                    ];
                }
            }
        }

        foreach ($kromosom as $kId => &$gens) {
            $mapelAllChunks = [];
            foreach ($gens as $cId => $gen) {
                $mId = $gen['mapel_id'] ?? null;
                if ($mId && !($gen['is_penjaskes'] ?? false)) {
                    $mapelAllChunks[$mId][$cId] = $gen;
                }
            }

            foreach ($mapelAllChunks as $mId => $chunks) {
                if (count($chunks) <= 1) continue;

                $groupedByDay = [];
                foreach ($chunks as $cId => $gen) {
                    $groupedByDay[$gen['hari']][$cId] = $gen;
                }

                foreach ($groupedByDay as $hari => $dayChunks) {
                    if (count($dayChunks) > 1) {
                        uasort($dayChunks, function($a, $b) {
                            return ($a['jam_mulai'] ?? 1) <=> ($b['jam_mulai'] ?? 1);
                        });

                        $cIds = array_keys($dayChunks);
                        $cMainId = $cIds[0];

                        for ($i = 1; $i < count($cIds); $i++) {
                            $cPisahId = $cIds[$i];
                            if (!isset($gens[$cMainId]) || !isset($gens[$cPisahId])) continue;

                            $genMain = $gens[$cMainId];
                            $genPisah = $gens[$cPisahId];

                            $jMain = $genMain['jam_mulai'];
                            $durMain = $genMain['durasi'] ?? 1;
                            $jPisah = $genPisah['jam_mulai'];
                            $durPisah = $genPisah['durasi'] ?? 1;

                            if ($jMain + $durMain === $jPisah || $jPisah + $durPisah === $jMain) {
                                $durasiBaru = $durMain + $durPisah;
                                $jamMulaiBaru = min($jMain, $jPisah);
                                $gId = !empty($genMain['guru_id']) ? 'g_' . $genMain['guru_id'] : 'none';

                                $guruAman = true;
                                if ($gId !== 'none') {
                                    for ($d = 0; $d < $durasiBaru; $d++) {
                                        $cekJam = $jamMulaiBaru + $d;
                                        if (isset($matrixGuru[$gId][$hari][$cekJam])) {
                                            foreach ($matrixGuru[$gId][$hari][$cekJam] as $mg) {
                                                if ($mg['chunk_id'] !== $cMainId && $mg['chunk_id'] !== $cPisahId) {
                                                    $guruAman = false;
                                                    break 2;
                                                }
                                            }
                                        }
                                    }
                                }

                                $maxBebanDb = $dbBebanMap[$kId][$mId] ?? 99;
                                if ($guruAman && ($jamMulaiBaru + $durasiBaru - 1) <= $this->getMaxJamInternal($hari) && $durasiBaru <= $maxBebanDb) {
                                    $gens[$cMainId]['durasi'] = $durasiBaru;
                                    $gens[$cMainId]['jam_mulai'] = $jamMulaiBaru;
                                    unset($gens[$cPisahId]);
                                }
                            }
                        }
                    }
                }
            }
        }
        unset($gens);

        $kromosom = $this->restoreBebanJamDatabase($kromosom);
        $kromosom = $this->eliminasiMapelPecahHarian($kromosom);

        return $kromosom;
    }

    private function perbaikiDanKonsolidasiKromosom($kromosom)
    {
        $matrixGuru = [];

        foreach ($kromosom as $kId => $gens) {
            foreach ($gens as $cId => $gen) {
                $h = $gen['hari'] ?? null;
                $jm = $gen['jam_mulai'] ?? null;
                $dur = $gen['durasi'] ?? 1;
                $gId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (!$h || !$jm || $isPenjaskes || $gId === 'none') continue;

                for ($d = 0; $d < $dur; $d++) {
                    $jam = $jm + $d;
                    $matrixGuru[$gId][$h][$jam][] = [
                        'kelas_id' => $kId,
                        'chunk_id' => $cId
                    ];
                }
            }
        }

        foreach ($matrixGuru as $gId => $hariData) {
            foreach ($hariData as $hari => $jamData) {
                foreach ($jamData as $jam => $listMengajar) {
                    if (isset($matrixGuru[$gId][$hari][$jam]) && count($listMengajar) > 1) {
                        $bentrokItem = $listMengajar[1];
                        $kTarget = $bentrokItem['kelas_id'];
                        $cTarget = $bentrokItem['chunk_id'];

                        if (!isset($kromosom[$kTarget][$cTarget])) continue;

                        $genTarget = $kromosom[$kTarget][$cTarget];
                        $durTarget = $genTarget['durasi'] ?? 1;
                        $hTargetAsli = $genTarget['hari'];
                        $jTargetAsli = $genTarget['jam_mulai'];
                        $isPenjaskesTarget = $genTarget['is_penjaskes'] ?? false;

                        foreach ($kromosom[$kTarget] as $cCand => $genCand) {
                            if ($cCand === $cTarget) continue;

                            $durCand = $genCand['durasi'] ?? 1;
                            $hCand = $genCand['hari'];
                            $jCand = $genCand['jam_mulai'];
                            $gCand = !empty($genCand['guru_id']) ? 'g_' . $genCand['guru_id'] : 'none';
                            $isPenjaskesCand = $genCand['is_penjaskes'] ?? false;

                            if ($isPenjaskesCand && $jTargetAsli > 3) continue;
                            if ($isPenjaskesTarget && $jCand > 3) continue;

                            if (($jTargetAsli + $durCand - 1) > $this->getMaxJamInternal($hTargetAsli)) continue;
                            if (($jCand + $durTarget - 1) > $this->getMaxJamInternal($hCand)) continue;

                            $guruTargetAman = true;
                            for ($d = 0; $d < $durTarget; $d++) {
                                $cekJam = $jCand + $d;
                                if (isset($matrixGuru[$gId][$hCand][$cekJam])) {
                                    foreach ($matrixGuru[$gId][$hCand][$cekJam] as $mg) {
                                        if ($mg['chunk_id'] !== $cCand) { $guruTargetAman = false; break 2; }
                                    }
                                }
                            }

                            $guruCandAman = true;
                            if ($gCand !== 'none') {
                                for ($d = 0; $d < $durTarget; $d++) {
                                    $cekJam = $jTargetAsli + $d;
                                    if (isset($matrixGuru[$gCand][$hTargetAsli][$cekJam])) {
                                        foreach ($matrixGuru[$gCand][$hTargetAsli][$cekJam] as $mg) {
                                            if ($mg['chunk_id'] !== $cTarget) { $guruCandAman = false; break 2; }
                                        }
                                    }
                                }
                            }

                            if ($guruTargetAman && $guruCandAman) {
                                $kromosom[$kTarget][$cTarget]['hari'] = $hCand;
                                $kromosom[$kTarget][$cTarget]['jam_mulai'] = $jCand;

                                $kromosom[$kTarget][$cCand]['hari'] = $hTargetAsli;
                                $kromosom[$kTarget][$cCand]['jam_mulai'] = $jTargetAsli;
                                break 2;
                            }
                        }
                    }
                }
            }
        }

        foreach ($kromosom as $kId => &$gens) {
            $mapelHariSamaGroup = [];
            foreach ($gens as $cId => $gen) {
                $mId = $gen['mapel_id'] ?? null;
                $h = $gen['hari'] ?? null;
                if ($mId && $h) {
                    $mapelHariSamaGroup[$h][$mId][] = $cId;
                }
            }

            foreach ($mapelHariSamaGroup as $hCheck => $mGroup) {
                foreach ($mGroup as $mIdCheck => $chunkList) {
                    if (count($chunkList) > 1) {
                        usort($chunkList, function($a, $b) use ($gens) {
                            return ($gens[$a]['jam_mulai'] ?? 1) <=> ($gens[$b]['jam_mulai'] ?? 1);
                        });

                        $cMainId = $chunkList[0];
                        for ($i = 1; $i < count($chunkList); $i++) {
                            $cPisahId = $chunkList[$i];
                            if (!isset($gens[$cMainId]) || !isset($gens[$cPisahId])) continue;

                            $genMain = $gens[$cMainId];
                            $genPisah = $gens[$cPisahId];

                            $jMainMulai = $genMain['jam_mulai'];
                            $durMain = $genMain['durasi'] ?? 1;
                            $jPisahMulai = $genPisah['jam_mulai'];
                            $durPisah = $genPisah['durasi'] ?? 1;

                            if ($jMainMulai + $durMain === $jPisahMulai || $jPisahMulai + $durPisah === $jMainMulai) {
                                $gens[$cMainId]['durasi'] += $durPisah;
                                if ($jPisahMulai < $jMainMulai) {
                                    $gens[$cMainId]['jam_mulai'] = $jPisahMulai;
                                }
                                unset($gens[$cPisahId]);
                            }
                        }
                    }
                }
            }
        }
        unset($gens);

        $kromosom = $this->restoreBebanJamDatabase($kromosom);
        $kromosom = $this->eliminasiMapelPecahHarian($kromosom);

        return $kromosom;
    }
}
