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

    private $prioritasPagiNip;
    private $prioritasPagi;

    private $targetBebanJam = [];

    public function __construct($params, $guruMapels, $kelas, $prioritasPagi = [])
    {
        $this->populasi = $params['populasi'] ?? 100;
        $this->maxGenerasi = $params['generasi'] ?? 500;
        $this->crossoverRate = $params['crossover_rate'] ?? 0.8;
        $this->mutationRate = $params['mutation_rate'] ?? 0.1;
        $this->prioritasPagiNip = $params['prioritas_pagi_nip'] ?? [];
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
        foreach ($guruMapelsArray as $gm) {
            $guruMapelPerKelas[$gm->kelas_id][] = $gm;
        }

        $kelasArray = $this->kelas instanceof \Illuminate\Support\Collection
            ? $this->kelas->all()
            : (array) $this->kelas;

        $totalPopulasi = $this->populasi;

        for ($i = 0; $i < $totalPopulasi; $i++) {
            $kromosom = [];
            $matrixGuru = [];
            $trackerBebanGuruKelas = [];
            $trackerMapelHarian = [];

            foreach ($kelasArray as $kls) {
                $kelasId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
                if (!$kelasId) continue;

                $mapelKelas = $guruMapelPerKelas[$kelasId] ?? [];
                if (empty($mapelKelas)) continue;

                $kromosom[$kelasId] = [];

                $matrixKelasHari = [];
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJam($h);
                    for ($jm = 1; $jm <= $maxH; $jm++) {
                        $matrixKelasHari[$h][$jm] = false;
                    }
                }

                // ===============================================================
                // PERBAIKAN PRIORITAS PAGI: Pisahkan Guru Prioritas & Guru Biasa
                // ===============================================================
                $gmPriority = [];
                $gmRegular = [];

                // foreach ($mapelKelas as $gm) {
                //     // Cek apakah NIP guru ini ada di array prioritas_pagi_nip
                //     if (!empty($this->prioritasPagiNip) && in_array($gm->nip, $this->prioritasPagiNip)) {
                //         $gmPriority[] = $gm;
                //     } else {
                //         $gmRegular[] = $gm;
                //     }
                // }

                foreach ($mapelKelas as $gm) {
                    // Cek langsung properti is_prioritas_pagi bernilai true dari objek gm
                    if (!empty($gm->is_prioritas_pagi)) {
                        $gmPriority[] = $gm;
                    } else {
                        $gmRegular[] = $gm;
                    }
                }
                // Acak masing-masing kelompok, lalu gabungkan.
                // Guru prioritas ditaruh di awal array agar dieksekusi/dipilih duluan!
                shuffle($gmPriority);
                shuffle($gmRegular);
                $gmShuffled = array_merge($gmPriority, $gmRegular);

                // Mulai Memasukkan Jadwal
                foreach ($gmShuffled as $gm) {
                    $bebanSeharusnya = (int) $gm->beban_jam;

                    while (($trackerBebanGuruKelas[$kelasId][$gm->id] ?? 0) < $bebanSeharusnya) {
                        $bebanSudahDipasang = $trackerBebanGuruKelas[$kelasId][$gm->id] ?? 0;
                        $sisaJam = $bebanSeharusnya - $bebanSudahDipasang;

                        $ukuranBlokDicoba = [($sisaJam >= 3 ? 3 : $sisaJam)];
                        if ($ukuranBlokDicoba[0] > 1) {
                            $ukuranBlokDicoba[] = 1;
                        }

                        $slotDipasang = false;

                        // FASE 1: PEMASANGAN AMAN
                        foreach ($ukuranBlokDicoba as $bebanBlok) {
                            $hariAcak = $this->hari;
                            shuffle($hariAcak);

                            foreach ($hariAcak as $hari) {
                                $maxJamHariIni = $this->getMaxJam($hari);
                                $bebanMapelHariIni = $trackerMapelHarian[$kelasId][$gm->id][$hari] ?? 0;

                                if ($bebanMapelHariIni + $bebanBlok > 3) continue;

                                for ($jm = 1; $jm <= ($maxJamHariIni - $bebanBlok + 1); $jm++) {
                                    $bisa = true;

                                    for ($b = 0; $b < $bebanBlok; $b++) {
                                        $jamCek = $jm + $b;
                                        if ($matrixKelasHari[$hari][$jamCek] === true || isset($matrixGuru[$gm->nip][$hari][$jamCek])) {
                                            $bisa = false;
                                            break;
                                        }
                                    }

                                    if ($bisa) {
                                        for ($b = 0; $b < $bebanBlok; $b++) {
                                            $jamCek = $jm + $b;
                                            $matrixKelasHari[$hari][$jamCek] = true;
                                            $matrixGuru[$gm->nip][$hari][$jamCek] = true;
                                            $kromosom[$kelasId][] = $this->buatGenJadwal($gm, $hari, $jamCek, $bebanSudahDipasang + $b, 1);
                                        }
                                        $trackerBebanGuruKelas[$kelasId][$gm->id] = $bebanSudahDipasang + $bebanBlok;
                                        $trackerMapelHarian[$kelasId][$gm->id][$hari] = $bebanMapelHariIni + $bebanBlok;
                                        $slotDipasang = true;
                                        break 3;
                                    }
                                }
                            }
                        }

                        // FASE 2: PEMASANGAN PAKSA (Menjamin 57 Slot Penuh)
                        if (!$slotDipasang) {
                            foreach ($this->hari as $hariF) {
                                $maxJamHariIniF = $this->getMaxJam($hariF);
                                for ($jmF = 1; $jmF <= $maxJamHariIniF; $jmF++) {
                                    if ($matrixKelasHari[$hariF][$jmF] === false) {
                                        $matrixKelasHari[$hariF][$jmF] = true;
                                        $matrixGuru[$gm->nip][$hariF][$jmF] = true;

                                        $kromosom[$kelasId][] = $this->buatGenJadwal($gm, $hariF, $jmF, 999 + $bebanSudahDipasang, 1);

                                        $trackerBebanGuruKelas[$kelasId][$gm->id] = $bebanSudahDipasang + 1;
                                        $trackerMapelHarian[$kelasId][$gm->id][$hariF] = ($trackerMapelHarian[$kelasId][$gm->id][$hariF] ?? 0) + 1;
                                        $slotDipasang = true;
                                        break 2;
                                    }
                                }
                            }
                        }

                        if (!$slotDipasang) break;
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

        return [
            'nip'                  => $gm->nip,
            't_list_guru_id'       => $gm->t_list_guru_id ?? null,
            't_list_guru_mapel_id' => $gm->id,
            'blok_id'              => $gm->id . '_' . $indeksBlok,
            'mapel_id'             => $gm->mapel_id,
            'kelas_id'             => $gm->kelas_id,
            'hari'                 => $hari,
            'jam'                  => (int) $jam,
            'jam_mulai'            => $waktu['mulai'],
            'jam_selesai'          => $waktu['selesai'],
            'beban_jam'            => $bebanBlok
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
        foreach ($parent1 as $kelasId => $gensP1) {
            if (mt_rand(0, 1) === 1) {
                $child[$kelasId] = $gensP1;
            } else {
                $child[$kelasId] = $parent2[$kelasId] ?? $gensP1;
            }
        }
        return $child;
    }

    private function mutasi($kromosom)
    {
        if ((mt_rand() / mt_getrandmax()) > $this->mutationRate) return $kromosom;

        foreach ($kromosom as $kelasId => &$gens) {
            if (count($gens) > 1 && (mt_rand() / mt_getrandmax()) < 0.5) {
                $idx1 = array_rand($gens);
                $idx2 = array_rand($gens);

                $attempts = 0;
                while ($idx1 === $idx2 && $attempts < 3) {
                    $idx2 = array_rand($gens);
                    $attempts++;
                }

                if ($idx1 !== $idx2) {
                    $maxJamHari1 = $this->getMaxJam($gens[$idx2]['hari']);
                    $maxJamHari2 = $this->getMaxJam($gens[$idx1]['hari']);

                    if ($gens[$idx1]['jam'] <= $maxJamHari1 && $gens[$idx2]['jam'] <= $maxJamHari2) {
                        $tempHari = $gens[$idx1]['hari'];
                        $tempJam  = $gens[$idx1]['jam'];

                        $gens[$idx1]['hari'] = $gens[$idx2]['hari'];
                        $gens[$idx1]['jam']  = $gens[$idx2]['jam'];
                        $waktu1 = $this->getSlotWaktu($gens[$idx1]['hari'], $gens[$idx1]['jam']);
                        $gens[$idx1]['jam_mulai'] = $waktu1['mulai'];
                        $gens[$idx1]['jam_selesai'] = $waktu1['selesai'];

                        $gens[$idx2]['hari'] = $tempHari;
                        $gens[$idx2]['jam']  = $tempJam;
                        $waktu2 = $this->getSlotWaktu($gens[$idx2]['hari'], $gens[$idx2]['jam']);
                        $gens[$idx2]['jam_mulai'] = $waktu2['mulai'];
                        $gens[$idx2]['jam_selesai'] = $waktu2['selesai'];
                    }
                }
            }
        }
        unset($gens);

        return $kromosom;
    }
}