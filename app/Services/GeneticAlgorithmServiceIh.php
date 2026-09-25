<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        $this->populasi = $params['populasi'] ?? 100;
        $this->maxGenerasi = $params['generasi'] ?? 500;
        $this->crossoverRate = $params['crossover_rate'] ?? 0.8;
        $this->mutationRate = $params['mutation_rate'] ?? 0.1;

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
        return $this->maxJamPerHari[$hari] ?? 11;
    }

    private function getSlotWaktu($hari, $jam)
    {
        return $this->slotWaktuPerHari[$hari][$jam] ?? ['mulai' => '07:00:00', 'selesai' => '07:35:00'];
    }

    public function generate()
    {
        $populasiSaatIni = $this->inisialisasiPopulasi();
        $generasi = 0;
        $bestFitness = 0;
        $bestKromosom = [];
        $stagnantGenerations = 0;
        $lastBestFitness = 0;

        while ($generasi < $this->maxGenerasi) {
            $fitnessPopulasi = [];
            foreach ($populasiSaatIni as $kromosom) {
                $fitness = $this->hitungFitness($kromosom);
                $fitnessPopulasi[] = ['kromosom' => $kromosom, 'fitness' => $fitness];

                if ($fitness > $bestFitness) {
                    $bestFitness = $fitness;
                    $bestKromosom = $kromosom;
                }
            }

            if ($bestFitness > $lastBestFitness) {
                $lastBestFitness = $bestFitness;
                $stagnantGenerations = 0;
            } else {
                $stagnantGenerations++;
            }

            if (is_callable($this->onGenerationComplete)) {
                ($this->onGenerationComplete)($generasi, $bestFitness);
            }

            if ($bestFitness >= 0.999 || $stagnantGenerations >= $this->maxGenerasi) break;

            $populasiBaru = [];
            if (!empty($bestKromosom)) {
                $populasiBaru[] = $bestKromosom; // Elitism
            }

            $sisaPopulasi = $this->populasi - count($populasiBaru);
            for ($i = 0; $i < $sisaPopulasi; $i++) {
                $parent1 = $this->seleksi($fitnessPopulasi);
                $parent2 = $this->seleksi($fitnessPopulasi);
                $child = $this->crossover($parent1, $parent2);
                $child = $this->mutasi($child);
                $populasiBaru[] = $child;
            }

            $populasiSaatIni = $populasiBaru;
            $generasi++;
        }

        $flatJadwal = [];
        if (!empty($bestKromosom)) {
            foreach ($bestKromosom as $kelasId => $gens) {
                foreach ($gens as $gen) {
                    $flatJadwal[] = $gen;
                }
            }
        }

        // PERBAIKAN: Mengurutkan jadwal sebelum di-return agar frontend tidak salah merender susunan blok
        usort($flatJadwal, function($a, $b) {
            $hariOrder = ['Senin' => 1, 'Selasa' => 2, 'Rabu' => 3, 'Kamis' => 4, 'Jumat' => 5];

            $kelasCompare = strcmp($a['kelas_id'], $b['kelas_id']);
            if ($kelasCompare !== 0) return $kelasCompare;

            $hariA = $hariOrder[$a['hari']] ?? 99;
            $hariB = $hariOrder[$b['hari']] ?? 99;
            if ($hariA !== $hariB) return $hariA <=> $hariB;

            return $a['jam'] <=> $b['jam'];
        });

        return [
            'status' => 'success',
            'generasi_terakhir' => $generasi,
            'fitness_terbaik' => round($bestFitness, 4),
            'jadwal' => $flatJadwal
        ];
    }

    private function inisialisasiPopulasi()
    {
        $populasi = [];
        $guruMapelsArray = $this->guruMapels instanceof \Illuminate\Support\Collection
            ? $this->guruMapels->all()
            : (array) $this->guruMapels;

        $guruMapelPerKelas = [];
        $penjaskesPerGuru = [];

        foreach ($guruMapelsArray as $gm) {
            $guruMapelPerKelas[$gm->kelas_id][] = $gm;
            $namaMapelLower = strtolower($gm->nama_mapel ?? '');

            $isPenjaskes = preg_match('/penjas|olahraga|pjok|jasmani/i', $namaMapelLower);

            if ($isPenjaskes) {
                // Kelompokkan berdasarkan Guru -> lalu kelompokkan lagi berdasarkan Beban Jam (2 atau 3 jam)
                $beban = (int) $gm->beban_jam;
                $penjaskesPerGuru[$gm->t_list_guru_id][$beban][$gm->kelas_id][] = $gm;
            }
        }

        $kelasArray = $this->kelas instanceof \Illuminate\Support\Collection ? $this->kelas->all() : (array) $this->kelas;
        $totalPopulasi = $this->populasi;

        for ($i = 0; $i < $totalPopulasi; $i++) {
            $kromosom = [];
            $matrixGuru = [];
            $matrixKelasHari = [];

            foreach ($kelasArray as $kls) {
                $kelasId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
                if (!$kelasId) continue;
                $kromosom[$kelasId] = [];
                foreach ($this->hari as $h) {
                    for ($jm = 1; $jm <= $this->getMaxJam($h); $jm++) {
                        $matrixKelasHari[$kelasId][$h][$jm] = false;
                    }
                }
            }

            // --- TAHAP 1: PENJASKES BERDASARKAN KELOMPOK BEBAN (2 JAM / 3 JAM) ---
            foreach ($penjaskesPerGuru as $guruId => $bebanData) {
                foreach ($bebanData as $bebanJamTarget => $kelasData) {
                    $kelasIds = array_keys($kelasData);

                    // Chunking max 2 kelas per grup agar mudah diatur di pagi hari
                    $grupKelasList = array_chunk($kelasIds, 2);

                    foreach ($grupKelasList as $grupIndex => $grupKelasIds) {
                        $terpasang = false;
                        $hariList = $this->hari;
                        shuffle($hariList);

                        foreach ($hariList as $hari) {
                            // Wajib di pagi hari (Jam 1, 2, atau 3)
                            $jamMulaiPagi = [1, 2, 3];
                            shuffle($jamMulaiPagi);

                            foreach ($jamMulaiPagi as $jm) {
                                $bisaSemua = true;
                                for ($b = 0; $b < $bebanJamTarget; $b++) {
                                    $jamCek = $jm + $b;
                                    if ($jamCek > $this->getMaxJam($hari)) {
                                        $bisaSemua = false; break;
                                    }
                                    if (isset($matrixGuru[$guruId][$hari][$jamCek])) {
                                        $bisaSemua = false; break;
                                    }
                                    foreach ($grupKelasIds as $kId) {
                                        if ($matrixKelasHari[$kId][$hari][$jamCek] === true) {
                                            $bisaSemua = false; break 2;
                                        }
                                    }
                                }

                                if ($bisaSemua) {
                                    foreach ($grupKelasIds as $kId) {
                                        $jamCursor = $jm;
                                        foreach ($kelasData[$kId] as $gm) {
                                            $bebanGm = (int) $gm->beban_jam;
                                            for ($b = 0; $b < $bebanGm; $b++) {
                                                $matrixKelasHari[$kId][$hari][$jamCursor] = true;
                                                $matrixGuru[$guruId][$hari][$jamCursor] = 'penjaskes';
                                                $kromosom[$kId][] = $this->buatGenJadwal($gm, $hari, $jamCursor, 'pjok_'.$bebanJamTarget.'_'.$grupIndex, 1);
                                                $jamCursor++;
                                            }
                                        }
                                    }
                                    $terpasang = true;
                                    break 2;
                                }
                            }
                            if ($terpasang) break;
                        }

                        // Fallback jika slot pagi penuh
                        if (!$terpasang) {
                            foreach ($this->hari as $hari) {
                                $maxH = $this->getMaxJam($hari);
                                for ($jm = 1; $jm <= ($maxH - $bebanJamTarget + 1); $jm++) {
                                    $bisaSemua = true;
                                    for ($b = 0; $b < $bebanJamTarget; $b++) {
                                        $jamCek = $jm + $b;
                                        if (isset($matrixGuru[$guruId][$hari][$jamCek])) {
                                            $bisaSemua = false; break;
                                        }
                                        foreach ($grupKelasIds as $kId) {
                                            if ($matrixKelasHari[$kId][$hari][$jamCek] === true) {
                                                $bisaSemua = false; break 2;
                                            }
                                        }
                                    }

                                    if ($bisaSemua) {
                                        foreach ($grupKelasIds as $kId) {
                                            $jamCursor = $jm;
                                            foreach ($kelasData[$kId] as $gm) {
                                                $bebanGm = (int) $gm->beban_jam;
                                                for ($b = 0; $b < $bebanGm; $b++) {
                                                    $matrixKelasHari[$kId][$hari][$jamCursor] = true;
                                                    $matrixGuru[$guruId][$hari][$jamCursor] = 'penjaskes';
                                                    $kromosom[$kId][] = $this->buatGenJadwal($gm, $hari, $jamCursor, 'pjok_fb_'.$grupIndex, 1);
                                                    $jamCursor++;
                                                }
                                            }
                                        }
                                        $terpasang = true;
                                        break 2;
                                    }
                                }
                                if ($terpasang) break;
                            }
                        }
                    }
                }
            }

            // --- TAHAP 2: PENGISIAN MAPEL REGULER ---
            foreach ($kelasArray as $kls) {
                $kelasId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
                if (!$kelasId) continue;

                $mapelKelas = $guruMapelPerKelas[$kelasId] ?? [];
                if (empty($mapelKelas)) continue;

                $daftarBlok = [];
                foreach ($mapelKelas as $gm) {
                    $namaMapelLower = strtolower($gm->nama_mapel ?? '');
                    if (preg_match('/penjas|olahraga|pjok|jasmani/i', $namaMapelLower)) continue;

                    $beban = (int) $gm->beban_jam;
                    $chunks = [];

                    if ($beban <= 3) {
                        $chunks[] = $beban;
                    } else {
                        $sisa = $beban;
                        while ($sisa > 0) {
                            $chunkSize = ($sisa >= 3) ? 3 : $sisa;
                            $chunks[] = $chunkSize;
                            $sisa -= $chunkSize;
                        }
                    }

                    foreach ($chunks as $chunkIndex => $c) {
                        $daftarBlok[] = [
                            'gm' => $gm,
                            'durasi' => $c,
                            'chunk_index' => $chunkIndex,
                            'is_prioritas' => !empty($gm->is_prioritas_pagi)
                        ];
                    }
                }

                shuffle($daftarBlok);
                usort($daftarBlok, function($a, $b) {
                    return $b['is_prioritas'] <=> $a['is_prioritas'];
                });

                foreach ($daftarBlok as $blokIndex => $blok) {
                    $gm = $blok['gm'];
                    $durasi = $blok['durasi'];
                    $chunkIndex = $blok['chunk_index'];
                    $isPrioritas = $blok['is_prioritas'];
                    $terpasang = false;

                    $hariAcak = $this->hari;
                    shuffle($hariAcak);

                    foreach ($hariAcak as $hari) {
                        $maxH = $this->getMaxJam($hari);
                        $batasJam = $maxH - $durasi + 1;
                        if ($batasJam < 1) continue;

                        $jamMulaiAcak = range(1, $batasJam);
                        if ($isPrioritas && $chunkIndex === 0) {
                            $jamMulaiAcak = array_filter($jamMulaiAcak, fn($j) => $j <= max(1, 4 - $durasi + 1));
                            if(empty($jamMulaiAcak)) $jamMulaiAcak = range(1, $batasJam);
                        }
                        shuffle($jamMulaiAcak);

                        foreach ($jamMulaiAcak as $jm) {
                            $bisa = true;
                            for ($d = 0; $d < $durasi; $d++) {
                                $jamCek = $jm + $d;
                                if ($matrixKelasHari[$kelasId][$hari][$jamCek] === true ||
                                    isset($matrixGuru[$gm->t_list_guru_id][$hari][$jamCek])) {
                                    $bisa = false;
                                    break;
                                }
                            }

                            if ($bisa) {
                                for ($d = 0; $d < $durasi; $d++) {
                                    $jamCek = $jm + $d;
                                    $matrixKelasHari[$kelasId][$hari][$jamCek] = true;
                                    $matrixGuru[$gm->t_list_guru_id][$hari][$jamCek] = true;
                                    $kromosom[$kelasId][] = $this->buatGenJadwal($gm, $hari, $jamCek, $blokIndex . '_' . $d, 1);
                                }
                                $terpasang = true;
                                break 2;
                            }
                        }
                    }

                    if (!$terpasang) {
                        $sisaDurasi = $durasi;
                        foreach ($this->hari as $hari) {
                            $maxH = $this->getMaxJam($hari);
                            for ($jm = 1; $jm <= $maxH; $jm++) {
                                if ($sisaDurasi > 0 && $matrixKelasHari[$kelasId][$hari][$jm] === false) {
                                    $matrixKelasHari[$kelasId][$hari][$jm] = true;
                                    $matrixGuru[$gm->t_list_guru_id][$hari][$jm] = true;
                                    $kromosom[$kelasId][] = $this->buatGenJadwal($gm, $hari, $jm, 'fallback_paksa', 1);
                                    $sisaDurasi--;
                                }
                            }
                            if ($sisaDurasi <= 0) break;
                        }
                    }
                }
            }
            $populasi[] = $kromosom;
        }

        return $populasi;
    }

    private function buatGenJadwal($gm, $hari, $jam, $indeksBlok, $bebanBlok)
    {
        $waktu = $this->getSlotWaktu($hari, $jam);

        $namaMapelLower = strtolower($gm->nama_mapel ?? '');
        $isPenjaskes = preg_match('/penjas|olahraga|pjok|jasmani|penjaskes/i', $namaMapelLower) === 1;

        return [
            'guru_id'              => $gm->t_list_guru_id ?? null,
            't_list_guru_id'       => $gm->t_list_guru_id ?? null,
            't_list_guru_mapel_id' => $gm->id,
            'blok_id'              => $gm->id . '_' . $indeksBlok,
            'mapel_id'             => $gm->mapel_id,
            'kelas_id'             => $gm->kelas_id,
            'hari'                 => $hari,
            'jam'                  => (int) $jam,
            'jam_mulai'            => $waktu['mulai'],
            'jam_selesai'          => $waktu['selesai'],
            'beban_jam'            => $bebanBlok,
            'is_penjaskes'         => $isPenjaskes
        ];
    }

    private function hitungFitness($kromosom)
    {
        $penalty = 0;
        $trackerGuru = [];
        $trackerKelas = [];
        $jadwalHarianKelas = [];
        $hitungBebanGuruMapel = [];
        $mapelHarian = []; // Untuk melacak jumlah jam suatu mapel pada hari yang sama
        $maxJamPerHari = $this->maxJamPerHari;

        foreach ($kromosom as $kelasId => $gens) {
            foreach ($gens as $gen) {
                $hari = $gen['hari'];
                $jam = (int) $gen['jam'];
                $nip = $gen['nip'];
                $gmId = $gen['t_list_guru_mapel_id'];

                $batasJamMax = $maxJamPerHari[$hari] ?? 11;
                if ($jam > $batasJamMax || $jam < 1) {
                    $penalty += 5.0;
                }

                if (isset($trackerGuru[$nip][$hari][$jam])) {
                    $penalty += 4.0;
                } else {
                    $trackerGuru[$nip][$hari][$jam] = true;
                }

                if (isset($trackerKelas[$kelasId][$hari][$jam])) {
                    $penalty += 4.0;
                } else {
                    $trackerKelas[$kelasId][$hari][$jam] = true;
                }

                // Pelacakan Jam Tertinggi untuk Hukuman Jam Bolong
                if (!isset($jadwalHarianKelas[$kelasId][$hari])) {
                    $jadwalHarianKelas[$kelasId][$hari] = [
                        'max' => $jam,
                        'count' => 1
                    ];
                } else {
                    if ($jam > $jadwalHarianKelas[$kelasId][$hari]['max']) $jadwalHarianKelas[$kelasId][$hari]['max'] = $jam;
                    $jadwalHarianKelas[$kelasId][$hari]['count']++;
                }

                $hitungBebanGuruMapel[$gmId] = ($hitungBebanGuruMapel[$gmId] ?? 0) + 1;
                $mapelHarian[$kelasId][$hari][$gmId] = ($mapelHarian[$kelasId][$hari][$gmId] ?? 0) + 1;
            }
        }

        // PERBAIKAN 1: Kalkulasi Penalti Jam Bolong (Memaksa Mulai dari Jam Pertama)
        foreach ($jadwalHarianKelas as $kelasId => $hariList) {
            foreach ($hariList as $hari => $stats) {
                // Jika max jam = 5, maka count juga harus 5. Jika count < 5, berarti ada jam bolong di antara 1 sampai 5.
                if ($stats['max'] > $stats['count']) {
                    $penalty += ($stats['max'] - $stats['count']) * 20.0; // Bobot dinaikkan agar dirapatkan
                }
            }
        }

        // PERBAIKAN 2: Penalti Mapel Beruntun > 3 Jam per hari
        foreach ($mapelHarian as $kelasId => $hariList) {
            foreach ($hariList as $hari => $mapels) {
                foreach ($mapels as $gmId => $totalJamMapel) {
                    if ($totalJamMapel > 3) {
                        $penalty += ($totalJamMapel - 3) * 20.0; // Bobot sangat besar untuk mencegahnya
                    }
                }
            }
        }

        // Validasi Beban Jam Guru Mapel
        foreach ($this->targetBebanJam as $gmId => $seharusnyaJam) {
            $aktualJam = $hitungBebanGuruMapel[$gmId] ?? 0;
            if ($aktualJam !== $seharusnyaJam) {
                $penalty += abs($aktualJam - $seharusnyaJam) * 20.0;
            }
        }

        return 1 / (1 + $penalty);
    }

    private function seleksi($fitnessPopulasi)
    {
        $kandidat1 = $fitnessPopulasi[array_rand($fitnessPopulasi)];
        $kandidat2 = $fitnessPopulasi[array_rand($fitnessPopulasi)];
        return ($kandidat1['fitness'] > $kandidat2['fitness']) ? $kandidat1['kromosom'] : $kandidat2['kromosom'];
    }

    private function crossover($parent1, $parent2)
    {
        if ((mt_rand() / mt_getrandmax()) > $this->crossoverRate) return $parent1;

        $child = [];
        $kelasGroupedByGuru = [];

        $guruMapelsArray = $this->guruMapels instanceof \Illuminate\Support\Collection ? $this->guruMapels->all() : (array) $this->guruMapels;
        foreach ($guruMapelsArray as $gm) {
            $namaMapelLower = strtolower($gm->nama_mapel ?? '');
            if (preg_match('/penjas|olahraga|pjok|jasmani/i', $namaMapelLower)) {
                $guruId = $gm->t_list_guru_id;
                $kelasId = $gm->kelas_id;
                if (!isset($kelasGroupedByGuru[$guruId]) || !in_array($kelasId, $kelasGroupedByGuru[$guruId])) {
                    $kelasGroupedByGuru[$guruId][] = $kelasId;
                }
            }
        }

        $pilihanGrup = [];
        foreach ($kelasGroupedByGuru as $guruId => $kelasIds) {
            $pilihanGrup[$guruId] = (mt_rand(0, 1) === 1) ? 1 : 2;
        }

        foreach ($parent1 as $kelasId => $gensP1) {
            $assignedParent = null;
            foreach ($kelasGroupedByGuru as $guruId => $kelasIds) {
                if (in_array($kelasId, $kelasIds)) {
                    $assignedParent = $pilihanGrup[$guruId];
                    break;
                }
            }

            if ($assignedParent === 1) {
                $child[$kelasId] = $gensP1;
            } elseif ($assignedParent === 2) {
                $child[$kelasId] = $parent2[$kelasId] ?? $gensP1;
            } else {
                $child[$kelasId] = (mt_rand(0, 1) === 1) ? $gensP1 : ($parent2[$kelasId] ?? $gensP1);
            }
        }

        return $child;
    }

    private function mutasi($kromosom)
    {
        if ((mt_rand() / mt_getrandmax()) > $this->mutationRate) return $kromosom;

        $kelasKeys = array_keys($kromosom);
        if(empty($kelasKeys)) return $kromosom;

        $kelasIdMutasi = $kelasKeys[array_rand($kelasKeys)];
        $kelompok = (mt_rand(0, 1) === 0) ? ['Senin', 'Selasa', 'Rabu'] : ['Kamis', 'Jumat'];

        if (count($kelompok) < 2) return $kromosom;

        $hari1 = $kelompok[array_rand($kelompok)];
        $hari2 = $kelompok[array_rand($kelompok)];

        if ($hari1 !== $hari2) {
            $adaPenjaskes = false;
            foreach ($kromosom[$kelasIdMutasi] as $gen) {
                if (!empty($gen['is_penjaskes']) && ($gen['hari'] === $hari1 || $gen['hari'] === $hari2)) {
                    $adaPenjaskes = true;
                    break;
                }
            }

            // Mutasi dilarang aktif di hari yang terdapat Mapel Penjaskes (agar tidak memutus urutan)
            if (!$adaPenjaskes) {
                foreach ($kromosom[$kelasIdMutasi] as &$gen) {
                    if ($gen['hari'] === $hari1) {
                        $gen['hari'] = $hari2;
                        $waktu = $this->getSlotWaktu($hari2, $gen['jam']);
                        $gen['jam_mulai'] = $waktu['mulai'];
                        $gen['jam_selesai'] = $waktu['selesai'];
                    } elseif ($gen['hari'] === $hari2) {
                        $gen['hari'] = $hari1;
                        $waktu = $this->getSlotWaktu($hari1, $gen['jam']);
                        $gen['jam_mulai'] = $waktu['mulai'];
                        $gen['jam_selesai'] = $waktu['selesai'];
                    }
                }
                unset($gen);
            }
        }

        return $kromosom;
    }
}
