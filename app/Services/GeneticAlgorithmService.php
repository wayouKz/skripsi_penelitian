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
                $fitness = $this->hitungFitness($kromosom,true);
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

            if ($stagnantGenerations >= 15) {
                $currentMutationRate = min(0.8, $baseMutationRate * 3);
                $jumlahImigrant = (int) ($this->populasi * 0.2);
                $populasiBaruImigrant = $this->inisialisasiPopulasi();
                for ($imm = 0; $imm < min($jumlahImigrant, count($populasiBaruImigrant)); $imm++) {
                    $populasiSaatIni[$imm] = $this->repairKromosom($populasiBaruImigrant[$imm]);
                }
                $stagnantGenerations = 0;
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
        // --- POST-PROCESSING GLOBAL: RESOLUSI MUTLAK KELAS & GURU ---
        // =====================================================================
        if (!empty($bestKromosom)) {
            $matrixKelas = [];
            $matrixGuru = [];
            $konflikMapels = [];

            // 1. KUNCI SELURUH JADWAL YANG AMAN & CABUT YANG BENTROK
            foreach ($bestKromosom as $kelasId => &$gens) {
                foreach ($gens as $chunkId => $gen) {
                    $h = $gen['hari'];
                    $jm = $gen['jam_mulai'];
                    $dur = $gen['durasi'];
                    $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                    $isPenjaskes = $gen['is_penjaskes'] ?? false;
                    $isBentrok = false;

                    if (!$h || !$jm) {
                        $isBentrok = true;
                    } else {
                        $maxH = $this->getMaxJam($h);
                        for ($d = 0; $d < $dur; $d++) {
                            $jam = $jm + $d;

                            // Deteksi jika Kelas bentrok ATAU Guru sedang mengajar di kelas lain
                            if ($jam > $maxH ||
                                isset($matrixKelas[$kelasId][$h][$jam]) ||
                                (!$isPenjaskes && $guruId !== 'none' && isset($matrixGuru[$guruId][$h][$jam]))) {
                                $isBentrok = true;
                                break;
                            }
                        }
                    }

                    if ($isBentrok) {
                        $gen['kelas_id_asli'] = $kelasId;
                        $konflikMapels[$chunkId] = $gen; // Antrikan untuk dieksekusi ulang
                        unset($gens[$chunkId]);
                    } else {
                        // Kunci slot agar tidak disusupi mapel lain
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

            // Urutkan jadwal bentrok dari durasi terpanjang agar didahulukan
            uasort($konflikMapels, function($a, $b) {
                return $b['durasi'] <=> $a['durasi'];
            });

            // 2. TANAM ULANG JADWAL YANG TERCABUT
            foreach ($konflikMapels as $chunkId => $gen) {
                $kelasId = $gen['kelas_id_asli'];
                $dur = $gen['durasi'];
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;
                $ditemukan = false;

                // Percobaan 1: Cari blok waktu UTUH yang kosong untuk Guru dan Kelas
                foreach ($this->hari as $hariCoba) {
                    $maxH = $this->getMaxJam($hariCoba);
                    for ($jCoba = 1; $jCoba <= ($maxH - $dur + 1); $jCoba++) {
                        $slotAman = true;

                        for ($d = 0; $d < $dur; $d++) {
                            $jam = $jCoba + $d;
                            if (isset($matrixKelas[$kelasId][$hariCoba][$jam]) ||
                                (!$isPenjaskes && $guruId !== 'none' && isset($matrixGuru[$guruId][$hariCoba][$jam]))) {
                                $slotAman = false;
                                break;
                            }
                        }

                        if ($slotAman) {
                            $gen['hari'] = $hariCoba;
                            $gen['jam_mulai'] = $jCoba;

                            for ($d = 0; $d < $dur; $d++) {
                                $jam = $jCoba + $d;
                                $matrixKelas[$kelasId][$hariCoba][$jam] = true;
                                if (!$isPenjaskes && $guruId !== 'none') {
                                    $matrixGuru[$guruId][$hariCoba][$jam] = true;
                                }
                            }

                            unset($gen['kelas_id_asli']);
                            $bestKromosom[$kelasId][$chunkId] = $gen;
                            $ditemukan = true;
                            break 2;
                        }
                    }
                }

                // Percobaan 2: FITUR PECAH BLOK (SPLIT CHUNK)
                // Jika blok UTUH tidak ditemukan, sistem akan memecahnya jadi pecahan 1 jam agar bisa diselipkan
                if (!$ditemukan && $dur > 1) {
                    $sisaDurasi = $dur;
                    while ($sisaDurasi > 0) {
                        $potonganDitemukan = false;

                        foreach ($this->hari as $hariCoba) {
                            $maxH = $this->getMaxJam($hariCoba);
                            for ($jCoba = 1; $jCoba <= $maxH; $jCoba++) {
                                // Cari 1 slot jam yang Kelas dan Gurunya sedang kosong
                                if (!isset($matrixKelas[$kelasId][$hariCoba][$jCoba]) &&
                                    ($isPenjaskes || $guruId === 'none' || !isset($matrixGuru[$guruId][$hariCoba][$jCoba]))) {

                                    // Kunci slot ini
                                    $matrixKelas[$kelasId][$hariCoba][$jCoba] = true;
                                    if (!$isPenjaskes && $guruId !== 'none') {
                                        $matrixGuru[$guruId][$hariCoba][$jCoba] = true;
                                    }

                                    // Buat gen baru dengan durasi 1
                                    $pecahanGen = $gen;
                                    $pecahanGen['hari'] = $hariCoba;
                                    $pecahanGen['jam_mulai'] = $jCoba;
                                    $pecahanGen['durasi'] = 1;
                                    unset($pecahanGen['kelas_id_asli']);

                                    // Masukkan pecahan ini ke kromosom
                                    $newChunkId = $chunkId . '_split_' . $sisaDurasi;
                                    $bestKromosom[$kelasId][$newChunkId] = $pecahanGen;

                                    $potonganDitemukan = true;
                                    $sisaDurasi--;
                                    break 2; // Lanjut pecahkan sisa durasi selanjutnya
                                }
                            }
                        }

                        if (!$potonganDitemukan) {
                            Log::error("CRITICAL OVERLOAD: Jam seminggu untuk Kelas {$kelasId} atau Guru {$guruId} sudah full!");
                            break;
                        }
                    }
                } elseif (!$ditemukan && $dur == 1) {
                    // Jika durasi 1 jam saja ditolak, artinya database jam mengajar sekolah tsb melebihi kapasitas jam seminggu
                    Log::error("Jadwal Kepenuhan Mutlak di Kelas {$kelasId} untuk Guru {$guruId}");
                }
            }
        }
        // =====================================================================

        // --- MAPPING FLAT JADWAL ---
        $flatJadwal = [];
        if (!empty($bestKromosom)) {
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
            $gId = $gm->guru_id ?? $gm->nip ?? 'none';
            if ($gId !== 'none') {
                $totalBebanGuru[$gId] = ($totalBebanGuru[$gId] ?? 0) + (int) $gm->beban_jam;
            }
        }

        $kelasArray = $this->kelas instanceof \Illuminate\Support\Collection
            ? $this->kelas->all()
            : (array) $this->kelas;

        for ($i = 0; $i < $this->populasi; $i++) {
            $kromosom = [];
            $matrixGuru = [];

            $shuffledKelasArray = $kelasArray;
            shuffle($shuffledKelasArray);

            foreach ($shuffledKelasArray as $kls) {
                $kelasId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
                if (!$kelasId) continue;

                $mapelKelas = $guruMapelPerKelas[$kelasId] ?? [];
                if (empty($mapelKelas)) continue;

                $kromosom[$kelasId] = [];

                $matrixKelas = [];
                foreach ($this->hari as $h) {
                    $maxH = $this->getMaxJam($h);
                    for ($jm = 1; $jm <= $maxH; $jm++) {
                        $matrixKelas[$h][$jm] = false;
                    }
                }

                usort($mapelKelas, function($a, $b) {
                    return (int) $b->beban_jam <=> (int) $a->beban_jam;
                });

                foreach ($mapelKelas as $gm) {
                    $bebanSeharusnya = (int) $gm->beban_jam;
                    if ($bebanSeharusnya <= 0) continue;

                    $namaMapelLower = strtolower($gm->nama_mapel ?? '');
                    $isPenjaskes = str_contains($namaMapelLower, 'penjaskes') || str_contains($namaMapelLower, 'penjas') || str_contains($namaMapelLower, 'olahraga');
                    $guruId = !empty($gm->guru_id) ? 'g_' . $gm->guru_id : (!empty($gm->nip) ? 'n_' . $gm->nip : 'none');

                    // Pecah beban menjadi blok (maksimal 3 jam, sisa akhir bisa 1 atau 2 jam agar pas)
                    $chunks = [];
                    $sisaJam = $bebanSeharusnya;
                    while ($sisaJam > 0) {
                        $durasiBlok = ($sisaJam > 3) ? 3 : $sisaJam;
                        if ($sisaJam == 4) {
                            $durasiBlok = 2; // Hindari sisa 1 jam terakhir yang kaku
                        }
                        $chunks[] = $durasiBlok;
                        $sisaJam -= $durasiBlok;
                    }

                    foreach ($chunks as $chunkIndex => $durasiChunk) {
                        $chunkId = 'gm_' . $gm->id . '_block_' . $chunkIndex;
                        $assignedHari = null;
                        $assignedJam = null;

                        $hariAcak = $this->hari;
                        shuffle($hariAcak);

                        // Cari slot kosong berurutan
                        foreach ($hariAcak as $hari) {
                            $maxH = $this->getMaxJam($hari);
                            for ($jm = 1; $jm <= ($maxH - $durasiChunk + 1); $jm++) {
                                $bisa = true;
                                for ($d = 0; $d < $durasiChunk; $d++) {
                                    $jamCek = $jm + $d;
                                    $guruBentrok = (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]));

                                    if ($matrixKelas[$hari][$jamCek] || $guruBentrok) {
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

                        // Fallback 1: Abaikan guru asal kelas kosong
                        if (!$assignedHari) {
                            foreach ($hariAcak as $hari) {
                                $maxH = $this->getMaxJam($hari);
                                for ($jm = 1; $jm <= ($maxH - $durasiChunk + 1); $jm++) {
                                    $bisa = true;
                                    for ($d = 0; $d < $durasiChunk; $d++) {
                                        if ($matrixKelas[$hari][$jm + $d]) {
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
                        }

                        // Fallback Ekstrem 2: Paksa isi slot kosong pertama manapun yang tersedia (durasi disesuaikan sisa slot)
                        if (!$assignedHari) {
                            foreach ($this->hari as $hari) {
                                $maxH = $this->getMaxJam($hari);
                                for ($jm = 1; $jm <= $maxH; $jm++) {
                                    if (!$matrixKelas[$hari][$jm]) {
                                        $assignedHari = $hari;
                                        $assignedJam = $jm;
                                        $durasiChunk = 1; // Paksa 1 jam agar tidak ada yang terbuang
                                        break 2;
                                    }
                                }
                            }
                        }

                        if ($assignedHari && $assignedJam) {
                            for ($d = 0; $d < $durasiChunk; $d++) {
                                $jamCek = $assignedJam + $d;
                                if (isset($matrixKelas[$assignedHari][$jamCek])) {
                                    $matrixKelas[$assignedHari][$jamCek] = true;
                                }
                                if (!$isPenjaskes && $guruId !== 'none') {
                                    $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                                }
                            }

                            $kromosom[$kelasId][$chunkId] = [
                                'guru_id'              => $gm->guru_id ?? null,
                                'nip'                  => $gm->nip ?? null,
                                't_list_guru_mapel_id' => $gm->id,
                                'blok_id'              => $chunkId,
                                'mapel_id'             => $gm->mapel_id,
                                'nama_mapel'           => $gm->nama_mapel,
                                'nama_guru'            => $gm->nama_guru,
                                'kelas_id'             => $kelasId,
                                'hari'                 => $assignedHari,
                                'jam_mulai'            => (int) $assignedJam,
                                'durasi'               => (int) $durasiChunk,
                                'is_penjaskes'         => $isPenjaskes
                            ];
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

        $trackerGuru = [];
        $trackerKelas = [];
        $trackerMapelHarian = [];

        // Variabel Debug
        $penaltyGuru = 0;
        $penaltyKelas = 0;
        $penaltyMapel = 0;
        $penaltyGenCacat = 0;
        $msg = "";

        foreach ($kromosom as $kelasId => $gens) {
            foreach ($gens as $gen) {
                $hari = $gen['hari'] ?? null;
                $jamMulai = $gen['jam_mulai'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $mapelId = $gen['mapel_id'] ?? null;

                $namaMapel = $gen['nama_mapel'] ?? 'Unknown'; // Untuk mempermudah baca log

                // PENALTI ERROR FATAL (Gen cacat)
                if (!$hari || !$jamMulai) {
                    $penalty += 5000.0;
                    $penaltyGenCacat += 5000.0;
                    $msg .= "[CACAT] Kelas $kelasId, Mapel $namaMapel tidak punya hari/jam.\n";
                    continue;
                }

                // SOFT CONSTRAINT: Penalti Sebaran Mapel
                if ($mapelId) {
                    if (!isset($trackerMapelHarian[$kelasId][$mapelId][$hari])) {
                        $trackerMapelHarian[$kelasId][$mapelId][$hari] = 0;
                    }
                    $trackerMapelHarian[$kelasId][$mapelId][$hari]++;

                    if ($trackerMapelHarian[$kelasId][$mapelId][$hari] > 1) {
                        $penalty += 50.0;
                        $penaltyMapel += 50.0;
                        $msg .= "[SEBARAN] Kelas $kelasId: Mapel $namaMapel menumpuk di hari $hari.\n";
                    }
                }

                for ($d = 0; $d < $durasi; $d++) {
                    $jam = $jamMulai + $d;

                    // Lewat dari jam batas sekolah
                    if ($jam > ($this->maxJamPerHari[$hari] ?? 12) || $jam < 1) {
                        $penalty += 1000.0;
                        $penaltyKelas += 1000.0;
                        $msg .= "[OUT OF BOUNDS] Kelas $kelasId: Jam ke-$jam di hari $hari melebihi batas.\n";
                    }

                    // TUMPANG TINDIH KELAS
                    if (isset($trackerKelas[$kelasId][$hari][$jam])) {
                        $penalty += 2000.0;
                        $penaltyKelas += 2000.0;
                        $msg .= "[BENTROK KELAS] Kelas $kelasId: Slot Hari $hari Jam ke-$jam bertumpuk.\n";
                    } else {
                        $trackerKelas[$kelasId][$hari][$jam] = true;
                    }

                    // BENTROK GURU
                    if ($guruId !== 'none' && !($gen['is_penjaskes'] ?? false)) {
                        if (isset($trackerGuru[$guruId][$hari][$jam])) {
                            $penalty += 1000.0;
                            $penaltyGuru += 1000.0;
                            $msg .= "[BENTROK GURU] Guru $guruId mengajar di 2 tempat pada Hari $hari Jam ke-$jam.\n";
                        } else {
                            $trackerGuru[$guruId][$hari][$jam] = true;
                        }
                    }
                }
            }
        }

        // PENALTI GAP JAM KOSONG
       foreach ($trackerKelas as $kelasId => $hariList) {
            foreach ($hariList as $hariCek => $jamList) {
                if (empty($jamList)) continue;
                $jams = array_keys($jamList);
                $minJ = min($jams);
                $maxJ = max($jams);
                $terisi = count($jams);
                $seharusnya = $maxJ - $minJ + 1;

                if ($terisi < $seharusnya) {
                    $gaps = $seharusnya - $terisi;

                    // NAIKKAN BOBOT PENALTI MENJADI 100
                    // Agar algoritma lebih memilih merapatkan jadwal dan mendorong jam kosong ke waktu pulang
                    $penalty += ($gaps * 100.0);
                    $penaltyKelas += ($gaps * 100.0);
                    $msg .= "[GAP KOSONG] Kelas $kelasId di Hari $hariCek ada $gaps jam bolong.\n";
                }
            }
        }

        $fitness = 1000.0 / (1000.0 + $penalty);
        $finalFitness = max(0.0001, round($fitness, 6));

        // TAMPILKAN HASIL DEBUG JIKA ISDEBUG = TRUE
        if ($isDebug) {
            // Catat ke log file Laravel (Opsional, agar bisa dibaca di storage/logs/laravel.log)
            \Log::debug("=== DEBUG FITNESS KROMOSOM ===");
            \Log::debug("Total Penalti: " . $penalty);
            \Log::debug("Rincian -> Gen Cacat: $penaltyGenCacat, Kelas: $penaltyKelas, Guru: $penaltyGuru, Mapel Harian: $penaltyMapel");
            if (!empty($msg)) {
                \Log::debug("Log Pesan:\n" . $msg);
            }

            // Kembalikan array agar bisa di-dd() atau dieksplor saat pengujian
            // return [
            //     'fitness'       => $finalFitness,
            //     'total_penalty' => $penalty,
            //     'rincian'       => [
            //         'gen_cacat'    => $penaltyGenCacat,
            //         'kelas'        => $penaltyKelas,
            //         'guru'         => $penaltyGuru,
            //         'mapel_harian' => $penaltyMapel
            //     ],
            //     'log_pesan'     => explode("\n", trim($msg)) // Jadikan array of string agar mudah dibaca
            // ];
        }

        return $finalFitness;
    }

            private function repairKromosom($kromosom)
            {
                $matrixGuru = [];
                $unassignedQueue = [];

                // Identifikasi & copot jadwal yang bentrok
                foreach ($kromosom as $kelasId => &$gens) {
                    $sisaGens = [];
                    $matrixKelasKelas = [];

                    foreach ($gens as $chunkId => $gen) {
                        $hari = $gen['hari'] ?? null;
                        $jamMulai = $gen['jam_mulai'] ?? null;
                        $durasi = $gen['durasi'] ?? 0;
                        $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                        $isPenjaskes = $gen['is_penjaskes'] ?? false;
                        $isBentrok = false;

                        if ($hari && $jamMulai && $durasi > 0) {
                            $maxH = $this->getMaxJam($hari);
                            for ($d = 0; $d < $durasi; $d++) {
                                $jamCek = $jamMulai + $d;
                                if ($jamCek > $maxH ||
                                    !empty($matrixKelasKelas[$hari][$jamCek]) ||
                                    (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]))) {
                                    $isBentrok = true;
                                    break;
                                }
                            }
                        } else {
                            $isBentrok = true;
                        }

                        if ($isBentrok) {
                            // Simpan mapel bentrok dan juga SIMPAN posisi lamanya sbg fallback
                            $unassignedQueue[] = ['kelasId' => $kelasId, 'chunkId' => $chunkId, 'gen' => $gen, 'fallback' => $gen];
                        } else {
                            for ($d = 0; $d < $durasi; $d++) {
                                $matrixKelasKelas[$hari][$jamMulai + $d] = true;
                                if (!$isPenjaskes && $guruId !== 'none') {
                                    $matrixGuru[$guruId][$hari][$jamMulai + $d] = true;
                                }
                            }
                            $sisaGens[$chunkId] = $gen;
                        }
                    }
                    $gens = $sisaGens;
                }
                unset($gens);

                // Usaha selipkan kembali ke posisi aman
                foreach ($kromosom as $kelasId => &$gens) {
                    $matrixKelasKelas = [];
                    foreach ($gens as $gen) {
                        $h = $gen['hari'] ?? null;
                        $jm = $gen['jam_mulai'] ?? null;
                        $dur = $gen['durasi'] ?? 0;
                        if (!$h || !$jm) continue;
                        for ($d = 0; $d < $dur; $d++) {
                            $matrixKelasKelas[$h][$jm + $d] = true;
                        }
                    }

                    foreach ($unassignedQueue as $index => $item) {
                        if ($item['kelasId'] !== $kelasId) continue;

                        $chunkId = $item['chunkId'];
                        $gen = $item['gen'];
                        $durasi = $gen['durasi'];
                        $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                        $isPenjaskes = $gen['is_penjaskes'] ?? false;
                        $ditemukan = false;

                        foreach ($this->hari as $hariCoba) {
                            $maxH = $this->getMaxJam($hariCoba);
                            for ($jm = 1; $jm <= ($maxH - $durasi + 1); $jm++) {
                                $slotAman = true;
                                for ($d = 0; $d < $durasi; $d++) {
                                    $jCek = $jm + $d;
                                    if (!empty($matrixKelasKelas[$hariCoba][$jCek]) ||
                                        (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jCek]))) {
                                        $slotAman = false;
                                        break;
                                    }
                                }

                                if ($slotAman) {
                                    $gen['hari'] = $hariCoba;
                                    $gen['jam_mulai'] = $jm;
                                    for ($d = 0; $d < $durasi; $d++) {
                                        $matrixKelasKelas[$hariCoba][$jm + $d] = true;
                                        if (!$isPenjaskes && $guruId !== 'none') {
                                            $matrixGuru[$guruId][$hariCoba][$jm + $d] = true;
                                        }
                                    }
                                    $gens[$chunkId] = $gen;
                                    $ditemukan = true;
                                    unset($unassignedQueue[$index]);
                                    break 2;
                                }
                            }
                        }

                        // JIKA GAGAL: Jangan lempar acak! Kembalikan ke titik asalnya.
                        // Biarkan mutasi random yang memperbaikinya, jangan dirusak oleh fungsi repair.
                                                // JIKA GAGAL DAPAT SLOT 100% AMAN, coba cari slot di mana MINIMAL KELASNYA KOSONG (relakan guru bentrok sementara)
                      // Jika gagal mendapatkan slot aman 100%, cari slot kelas kosong terdekat
                        if (!$ditemukan) {
                            $slotSemiAman = false;
                            foreach ($this->hari as $hariCoba) {
                                $maxH = $this->getMaxJam($hariCoba);
                                for ($jm = 1; $jm <= ($maxH - $durasi + 1); $jm++) {
                                    $kelasAman = true;
                                    for ($d = 0; $d < $durasi; $d++) {
                                        if (!empty($matrixKelasKelas[$hariCoba][$jm + $d])) {
                                            $kelasAman = false;
                                            break;
                                        }
                                    }
                                    if ($kelasAman) {
                                        $gen['hari'] = $hariCoba;
                                        $gen['jam_mulai'] = $jm;
                                        $gens[$chunkId] = $gen;

                                        for ($d = 0; $d < $durasi; $d++) {
                                            $matrixKelasKelas[$hariCoba][$jm + $d] = true;
                                        }
                                        $slotSemiAman = true;
                                        break 2;
                                    }
                                }
                            }

                            // JAMINAN 100%: Jika benar-benar padat total, kembalikan ke posisi fallback lamanya, JANGAN DIHAPUS
                            if (!$slotSemiAman) {
                                $fallbackGen = $item['fallback'];
                                $fHari = $fallbackGen['hari'];
                                $fJam = $fallbackGen['jam_mulai'];
                                $fDur = $fallbackGen['durasi'];

                                $gens[$chunkId] = $fallbackGen;
                                for ($d = 0; $d < $fDur; $d++) {
                                    $matrixKelasKelas[$fHari][$fJam + $d] = true;
                                }
                            }
                            unset($unassignedQueue[$index]);
                        }
                    }
                }
                unset($gens);

                return $kromosom;
            }

            private function seleksi($fitnessPopulasi)
            {
                // Diperlunak jadi 3 (dari 5) agar gen minoritas berpeluang hidup dan tidak prematur konvergen
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
                $child = [];
                $allKelasIds = array_unique(array_merge(array_keys($parent1), array_keys($parent2)));

                foreach ($allKelasIds as $kelasId) {
                    $gens1 = $parent1[$kelasId] ?? [];
                    $gens2 = $parent2[$kelasId] ?? [];

                    if (empty($gens1)) { $child[$kelasId] = $gens2; continue; }
                    if (empty($gens2)) { $child[$kelasId] = $gens1; continue; }

                    $child[$kelasId] = [];
                    $allChunkIds = array_unique(array_merge(array_keys($gens1), array_keys($gens2)));

                    foreach ($allChunkIds as $chunkId) {
                        if (isset($gens1[$chunkId]) && isset($gens2[$chunkId])) {
                            $child[$kelasId][$chunkId] = (mt_rand(0, 1) === 1) ? $gens1[$chunkId] : $gens2[$chunkId];
                        } else {
                            $child[$kelasId][$chunkId] = $gens1[$chunkId] ?? $gens2[$chunkId];
                        }
                    }
                }
                return $child;
            }

   private function mutasi($kromosom)
    {
        if ((mt_rand() / mt_getrandmax()) > $this->mutationRate) return $kromosom;

        // Gunakan array asosiatif untuk mencegah duplikasi jika 1 mapel bentrok berkali-kali
        $bentrokChunks = [];
        $trackerGuru = [];
        $trackerKelas = [];
        $trackerMapel = []; // Pelacak Sebaran Mapel

        // 1. Identifikasi SPESIFIK mapel mana saja yang sedang bentrok / menumpuk
        foreach ($kromosom as $kId => $gens) {
            foreach ($gens as $cId => $gen) {
                $h = $gen['hari'] ?? null;
                $jm = $gen['jam_mulai'] ?? null;
                $dur = $gen['durasi'] ?? 0;
                $gId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;
                $mapelId = $gen['mapel_id'] ?? null;

                if (!$h || !$jm) continue;

                $keyMapelSaatIni = $kId . '|' . $cId;

                // CEK SEBARAN MAPEL: Mencegah mapel yang sama muncul 2x di hari yang sama
                if ($mapelId) {
                    if (isset($trackerMapel[$kId][$mapelId][$h])) {
                        // Masukkan KEDUANYA ke daftar mutasi
                        $bentrokChunks[$keyMapelSaatIni] = ['kelasId' => $kId, 'chunkId' => $cId, 'durasi' => $dur];

                        $idGenLamaMapel = $trackerMapel[$kId][$mapelId][$h];
                        $bentrokChunks[$kId . '|' . $idGenLamaMapel] = [
                            'kelasId' => $kId,
                            'chunkId' => $idGenLamaMapel,
                            'durasi'  => $kromosom[$kId][$idGenLamaMapel]['durasi'] ?? 1
                        ];
                    } else {
                        $trackerMapel[$kId][$mapelId][$h] = $cId;
                    }
                }

                for ($d = 0; $d < $dur; $d++) {
                    $jam = $jm + $d;

                    // Cek bentrok kelas
                    if (isset($trackerKelas[$kId][$h][$jam])) {
                        // Target 1: Masukkan mapel yang sedang diproses
                        $bentrokChunks[$keyMapelSaatIni] = ['kelasId' => $kId, 'chunkId' => $cId, 'durasi' => $dur];

                        // Target 2: Masukkan mapel LAMA yang sudah lebih dulu menduduki slot ini (Menghilangkan Bias)
                        $idGenLamaKelas = $trackerKelas[$kId][$h][$jam];
                        $bentrokChunks[$kId . '|' . $idGenLamaKelas] = [
                            'kelasId' => $kId,
                            'chunkId' => $idGenLamaKelas,
                            'durasi'  => $kromosom[$kId][$idGenLamaKelas]['durasi'] ?? 1
                        ];
                    } else {
                        // Simpan ID mapelnya, bukan sekadar 'true'
                        $trackerKelas[$kId][$h][$jam] = $cId;
                    }

                    // Cek bentrok guru
                    if (!$isPenjaskes && $gId !== 'none') {
                        if (isset($trackerGuru[$gId][$h][$jam])) {
                            // Target 1: Masukkan mapel yang sedang diproses
                            $bentrokChunks[$keyMapelSaatIni] = ['kelasId' => $kId, 'chunkId' => $cId, 'durasi' => $dur];

                            // Target 2: Masukkan mapel LAMA yang gurunya ditarik ke kelas lain
                            $lama = $trackerGuru[$gId][$h][$jam];
                            $bentrokChunks[$lama['kelasId'] . '|' . $lama['chunkId']] = [
                                'kelasId' => $lama['kelasId'],
                                'chunkId' => $lama['chunkId'],
                                'durasi'  => $kromosom[$lama['kelasId']][$lama['chunkId']]['durasi'] ?? 1
                            ];
                        } else {
                            // Simpan informasi lengkap siapa yang menggunakan guru ini
                            $trackerGuru[$gId][$h][$jam] = ['kelasId' => $kId, 'chunkId' => $cId];
                        }
                    }
                }
            }
        }

        // Kembalikan ke index numerik biasa
        $bentrokList = array_values($bentrokChunks);

        // 2. EKSEKUSI MUTASI PADA TARGET YANG BENTROK/MENUMPUK
        if (!empty($bentrokList)) {
            shuffle($bentrokList);

            // Ambil maksimal 5 mapel yang bermasalah untuk ditendang ke slot lain
            $jumlahPindah = min(count($bentrokList), mt_rand(2, 5));

            for ($i = 0; $i < $jumlahPindah; $i++) {
                $target = $bentrokList[$i];
                $kId = $target['kelasId'];
                $cId = $target['chunkId'];
                $dur = $target['durasi'];

                $hariAcak = $this->hari[array_rand($this->hari)];

                // Lempar ke hari dan jam acak (sesuai gerbang) yang baru
                $kromosom[$kId][$cId]['hari'] = $hariAcak;
                $kromosom[$kId][$cId]['jam_mulai'] = $this->getValidStartJam($hariAcak, $dur);
            }
        } else {
            // 3. Jika sudah 0 bentrok & sebaran rapi, geser 1 mapel acak untuk eksplorasi (merapatkan jadwal)
            $kelasKeys = array_keys($kromosom);
            if (empty($kelasKeys)) return $kromosom;

            $randomKelasId = $kelasKeys[array_rand($kelasKeys)];
            if (empty($kromosom[$randomKelasId])) return $kromosom;

            $chunkIds = array_keys($kromosom[$randomKelasId]);
            $randomChunkId = $chunkIds[array_rand($chunkIds)];

            $hariAcak = $this->hari[array_rand($this->hari)];
            $durasi = $kromosom[$randomKelasId][$randomChunkId]['durasi'] ?? 1;

            $kromosom[$randomKelasId][$randomChunkId]['hari'] = $hariAcak;
            $kromosom[$randomKelasId][$randomChunkId]['jam_mulai'] = $this->getValidStartJam($hariAcak, $durasi);
        }

        return $kromosom;
    }
    private function getValidStartJam($hari, $durasi)
    {
        $maxJam = $this->getMaxJam($hari);
        $validStarts = [];

        // Gerbang utama blok jadwal (memaksa pola 3-3-3-3 atau 3-3-3-2)
        $polaDasar = [1, 4, 7, 10];

        foreach ($polaDasar as $start) {
            // Pastikan ujung blok tidak menabrak batas maksimal jam pulang sekolah
            if (($start + $durasi - 1) <= $maxJam) {
                $validStarts[] = $start;
            }
        }

        // Fallback jika pola dasar tidak muat (sangat jarang terjadi jika data mapel normal)
        if (empty($validStarts)) {
            return mt_rand(1, max(1, $maxJam - $durasi + 1));
        }

        // Pilih salah satu "gerbang" secara acak
        return $validStarts[array_rand($validStarts)];
    }
}
