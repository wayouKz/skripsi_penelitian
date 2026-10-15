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

    private $maxJamMap = [
        'Senin' => 11, 'Selasa' => 11, 'Rabu' => 11, 'Kamis' => 12, 'Jumat' => 12,
    ];

    private $targetBlokIdealCache = [];
    public $onLog = null;

    // === 1. TAMBAHKAN PENAMPUNG LOG DI SINI ===
    private $evolutionLogs = [];
    public function __construct($params, $guruMapels, $kelas, $prioritasPagi = [])
    {
        $this->populasi = $params['populasi'] ?? 100;
        $this->maxGenerasi = $params['generasi'] ?? 500;
        $this->crossoverRate = $params['crossover_rate'] ?? 0.85; // Naikkan agar kombinasi gen lebih aktif
        $this->mutationRate  = $params['mutation_rate']  ?? 0.20; //

        $this->prioritasPagiGuruId = $params['prioritas_pagi_guru_id'] ?? [];
        $this->prioritasPagi = $prioritasPagi;

        foreach ($this->hari as $h) {
            $this->maxJamPerHari[$h] = $this->maxJamMap[$h];

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
                    $this->maxJamMap[$h] = $this->maxJamPerHari[$h];
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
        return $this->maxJamMap[$hari] ?? 11;
    }

    private function getMaxJamInternal($hari)
    {
        return ($this->maxJamMap[$hari] ?? 11) + 1;
    }

    private function getSlotWaktu($hari, $jam)
    {
        return $this->slotWaktuPerHari[$hari][$jam] ?? ['mulai' => '07:00:00', 'selesai' => '07:35:00'];
    }

    private function catatLog($tahap, $pesan, $dataPerubahan = [])
    {
        $logData = [
            'waktu' => date('Y-m-d H:i:s'),
            'tahap' => $tahap,
            'pesan' => $pesan,
            'data'  => $dataPerubahan
        ];

        // Simpan ke array untuk dilempar ke View
        $this->evolutionLogs[] = $logData;

        // Tulis ke laravel.log dalam bentuk JSON murni
        // Log::info(json_encode($logData));

        if (is_callable($this->onLog)) {
            ($this->onLog)($logData);
        }
    }
    private function getPerubahanKromosomDetail($oldKromosom, $newKromosom)
    {
        $perubahan = [];
        if (empty($oldKromosom)) {
            return ['status' => 'Inisialisasi kromosom terbaik pertama.'];
        }

        foreach ($newKromosom as $kelasId => $gensBaru) {
            $gensLama = $oldKromosom[$kelasId] ?? [];
            foreach ($gensBaru as $chunkId => $genBaru) {
                $genLama = $gensLama[$chunkId] ?? null;
                $namaMapel = $genBaru['nama_mapel'] ?? 'Mapel';
                $namaKelas = $genBaru['nama_kelas'] ?? 'Kelas';

                if (!$genLama) {
                    $perubahan[] = [
                        'tipe' => 'BARU',
                        'pesan' => "Blok $namaMapel ditambahkan di $namaKelas pada {$genBaru['hari']} jam ke-{$genBaru['jam_mulai']}"
                    ];
                } else {
                    $hariLama = $genLama['hari'] ?? '';
                    $jamLama = $genLama['jam_mulai'] ?? 0;
                    $hariBaru = $genBaru['hari'] ?? '';
                    $jamBaru = $genBaru['jam_mulai'] ?? 0;

                    if ($hariLama !== $hariBaru || $jamLama !== $jamBaru) {
                        $perubahan[] = [
                            'tipe' => 'GESER',
                            'mapel' => $namaMapel,
                            'kelas' => $namaKelas,
                            'dari' => "$hariLama Jam $jamLama",
                            'ke' => "$hariBaru Jam $jamBaru"
                        ];
                    }
                }
            }
        }

        // Batasi maksimal 15 detail perubahan agar log tidak terlalu panjang
        return array_slice($perubahan, 0, 15);
    }
    public function generate()
    {
        $this->catatLog('START', 'Memulai inisialisasi populasi penjadwalan...', ['populasi' => $this->populasi, 'max_generasi' => $this->maxGenerasi]);

        $populasiSaatIni = $this->inisialisasiPopulasi();

        foreach ($populasiSaatIni as $index => $kromosom) {
            $populasiSaatIni[$index] = $this->repairKromosom($kromosom);
            $populasiSaatIni[$index] = $this->smartMergeMapelKepecah($populasiSaatIni[$index]);
            $populasiSaatIni[$index] = $this->padatkanJadwalHarian($populasiSaatIni[$index]);
            $populasiSaatIni[$index] = $this->eliminasiMapelPecahHarian($populasiSaatIni[$index]);
            $populasiSaatIni[$index] = $this->agresifSisirSemua($populasiSaatIni[$index]);
        }

        $generasi = 0;
        $bestFitness = -999999.0;
        $bestKromosom = [];
        $stagnantGenerations = 0;
        $lastBestFitness = -999999.0;

        $currentMutationRate = $this->mutationRate ?? 0.30;
        $baseMutationRate = $currentMutationRate;

        while ($generasi < $this->maxGenerasi) {
            $fitnessPopulasi = [];

            foreach ($populasiSaatIni as $kromosom) {
                $fitness = $this->hitungFitness($kromosom, false);
                $fitnessPopulasi[] = [
                    'kromosom' => $kromosom,
                    'fitness'  => $fitness
                ];

                if ($fitness > $bestFitness) {
                    // Ambil detail perubahan dari bestKromosom sebelumnya ke kromosom baru
                    $detailPerubahan = $this->getPerubahanKromosomDetail($bestKromosom, $kromosom);

                    $bestFitness = $fitness;
                    $bestKromosom = $kromosom;
                    $stagnantGenerations = 0;

                    // CATAT PERUBAHAN DETAIL SAAT JADWAL LEBIH BAIK DITEMUKAN
                    $this->catatLog('NEW_BEST', "Ditemukan jadwal lebih baik pada generasi $generasi", [
                        'generasi' => $generasi,
                        'fitness_baru' => round($bestFitness, 4),
                        'detail_perubahan' => $detailPerubahan
                    ]);

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
            } else {
                $stagnantGenerations++;
            }

            if ($stagnantGenerations >= 3) {
                $isSuperStagnant = ($stagnantGenerations >= 5);
                $rasioImigran = $isSuperStagnant ? 0.75 : 0.50;
                $currentMutationRate = min(0.95, $baseMutationRate * ($isSuperStagnant ? 3.0 : 2.0));

                $jumlahImigrant = (int) ($this->populasi * $rasioImigran);

                $this->catatLog('STAGNASI', "Sistem stuck selama $stagnantGenerations generasi. Menyuntikkan imigran baru.", [
                    'generasi' => $generasi,
                    'jumlah_imigran' => $jumlahImigrant,
                    'mutation_rate' => $currentMutationRate
                ]);

                for ($top = 0; $top < min(5, count($fitnessPopulasi)); $top++) {
                    $kroOpt = $fitnessPopulasi[$top]['kromosom'];
                    $kroOpt = $this->smartMergeMapelKepecah($kroOpt);
                    $kroOpt = $this->agresifSisirSemua($kroOpt, true);
                    $kroOpt = $this->padatkanJadwalHarian($kroOpt);

                    $fitnessPopulasi[$top]['kromosom'] = $kroOpt;
                    $fitnessPopulasi[$top]['fitness'] = $this->hitungFitness($kroOpt, false);
                }

                $populasiBaruImigrant = $this->inisialisasiPopulasi();
                $popSize = count($fitnessPopulasi);

                for ($imm = 0; $imm < min($jumlahImigrant, count($populasiBaruImigrant)); $imm++) {
                    $targetIndex = $popSize - 1 - $imm;
                    if ($targetIndex >= 5) {
                        $immKromosom = $populasiBaruImigrant[$imm];
                        $immKromosom = $this->repairKromosom($immKromosom);

                        foreach ($immKromosom as $kId => &$gens) {
                            foreach ($gens as $cId => &$gen) {
                                if (mt_rand(1, 100) <= 40) {
                                    $gen['hari'] = $this->hari[array_rand($this->hari)];
                                    $maxH = $this->getMaxJam($gen['hari']);
                                    $gen['jam_mulai'] = mt_rand(1, max(1, $maxH - ($gen['durasi'] ?? 1) + 1));
                                }
                            }
                        }
                        unset($gen, $gens);

                        $immKromosom = $this->repairKromosom($immKromosom);
                        $immKromosom = $this->smartMergeMapelKepecah($immKromosom);
                        $immKromosom = $this->agresifSisirSemua($immKromosom);
                        $immKromosom = $this->padatkanJadwalHarian($immKromosom);

                        $fitnessPopulasi[$targetIndex] = [
                            'kromosom' => $immKromosom,
                            'fitness'  => $this->hitungFitness($immKromosom, false)
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
                $currentMutationRate = max($baseMutationRate, $currentMutationRate * 0.90);
            }

            if (is_callable($this->onGenerationComplete)) {
                ($this->onGenerationComplete)($generasi, $bestFitness);
            }

            $populasiBaru = [];
            $jumlahElitisme = max(1, (int) ($this->populasi * 0.20));
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
                $child = $this->repairKromosom($child);

                $child = $this->mutasi($child);
                $child = $this->repairKromosom($child);

                $estimasiFitness = $this->hitungFitness($child, false);

                if ($estimasiFitness < 0.95 && mt_rand(1, 100) <= 30) {
                    $child = $this->smartMergeMapelKepecah($child);
                    $child = $this->eliminasiMapelPecahHarian($child);
                }

                $child = $this->agresifSisirSemua($child);
                $child = $this->padatkanJadwalHarian($child);
                $populasiBaru[] = $child;
            }

            if ($bestFitness >= 0.95 || $generasi >= $this->maxGenerasi) {
                break;
            }

            $populasiSaatIni = $populasiBaru;
            $generasi++;
        }

        $flatJadwal = [];
        if (!empty($bestKromosom)) {
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
                            'nama_kelas'           => $gen['nama_kelas'],
                            'nama_guru'            => $gen['nama_guru'],
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

        $this->catatLog('FINISH', 'Proses algoritma genetika selesai.', [
            'generasi_terakhir' => $generasi,
            'fitness_terbaik' => round($bestFitness, 4)
        ]);

        return [
            'status'            => 'success',
            'generasi_terakhir' => $generasi,
            'fitness_terbaik'   => round($bestFitness, 6),
            'best_kromosom'     => $bestKromosom,
            'jadwal'            => $flatJadwal,
            'logs'              => $this->evolutionLogs
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

                // Ambil nama kelas dari objek kelas atau fallback ke guruMapel
                $namaKelas = is_object($kls) ? ($kls->nama_kelas ?? $kls->nama ?? null) : null;

                $mapelKelas = $guruMapelPerKelas[$kelasId] ?? [];
                if (empty($mapelKelas)) continue;
                if (!isset($kromosom[$kelasId])) $kromosom[$kelasId] = [];

                $allChunksToAllocate = [];
                foreach ($mapelKelas as $gm) {
                    $bebanSeharusnya = (int) $gm->beban_jam;
                    if ($bebanSeharusnya <= 0) continue;

                    if (!$namaKelas && isset($gm->nama_kelas)) {
                        $namaKelas = $gm->nama_kelas;
                    }

                    $namaMapel = $gm->nama_mapel ?? 'Unknown';
                    $namaMapelLower = strtolower($namaMapel);
                    $isPenjaskes = str_contains($namaMapelLower, 'penjas') || str_contains($namaMapelLower, 'olahraga');

                    $chunksDurasi = [];
                    if ($isPenjaskes) {
                        $chunksDurasi = [$bebanSeharusnya];
                    } else {
                        if ($bebanSeharusnya <= 3) {
                            $chunksDurasi = [$bebanSeharusnya];
                        } else {
                            $chunk1 = (int) ceil($bebanSeharusnya / 2);
                            $chunk2 = (int) floor($bebanSeharusnya / 2);
                            $chunksDurasi = [$chunk1, $chunk2];
                        }
                    }

                    foreach ($chunksDurasi as $dur) {
                        $allChunksToAllocate[] = [
                            'gm' => $gm, 'durasi' => $dur, 'is_penjaskes' => $isPenjaskes, 'nama_mapel' => $namaMapel
                        ];
                    }
                }

                // --- HANDLE PRIORITAS: Tempatkan prioritas_pagi paling atas ---
                usort($allChunksToAllocate, function($a, $b) use ($totalBebanGuru) {
                    $pagiA = ($a['gm']->prioritas_pagi ?? false) ;
                    $pagiB = ($b['gm']->prioritas_pagi ?? false) ;

                    if ($pagiA !== $pagiB) return $pagiB <=> $pagiA;
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

                    // --- HANDLE MAPEL_ID NULL: Buat kunci unik jika mapel_id kosong ---
                    $mapelId = $gm->mapel_id;
                    $mapelCheckKey = !empty($mapelId) ? $mapelId : 'gm_' . $gm->id;

                    $guruId = !empty($gm->guru_id) ? 'g_' . $gm->guru_id : (!empty($gm->nip) ? 'n_' . $gm->nip : 'none');
                    $isPrioritasPagi = ($gm->prioritas_pagi ?? false);

                    $chunkId = 'gm_' . $gm->id . '_b_' . $counterId . '_p_' . $i;
                    $counterId++;

                    $assignedHari = null;
                    $assignedJam = null;

                    // --- HANDLE HARI: Jangan di-acak jika prioritas pagi ---
                    $hariCekList = $this->hari;
                    if (!$isPrioritasPagi) {
                        shuffle($hariCekList);
                    }

                    foreach ($hariCekList as $hari) {
                        $maxH = $this->getMaxJamInternal($hari);

                        $batasMulaiJam = $isPenjaskes ? 1 : ($maxH - $durasiChunk + 1);

                        if (!$isPenjaskes && isset($matrixMapelGlobal[$kelasId][$hari][$mapelCheckKey])) continue;

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
                        if (!$isPenjaskes) $matrixMapelGlobal[$kelasId][$assignedHari][$mapelCheckKey] = true;

                        $kromosom[$kelasId][$chunkId] = [
                            'guru_id' => $gm->guru_id ?? null, 'nip' => $gm->nip ?? null,
                            'g_id' => $guruId,
                            't_list_guru_mapel_id' => $gm->id, 'blok_id' => $chunkId,
                            'nama_guru' => $gm->nama_guru ?? null,
                            'nama_kelas' => $namaKelas ?? ($gm->nama_kelas ?? null),
                            'mapel_id' => $mapelId, 'nama_mapel' => $namaMapel, 'kelas_id' => $kelasId,
                            'hari' => $assignedHari, 'jam_mulai' => (int) $assignedJam,
                            'durasi' => (int) $durasiChunk, 'is_penjaskes' => $isPenjaskes
                        ];
                    } else {
                        $globalUnassignedChunks[] = [
                            'kelas_id' => $kelasId, 'gm' => $gm, 'chunk_id' => $chunkId,
                            'durasi' => $durasiChunk, 'is_penjaskes' => $isPenjaskes,
                            'nama_mapel' => $namaMapel, 'guru_id' => $guruId, 'mapel_id' => $mapelId,
                            'mapel_check_key' => $mapelCheckKey,
                            'nama_kelas' => $namaKelas ?? ($gm->nama_kelas ?? null)
                        ];
                    }
                }
            }

            foreach ($globalUnassignedChunks as $unassigned) {
                $kelasId = $unassigned['kelas_id']; $gm = $unassigned['gm'];
                $chunkId = $unassigned['chunk_id']; $durasiChunk = $unassigned['durasi'];
                $isPenjaskes = $unassigned['is_penjaskes']; $namaMapel = $unassigned['nama_mapel'];
                $guruId = $unassigned['guru_id']; $mapelId = $unassigned['mapel_id'];
                $mapelCheckKey = $unassigned['mapel_check_key'] ?? (!empty($mapelId) ? $mapelId : 'gm_' . $gm->id);
                $namaKelasUnassigned = $unassigned['nama_kelas'] ?? ($gm->nama_kelas ?? null);

                $assignedHari = null; $assignedJam = null;
                $hariAcak = $this->hari; shuffle($hariAcak);

                foreach ($hariAcak as $hari) {
                    $maxH = $this->getMaxJamInternal($hari);
                    $batasMulaiJam = $isPenjaskes ? 1 : ($maxH - $durasiChunk + 1);

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
                    if (!$isPenjaskes) $matrixMapelGlobal[$kelasId][$assignedHari][$mapelCheckKey] = true;

                    $kromosom[$kelasId][$chunkId] = [
                        'guru_id' => $gm->guru_id ?? null, 'nip' => $gm->nip ?? null,
                        'g_id' => $guruId,
                        't_list_guru_mapel_id' => $gm->id, 'blok_id' => $chunkId,
                        'nama_guru' => $gm->nama_guru ?? null,
                        'nama_kelas' => $namaKelasUnassigned,
                        'mapel_id' => $mapelId, 'nama_mapel' => $namaMapel, 'kelas_id' => $kelasId,
                        'hari' => $assignedHari, 'jam_mulai' => (int) $assignedJam,
                        'durasi' => (int) $durasiChunk, 'is_penjaskes' => $isPenjaskes
                    ];
                } else {
                    $sisaDurasi = $durasiChunk;
                    foreach ($this->hari as $hCoba) {
                        if (!$isPenjaskes && isset($matrixMapelGlobal[$kelasId][$hCoba][$mapelCheckKey])) continue;

                        $maxHInternal = $this->getMaxJamInternal($hCoba);
                        for ($jCoba = 1; $jCoba <= $maxHInternal; $jCoba++) {
                            $kelasKosong = empty($matrixKelasGlobal[$kelasId][$hCoba][$jCoba]);
                            $guruKosong = ($guruId === 'none') || empty($matrixGuru[$guruId][$hCoba][$jCoba]);

                            if ($kelasKosong && $guruKosong) {
                                $newChunkId = $chunkId . '_split_' . $sisaDurasi;
                                $matrixKelasGlobal[$kelasId][$hCoba][$jCoba] = true;
                                if (!$isPenjaskes && $guruId !== 'none') {
                                    $matrixGuru[$guruId][$hCoba][$jCoba] = true;
                                }
                                if (!$isPenjaskes) $matrixMapelGlobal[$kelasId][$hCoba][$mapelCheckKey] = true;

                                $kromosom[$kelasId][$newChunkId] = [
                                    'guru_id' => $gm->guru_id ?? null, 'nip' => $gm->nip ?? null,
                                    'g_id' => $guruId,
                                    't_list_guru_mapel_id' => $gm->id, 'blok_id' => $newChunkId,
                                    'nama_guru' => $gm->nama_guru ?? null,
                                    'nama_kelas' => $namaKelasUnassigned,
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
                if ($beban <= 3) {
                    $totalBlokIdeal += 1;
                } else {
                    $totalBlokIdeal += 2;
                }
            }
        }
        return $totalBlokIdeal;
    }

   private function hitungFitness($kromosom, $isDebug = false)
    {
        $totalPenaltiKeras = 0;
        $totalPenaltiLunak = 0;

        $trackerGuru = [];
        $trackerKelas = [];
        $mapelHarianTracker = [];
        $penaltyArray = [
            'guru' => 0,
            'kelas' => 0,
            'mapel' => 0,
            'blok' => 0,
            'jam_bolong' => 0
        ];
        $guruMapelsArray = $this->guruMapels instanceof \Illuminate\Support\Collection
            ? $this->guruMapels->all()
            : (array) $this->guruMapels;

        foreach ($kromosom as $kelasId => $gens) {
            if (!isset($this->targetBlokIdealCache[$kelasId])) {
                $this->targetBlokIdealCache[$kelasId] = $this->hitungJumlahBlokIdeal($kelasId, $guruMapelsArray);
            }
            $targetBlokIdeal = $this->targetBlokIdealCache[$kelasId];

            $aktualBlok = count($gens);
            if ($aktualBlok !== $targetBlokIdeal) {
                // Kurangi bobot penalti blok agar tidak terlalu menjatuhkan nilai
                $totalPenaltiLunak += abs($targetBlokIdeal - $aktualBlok) * 2;
            }

            foreach ($gens as $gen) {
                $mId = $gen['mapel_id'] ?? null;
                $durasi = (int)($gen['durasi'] ?? 1);
                $hari = $gen['hari'] ?? null;
                $jamMulai = (int)($gen['jam_mulai'] ?? 1);

                $gId = $gen['g_id'] ?? 'none';
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (!$hari || !$jamMulai) {
                    $totalPenaltiKeras += 10;
                    $penaltyArray['jam_bolong'] += 10;
                    continue;
                }

                if ($isPenjaskes) {
                    $jamAkhir = $jamMulai + $durasi - 1;
                    if ($jamMulai > 1 || $jamAkhir > 3) {
                        $totalPenaltiLunak += 5;
                        $penaltyArray['mapel'] += 5;
                    }
                }

                if ($mId) {
                    if (!isset($mapelHarianTracker[$kelasId][$hari][$mId])) {
                        $mapelHarianTracker[$kelasId][$hari][$mId] = 0;
                    }
                    $mapelHarianTracker[$kelasId][$hari][$mId]++;
                }

                $maxJamHariIni = $this->maxJamMap[$hari] ?? 11;

                for ($d = 0; $d < $durasi; $d++) {
                    $jam = $jamMulai + $d;

                    if ($jam > $maxJamHariIni) {

                        $totalPenaltiKeras += 100;
                        $penaltyArray['jam_bolong'] += 1000;
                    }

                    if (!isset($trackerKelas[$kelasId][$hari])) {
                        $trackerKelas[$kelasId][$hari] = ['min' => $jam, 'max' => $jam, 'jams' => []];
                    } else {
                        if ($jam < $trackerKelas[$kelasId][$hari]['min']) $trackerKelas[$kelasId][$hari]['min'] = $jam;
                        if ($jam > $trackerKelas[$kelasId][$hari]['max']) $trackerKelas[$kelasId][$hari]['max'] = $jam;
                    }

                    if (isset($trackerKelas[$kelasId][$hari]['jams'][$jam])) {
                        $totalPenaltiKeras += 100;
                        $penaltyArray['kelas'] += 100;
                    } else {
                        $trackerKelas[$kelasId][$hari]['jams'][$jam] = true;
                    }

                    if ($gId !== 'none' && !$isPenjaskes) {
                        if (isset($trackerGuru[$gId][$hari][$jam])) {
                            $totalPenaltiKeras += 300;
                            $penaltyArray['guru'] += 300;
                        } else {
                            $trackerGuru[$gId][$hari][$jam] = true;
                        }
                    }
                }
            }
        }

        foreach ($trackerKelas as $kId => $hariList) {
            foreach ($hariList as $hari => $data) {
                $minJam = $data['min'];
                $maxJamValid = min($data['max'], $this->maxJamMap[$hari] ?? 11);

                if ($minJam > 1) {
                    $totalPenaltiLunak += ($minJam - 1) * 2;
                    $penaltyArray['jam_bolong'] += ($minJam - 1) * 2;
                }

                $jumlahJamAktif = count($data['jams']);
                $rentangJam = ($maxJamValid - $minJam) + 1;

                if ($rentangJam > $jumlahJamAktif) {
                    $totalPenaltiLunak += ($rentangJam - $jumlahJamAktif) * 3;
                    $penaltyArray['jam_bolong'] += ($rentangJam - $jumlahJamAktif) * 3;
                }
            }
        }

        foreach ($mapelHarianTracker as $kId => $hariList) {
            foreach ($hariList as $hari => $mList) {
                foreach ($mList as $mId => $count) {
                    if ($count > 1) {
                        $totalPenaltiLunak += ($count - 1) * 5;
                        $penaltyArray['mapel'] += ($count - 1) * 5;
                    }
                }
            }
        }

        if( $isDebug) {
            Log::info("PENALTI KERAS: " . $totalPenaltiKeras . ", PENALTI LUNAK: " . $totalPenaltiLunak);
            Log::info("DETAIL PENALTI: " . json_encode($penaltyArray));
        }
        // === PENYESUAIAN FORMULA AGAR FITNESS MELONJAK ===
    if ($totalPenaltiKeras > 0) {
        $fitness = round(0.50 / (1.0 + ($totalPenaltiKeras / 200.0)), 6);
        // Log::info("KERAS BOS : " . $totalPenaltiKeras . ", TAPI ADA YANG LEMBEK BOS : " . $totalPenaltiLunak);
        } else {
            // Log::info("LEMBEK BOS : " . $totalPenaltiLunak . ", TAPI ADA YANG KERAS BOS : " . $totalPenaltiKeras);
            // Ubah pembagi dari 100.0 menjadi 400.0 agar penalti lunak tidak terlalu menjatuhkan nilai
            $fitness = round(0.70 + (0.30 / (1.0 + ($totalPenaltiLunak / 200.0))), 6);
        }
        return $fitness;
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
            $guruId = $gen['g_id'] ?? 'none';
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

    // --- SORT UNASSIGNED CHUNKS: Prioritaskan repair untuk item prioritas pagi agar didahulukan ---
    usort($unassignedChunks, function($a, $b) {
        $pagiA = ($a['prioritas_pagi'] ?? false) ;
        $pagiB = ($b['prioritas_pagi'] ?? false) ;
        return $pagiB <=> $pagiA;
    });

    $failedChunks = [];
    foreach ($unassignedChunks as $gen) {
        $kelasId = $gen['kelas_id'] ?? null;
        if (!$kelasId) continue;

        $durasi = $gen['durasi'] ?? 1;
        $mapelId = $gen['mapel_id'] ?? null;
        $guruId = $gen['g_id'] ?? 'none';
        $isPenjaskes = $gen['is_penjaskes'] ?? false;
        $cId = $gen['blok_id'] ?? ('chunk_' . uniqid());

        // Cek status prioritas pagi / NIP khusus
        $isPrioritasPagi = ($gen['prioritas_pagi'] ?? false);

        $assignedHari = null;
        $assignedJam = null;

        // Tentukan list hari: jika prioritas pagi, jangan di-acak (berurutan dari hari pertama)
        $hariCekList = $this->hari;
        if (!$isPrioritasPagi) {
            shuffle($hariCekList);
        }

        foreach ($hariCekList as $hariCoba) {
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
        $guruId = $gen['g_id'] ?? 'none';
        $isPenjaskes = $gen['is_penjaskes'] ?? false;
        $cId = $gen['blok_id'] ?? ('chunk_p3_' . uniqid());

        $isPrioritasPagi = ($gen['prioritas_pagi'] ?? false) || (($gen['nip'] ?? ''));

        $placed = false;

        $hariCekList = $this->hari;
        if (!$isPrioritasPagi) {
            shuffle($hariCekList);
        }

        foreach ($hariCekList as $hCoba) {
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

    $kromosom = $this->fixInternalClassOverlaps($cleanedKromosom);

    return $this->restoreBebanJamDatabase($kromosom);
}

    private function restoreBebanJamDatabase($kromosom)
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

        foreach ($kromosom as $kId => &$gens) {
            $aktualMapel = [];
            foreach ($gens as $cId => $gen) {
                $mId = $gen['mapel_id'] ?? null;
                if ($mId) {
                    $aktualMapel[$mId] = ($aktualMapel[$mId] ?? 0) + (int)($gen['durasi'] ?? 0);
                }
            }

            foreach ($aktualMapel as $mId => $durasiSekarang) {
                $targetBeban = $dbBebanMap[$kId][$mId] ?? $durasiSekarang;

                if ($durasiSekarang < $targetBeban) {
                    $kekurangan = $targetBeban - $durasiSekarang;

                    foreach ($gens as $cId => &$gen) {
                        if (($gen['mapel_id'] ?? null) == $mId) {
                            $gen['durasi'] += $kekurangan;
                            break;
                        }
                    }
                    unset($gen);
                } elseif ($durasiSekarang > $targetBeban) {
                    $kelebihan = $durasiSekarang - $targetBeban;

                    foreach ($gens as $cId => &$gen) {
                        if (($gen['mapel_id'] ?? null) == $mId && $gen['durasi'] > $kelebihan) {
                            $gen['durasi'] -= $kelebihan;
                            break;
                        }
                    }
                    unset($gen);
                }
            }
        }
        unset($gens);

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

    // Ganti dengan repairKromosom agar validasi guru global ikut bekerja
    return $this->repairKromosom($child);
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
                $gId = $gen['g_id'] ?? 'none';
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

        $effectiveMutationRate = !empty($bentrokList) ? max($this->mutationRate, 0.5) : $this->mutationRate;

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
                $guruId = $gen['g_id'] ?? 'none';
                $isPenjaskes = $gen['is_penjaskes'] ?? false;
                $hariLama = $gen['hari'] ?? null;
                $jamLama = $gen['jam_mulai'] ?? null;

                // --- CEK APAKAH GEN INI MASUK PRIORITAS PAGI ---
                $isPrioritasPagi = ($gen['prioritas_pagi'] ?? false);

                if ($hariLama && $jamLama) {
                    for ($d = 0; $d < $dur; $d++) {
                        $jCek = $jamLama + $d;
                        unset($globalMatrixKelas[$kId][$hariLama][$jCek]);
                        if (!$isPenjaskes && $guruId !== 'none') {
                            unset($globalMatrixGuru[$guruId][$hariLama][$jCek]);
                        }
                    }
                }

                // --- TENTUKAN URUTAN HARI (JANGAN DI-ACAK JIKA PRIORITAS PAGI) ---
                $hariList = $this->hari;
                if (!$isPrioritasPagi) {
                    shuffle($hariList);
                }

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
                    // Jika tidak ditemukan slot steril secara natural, fallback
                    if ($isPrioritasPagi) {
                        // Untuk prioritas pagi, paksa ambil hari pertama dan jam paling pagi yang tersedia
                        $hAcak = $this->hari[0] ?? $this->hari[array_rand($this->hari)];
                        $maxH = $this->getMaxJamInternal($hAcak);
                        $jAcak = 1; // Mulai dari jam pertama (pagi)
                    } else {
                        $hAcak = $this->hari[array_rand($this->hari)];
                        $maxH = $this->getMaxJamInternal($hAcak);
                        $jAcak = mt_rand(1, max(1, $maxH - $dur + 1));
                    }

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

        // PADATKAN KELAS SETELAH MUTASI AGAR TIDAK ADA OVERLAP
        $kromosom = $this->padatkanJadwalHarian($kromosom);

        return $this->fixInternalClassOverlaps($kromosom);
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

        foreach ($kromosom as $kId => &$gens) {
            $mapelAllChunks = [];
            foreach ($gens as $cId => $gen) {
                $mId = $gen['mapel_id'] ?? null;
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if ($isPenjaskes) {
                    $gens[$cId]['jam_mulai'] = 1;
                    continue;
                }

                if ($mId) {
                    $mapelAllChunks[$mId][$cId] = $gen;
                }
            }

            foreach ($mapelAllChunks as $mId => $chunks) {
                $maxBebanDb = $dbBebanMap[$kId][$mId] ?? 0;
                if ($maxBebanDb <= 0) continue;

                $cIds = array_keys($chunks);

                // ATURAN 1: Jika beban <= 3, wajib dijadikan 1 sesi utuh
                if ($maxBebanDb <= 3) {
                    $baseId = $cIds[0];
                    $totalDurasi = 0;
                    foreach ($cIds as $cId) {
                        $totalDurasi += ($gens[$cId]['durasi'] ?? 1);
                        if ($cId !== $baseId) unset($gens[$cId]);
                    }
                    $gens[$baseId]['durasi'] = min($totalDurasi, $maxBebanDb);
                }
                // ATURAN 2: Jika beban > 3, wajib dibagi / digabung menjadi tepat 2 sesi
                else {
                    $ideal1 = (int) ceil($maxBebanDb / 2);
                    $ideal2 = (int) floor($maxBebanDb / 2);

                    // Gabungkan dulu chunk yang terpecah di hari yang sama
                    $groupedByDay = [];
                    foreach ($chunks as $cId => $gen) {
                        $groupedByDay[$gen['hari']][$cId] = $gen;
                    }

                    foreach ($groupedByDay as $hari => $dayChunks) {
                        if (count($dayChunks) > 1) {
                            $dayCIds = array_keys($dayChunks);
                            $baseDayId = $dayCIds[0];
                            $totDurHari = 0;
                            foreach ($dayCIds as $subId) {
                                $totDurHari += ($gens[$subId]['durasi'] ?? 1);
                                if ($subId !== $baseDayId) unset($gens[$subId]);
                            }
                            $gens[$baseDayId]['durasi'] = $totDurHari;
                        }
                    }

                    // Ambil sisa chunk setelah dikelompokkan per hari
                    $sisaChunks = [];
                    foreach ($gens as $cCheckId => $gCheck) {
                        if (($gCheck['mapel_id'] ?? null) == $mId) {
                            $sisaChunks[$cCheckId] = $gCheck;
                        }
                    }
                    $sisaCIds = array_keys($sisaChunks);

                    // Jika jumlah sesi lebih dari 2, gabungkan sisanya
                    while (count($sisaCIds) > 2) {
                        $c1 = array_shift($sisaCIds);
                        $c2 = $sisaCIds[0];
                        if (isset($gens[$c1]) && isset($gens[$c2])) {
                            $gens[$c2]['durasi'] += $gens[$c1]['durasi'];
                            unset($gens[$c1]);
                        }
                    }

                    // Refresh daftar chunk
                    $sisaChunks = [];
                    foreach ($gens as $cCheckId => $gCheck) {
                        if (($gCheck['mapel_id'] ?? null) == $mId) {
                            $sisaChunks[$cCheckId] = $gCheck;
                        }
                    }
                    $sisaCIds = array_keys($sisaChunks);

                    // Pastikan pas menjadi tepat 2 sesi dengan nilai ideal
                    if (count($sisaCIds) == 2) {
                        $c1 = $sisaCIds[0];
                        $c2 = $sisaCIds[1];
                        $gens[$c1]['durasi'] = $ideal1;
                        $gens[$c2]['durasi'] = $ideal2;
                    } elseif (count($sisaCIds) == 1) {
                        $c1 = $sisaCIds[0];
                        $gens[$c1]['durasi'] = $ideal1;

                        // Buat sesi kedua jika tadinya hanya ada 1 chunk
                        $newCId = $c1 . '_split2';
                        $genBaru = $gens[$c1];
                        $genBaru['durasi'] = $ideal2;
                        $genBaru['hari'] = ($genBaru['hari'] === 'Senin') ? 'Selasa' : 'Senin';
                        $genBaru['jam_mulai'] = 1;
                        $gens[$newCId] = $genBaru;
                    }
                }
            }
        }
        unset($gens);

        return $this->padatkanJadwalHarian($kromosom);
    }

    private function padatkanJadwalHarian($kromosom)
{
    foreach ($kromosom as $kId => &$gens) {
        $byHari = [];

        // Kelompokkan gen berdasarkan hari
        foreach ($gens as $cId => $gen) {
            $h = $gen['hari'] ?? 'Senin';
            $byHari[$h][$cId] = $gen;
        }

        foreach ($byHari as $hari => $chunks) {
            // Urutkan prioritas: Penjaskes di awal, lalu berdasarkan jam mulai
            uasort($chunks, function($a, $b) {
                $aPenjas = $a['is_penjaskes'] ?? false;
                $bPenjas = $b['is_penjaskes'] ?? false;

                if ($aPenjas && !$bPenjas) return -1;
                if (!$aPenjas && $bPenjas) return 1;

                return ($a['jam_mulai'] ?? 1) <=> ($b['jam_mulai'] ?? 1);
            });

            $jamMulaiSekarang = 1;
            $maxJamHari = $this->getMaxJam($hari);

            foreach ($chunks as $cId => $gen) {
                $durasi = (int) ($gen['durasi'] ?? 1);
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (isset($gens[$cId])) {
                    if ($isPenjaskes) {
                        // Penjaskes dikunci di jam pertama jika memungkinkan
                        $gens[$cId]['jam_mulai'] = 1;
                        $jamMulaiSekarang = max($jamMulaiSekarang, 1 + $durasi);
                    } else {
                        // Pastikan blok jam tidak melebihi batas maksimal hari
                        if (($jamMulaiSekarang + $durasi - 1) > $maxJamHari) {
                            // Jika tidak muat di sisa jam, geser ke awal atau sesuaikan secara aman
                            // Opsional: Anda bisa menyesuaikan penanganan jika blok tidak muat sama sekali
                            $jamMulaiSekarang = max(1, $maxJamHari - $durasi + 1);
                        }

                        $gens[$cId]['jam_mulai'] = $jamMulaiSekarang;
                        $jamMulaiSekarang += $durasi;
                    }

                    // Set juga jam selesai jika struktur data Anda memerlukannya
                    if (isset($gens[$cId]['jam_selesai'])) {
                        $gens[$cId]['jam_selesai'] = $gens[$cId]['jam_mulai'] + $durasi - 1;
                    }
                }
            }
        }
    }
    unset($gens); // Hapus referensi untuk menghindari bug di perulangan berikutnya

    return $kromosom;
}

// Tambahkan parameter $isLogging = false di sini
    private function agresifSisirSemua($kromosom, $isLogging = false)
    {
        $matrixGuru = [];
        foreach ($kromosom as $kId => $gens) {
            foreach ($gens as $cId => $gen) {
                $h = $gen['hari'] ?? null;
                $jm = (int)($gen['jam_mulai'] ?? 1);
                $dur = (int)($gen['durasi'] ?? 1);
                $gId = $gen['g_id'] ?? 'none';
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                if (!$h || $isPenjaskes || $gId === 'none') continue;
                for ($d = 0; $d < $dur; $d++) {
                    $matrixGuru[$gId][$h][$jm + $d][$kId][] = $cId;
                }
            }
        }

        foreach ($matrixGuru as $gId => $hariData) {
            foreach ($hariData as $hari => $jamData) {
                foreach ($jamData as $jam => $kelasData) {
                    $allAssignments = [];
                    foreach ($kelasData as $kAssigned => $chunkList) {
                        foreach ($chunkList as $cAssigned) {
                            $allAssignments[] = ['kelas_id' => $kAssigned, 'chunk_id' => $cAssigned];
                        }
                    }

                    if (count($allAssignments) > 1) {
                        $pindahTarget = $allAssignments[1];
                        $kTarget = $pindahTarget['kelas_id'];
                        $cTarget = $pindahTarget['chunk_id'];

                        if (!isset($kromosom[$kTarget][$cTarget])) continue;
                        $genPindah = $kromosom[$kTarget][$cTarget];
                        $durPindah = (int)($genPindah['durasi'] ?? 1);

                        $pindahSukses = false;
                        foreach ($this->hari as $hCoba) {
                            $maxH = $this->getMaxJam($hCoba);
                            $batasMulai = $maxH - $durPindah + 1;

                            for ($jCoba = 1; $jCoba <= $batasMulai; $jCoba++) {
                                $kelasSteril = true;
                                for ($d = 0; $d < $durPindah; $d++) {
                                    $cekJ = $jCoba + $d;
                                    foreach ($kromosom[$kTarget] as $cCheck => $gCheck) {
                                        if ($cCheck === $cTarget) continue;
                                        if (($gCheck['hari'] ?? '') === $hCoba) {
                                            $jmC = (int)($gCheck['jam_mulai'] ?? 1);
                                            $durC = (int)($gCheck['durasi'] ?? 1);
                                            if ($cekJ >= $jmC && $cekJ < ($jmC + $durC)) {
                                                $kelasSteril = false;
                                                break 2;
                                            }
                                        }
                                    }
                                }

                                $guruSteril = true;
                                for ($d = 0; $d < $durPindah; $d++) {
                                    $cekJ = $jCoba + $d;
                                    if (isset($matrixGuru[$gId][$hCoba][$cekJ])) {
                                        $guruSteril = false;
                                        break;
                                    }
                                }

                                if ($kelasSteril && $guruSteril) {
                                    $hLama = $kromosom[$kTarget][$cTarget]['hari'];
                                    $jmLama = $kromosom[$kTarget][$cTarget]['jam_mulai'];
                                    for ($d = 0; $d < $durPindah; $d++) {
                                        unset($matrixGuru[$gId][$hLama][$jmLama + $d][$kTarget]);
                                    }

                                    $kromosom[$kTarget][$cTarget]['hari'] = $hCoba;
                                    $kromosom[$kTarget][$cTarget]['jam_mulai'] = $jCoba;

                                    for ($d = 0; $d < $durPindah; $d++) {
                                        $matrixGuru[$gId][$hCoba][$jCoba + $d][$kTarget][] = $cTarget;
                                    }

                                    // === LOG: RELOKASI MAPEL KE SLOT KOSONG ===
                                    if ($isLogging && is_callable($this->onLog)) {
                                        $namaMapel = $kromosom[$kTarget][$cTarget]['nama_mapel'] ?? 'Mapel';
                                        $namaKelas = $kromosom[$kTarget][$cTarget]['nama_kelas'] ?? 'Kelas';
                                        $namaGuru  = $kromosom[$kTarget][$cTarget]['nama_guru'] ?? 'Guru';

                                        $this->catatLog('RELOKASI_MAPEL', "Sistem memindahkan $namaMapel ($namaGuru) di $namaKelas untuk menghindari bentrok.", [
                                            'aksi' => 'pindah_slot',
                                            'kelas' => $namaKelas,
                                            'mapel' => $namaMapel,
                                            'guru' => $namaGuru,
                                            'dari' => "$hLama Jam ke-$jmLama",
                                            'ke' => "$hCoba Jam ke-$jCoba"
                                        ]);
                                    }

                                    $pindahSukses = true;
                                    break 2;
                                }
                            }
                        }

                        if (!$pindahSukses) {
                            foreach ($kromosom[$kTarget] as $cSwap => $genSwap) {
                                if ($cSwap === $cTarget) continue;
                                if ($genSwap['is_penjaskes'] ?? false) continue;

                                $durSwap = (int)($genSwap['durasi'] ?? 1);
                                $hSwap = $genSwap['hari'];
                                $jmSwap = $genSwap['jam_mulai'];
                                $gSwapId = $genSwap['g_id'] ?? 'none';
                                $hTargetAsli = $genPindah['hari'];
                                $jmTargetAsli = $genPindah['jam_mulai'];

                                if ($durPindah !== $durSwap) continue;
                                if (($jmSwap + $durPindah - 1) > $this->getMaxJam($hSwap)) continue;
                                if (($jmTargetAsli + $durSwap - 1) > $this->getMaxJam($hTargetAsli)) continue;

                                $guruTargetAman = true;
                                for ($d = 0; $d < $durPindah; $d++) {
                                    $cekJ = $jmSwap + $d;
                                    if (isset($matrixGuru[$gId][$hSwap][$cekJ])) {
                                        foreach ($matrixGuru[$gId][$hSwap][$cekJ] as $kCheck => $chunkListCheck) {
                                            if ($kCheck !== $kTarget) { $guruTargetAman = false; break 2; }
                                        }
                                    }
                                }

                                $guruSwapAman = true;
                                if ($gSwapId !== 'none') {
                                    for ($d = 0; $d < $durSwap; $d++) {
                                        $cekJ = $jmTargetAsli + $d;
                                        if (isset($matrixGuru[$gSwapId][$hTargetAsli][$cekJ])) {
                                            foreach ($matrixGuru[$gSwapId][$hTargetAsli][$cekJ] as $kCheck => $chunkListCheck) {
                                                if ($kCheck !== $kTarget) { $guruSwapAman = false; break 2; }
                                            }
                                        }
                                    }
                                }

                                if ($guruTargetAman && $guruSwapAman) {
                                    // === LOG: TUKAR POSISI DUA MAPEL ===
                                    if ($isLogging && is_callable($this->onLog)) {
                                        $mapel1 = $kromosom[$kTarget][$cTarget]['nama_mapel'] ?? 'Mapel 1';
                                        $mapel2 = $kromosom[$kTarget][$cSwap]['nama_mapel'] ?? 'Mapel 2';
                                        $namaKelas = $kromosom[$kTarget][$cTarget]['nama_kelas'] ?? 'Kelas';

                                        $this->catatLog('TUKAR_MAPEL', "Sistem menukar posisi $mapel1 dengan $mapel2 di $namaKelas.", [
                                            'aksi' => 'tukar_posisi',
                                            'kelas' => $namaKelas,
                                            'mapel_1' => $mapel1,
                                            'posisi_1' => "$hTargetAsli Jam ke-$jmTargetAsli",
                                            'mapel_2' => $mapel2,
                                            'posisi_2' => "$hSwap Jam ke-$jmSwap"
                                        ]);
                                    }

                                    $kromosom[$kTarget][$cTarget]['hari'] = $hSwap;
                                    $kromosom[$kTarget][$cTarget]['jam_mulai'] = $jmSwap;

                                    $kromosom[$kTarget][$cSwap]['hari'] = $hTargetAsli;
                                    $kromosom[$kTarget][$cSwap]['jam_mulai'] = $jmTargetAsli;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        return $this->padatkanJadwalHarian($kromosom);
    }
    // FUNGSI UTAMA: Membongkar dan memindahkan mapel yang numpuk secara cepat
 private function fixInternalClassOverlaps($kromosom)
    {
        $newKromosom = [];

        foreach ($kromosom as $kId => $gens) {
            $matrixSlot = []; // Melacak slot hari & jam yang sudah terisi di kelas ini
            $assignedChunks = [];
            $conflictChunks = [];

            // Urutkan dari durasi terbesar agar mapel besar mendapat prioritas slot terlebih dahulu
            uasort($gens, function($a, $b) {
                return ($b['durasi'] ?? 1) <=> ($a['durasi'] ?? 1);
            });

            // Langkah 1: Masukkan blok yang posisinya sudah benar & steril
            foreach ($gens as $cId => $gen) {
                $hari = $gen['hari'] ?? 'Senin';
                $jamMulai = (int)($gen['jam_mulai'] ?? 1);
                $durasi = (int)($gen['durasi'] ?? 1);
                $maxH = $this->getMaxJam($hari);

                $bisa = true;
                if ($jamMulai < 1 || ($jamMulai + $durasi - 1) > $maxH) {
                    $bisa = false;
                } else {
                    for ($d = 0; $d < $durasi; $d++) {
                        if (isset($matrixSlot[$hari][$jamMulai + $d])) {
                            $bisa = false; // Bentrok / sudah diisi mapel lain!
                            break;
                        }
                    }
                }

                if ($bisa) {
                    for ($d = 0; $d < $durasi; $d++) {
                        $matrixSlot[$hari][$jamMulai + $d] = true;
                    }
                    $assignedChunks[$cId] = $gen;
                } else {
                    $conflictChunks[] = $gen; // Lempar ke antrean relokasi
                }
            }

            // Langkah 2: Cari slot kosong lain secara steril untuk mapel yang sempat bentrok
            foreach ($conflictChunks as $gen) {
                $durasi = (int)($gen['durasi'] ?? 1);
                $placed = false;

                foreach ($this->hari as $hCoba) {
                    $maxH = $this->getMaxJam($hCoba);
                    $batasMulai = $maxH - $durasi + 1;

                    for ($jCoba = 1; $jCoba <= $batasMulai; $jCoba++) {
                        $steril = true;
                        for ($d = 0; $d < $durasi; $d++) {
                            if (isset($matrixSlot[$hCoba][$jCoba + $d])) {
                                $steril = false;
                                break;
                            }
                        }

                        if ($steril) {
                            // Tandai slot sebagai terisi
                            for ($d = 0; $d < $durasi; $d++) {
                                $matrixSlot[$hCoba][$jCoba + $d] = true;
                            }
                            $gen['hari'] = $hCoba;
                            $gen['jam_mulai'] = $jCoba;
                            $assignedChunks[$gen['blok_id'] ?? ('chunk_' . uniqid())] = $gen;
                            $placed = true;
                            break 2;
                        }
                    }
                }

                // Langkah 3: Fallback darurat (jika jadwal sangat padat, cari 1 slot kosong bebas walau harus menyesuaikan)
                if (!$placed) {
                    foreach ($this->hari as $hCoba) {
                        $maxH = $this->getMaxJam($hCoba);
                        for ($jCoba = 1; $jCoba <= $maxH; $jCoba++) {
                            if (!isset($matrixSlot[$hCoba][$jCoba])) {
                                $matrixSlot[$hCoba][$jCoba] = true;
                                $gen['hari'] = $hCoba;
                                $gen['jam_mulai'] = $jCoba;
                                $gen['durasi'] = 1; // Paksa durasi 1 jika benar-benar darurat agar masuk
                                $assignedChunks[$gen['blok_id'] ?? ('chunk_' . uniqid())] = $gen;
                                $placed = true;
                                break 2;
                            }
                        }
                    }
                }
            }

            $newKromosom[$kId] = $assignedChunks;
        }

        return $newKromosom;
    }
}
