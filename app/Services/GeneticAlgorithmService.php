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
        $this->populasi = $params['populasi'] ?? 100;
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
        return $this->maxJamPerHari[$hari] ?? 11;
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
        $lastBestFitness = -999999.0;

        // --- ADAPTIVE MUTATION SETUP ---
        $currentMutationRate = $this->mutationRate ?? 0.1; // Ambil nilai awal dari properti kelas (default 0.1 / 10%)
        $baseMutationRate = $currentMutationRate;

        while ($generasi < $this->maxGenerasi) {
            $fitnessPopulasi = [];
            foreach ($populasiSaatIni as $kromosom) {
                $fitness = $this->hitungFitness($kromosom,true);
                $fitnessPopulasi[] = ['kromosom' => $kromosom, 'fitness' => $fitness];

                if ($fitness > $bestFitness) {
                    $bestFitness = $fitness;
                    $bestKromosom = $kromosom;
                }
            }

            if ($bestFitness > $lastBestFitness) {
                $lastBestFitness = $bestFitness;
                $stagnantGenerations = 0; // Reset hitungan macet
            } else {
                $stagnantGenerations++;
            }

            // --- LOGIKA ADAPTIVE MUTATION RATE ---
            // Jika dalam 15 generasi berturut-turut fitness tidak meningkat (mandek)
            if ($stagnantGenerations >= 15) {
                // Naikkan tingkat mutasi secara agresif agar keluar dari titik jenuh (maksimal 40%)
                $currentMutationRate = min(0.4, $baseMutationRate * 3);
                Log::info("Algoritme macet di gen {$generasi}. Adaptive Mutation diaktifkan: rate naik menjadi {$currentMutationRate}");
                $stagnantGenerations = 0; // Reset counter agar ada jeda sebelum naik lagi jika masih mandek
            } else {
                // Turunkan perlahan kembali mendekati nilai dasar jika sudah mulai stabil
                $currentMutationRate = max($baseMutationRate, $currentMutationRate * 0.95);
            }

            if (is_callable($this->onGenerationComplete)) {
                ($this->onGenerationComplete)($generasi, $bestFitness);
            }


            $populasiBaru = [];
            if (!empty($bestKromosom)) {
                // Elitism wajib di-repair juga agar steril
                $populasiBaru[] = $this->repairKromosom($bestKromosom);
            }

            $sisaPopulasi = $this->populasi - count($populasiBaru);
            for ($i = 0; $i < $sisaPopulasi; $i++) {
                $parent1 = $this->seleksi($fitnessPopulasi);
                $parent2 = $this->seleksi($fitnessPopulasi);

                $child = $this->crossover($parent1, $parent2);

                // Gunakan $currentMutationRate yang dinamis di sini
                // (Pastikan fungsi mutasi di kelas Anda menerima parameter rate, atau set sementara ke properti)
                $this->mutationRate = $currentMutationRate;
                $child = $this->mutasi($child);

                // REPAIR WAJIB SETELAH CROSSOVER & MUTASI
                $child = $this->repairKromosom($child);

                $populasiBaru[] = $child;
            }
            if ($bestFitness >= 0.999 || $stagnantGenerations >= $this->maxGenerasi) break;

            $populasiSaatIni = $populasiBaru;
            $generasi++;
        }


        // [Bagian bawah untuk mapping $flatJadwal tetap seperti semula]
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

    // 1. HITUNG TOTAL BEBAN JAM MENGAJAR TIAP GURU & CEK KAPASITAS KELAS
    $totalBebanGuru = [];
    $guruMapelPerKelas = [];

    // Hitung total slot jam seminggu untuk validasi overkapasitas
    $totalSlotSeminggu = 0;
    foreach ($this->hari as $h) {
        $totalSlotSeminggu += $this->getMaxJam($h);
    }

    foreach ($guruMapelsArray as $gm) {
        $guruMapelPerKelas[$gm->kelas_id][] = $gm;

        $gId = $gm->guru_id ?? $gm->nip ?? 'none';
        if ($gId !== 'none') {
            $totalBebanGuru[$gId] = ($totalBebanGuru[$gId] ?? 0) + (int) $gm->beban_jam;
        }
    }

    // CEK DAN LOG JIKA ADA KELAS YANG OVERKAPASITAS (Beban Jam > Slot Waktu Seminggu)
    foreach ($guruMapelPerKelas as $kId => $mapels) {
        $totalBebanKelas = 0;
        foreach ($mapels as $m) {
            $totalBebanKelas += (int) $m->beban_jam;
        }
        if ($totalBebanKelas > $totalSlotSeminggu) {
            \Illuminate\Support\Facades\Log::critical("KAPASITAS KELAS {$kId} BERLEBIH: Total Beban = {$totalBebanKelas} jam, Slot Tersedia = {$totalSlotSeminggu} jam. Jadwal PASTI akan ditumpuk (Pass 4) dan jam terlihat hilang di tampilan!");
        }
    }

    $kelasArray = $this->kelas instanceof \Illuminate\Support\Collection
        ? $this->kelas->all()
        : (array) $this->kelas;

    $totalPopulasi = $this->populasi;

    for ($i = 0; $i < $totalPopulasi; $i++) {
        $kromosom = [];
        $matrixGuru = [];      // Global per kromosom
        $matrixKelasHari = []; // Melacak ketersediaan slot waktu setiap kelas

        foreach ($kelasArray as $kls) {
            $kelasId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
            if (!$kelasId) continue;

            foreach ($this->hari as $h) {
                $maxH = $this->getMaxJam($h);
                for ($jm = 1; $jm <= $maxH; $jm++) {
                    $matrixKelasHari[$kelasId][$h][$jm] = false;
                }
            }
        }

        $shuffledKelasArray = $kelasArray;
        shuffle($shuffledKelasArray);

        foreach ($shuffledKelasArray as $kls) {
            $kelasId = is_object($kls) ? ($kls->id ?? $kls->kelas_id ?? null) : $kls;
            if (!$kelasId) continue;

            $mapelKelas = $guruMapelPerKelas[$kelasId] ?? [];
            if (empty($mapelKelas)) continue;

            $kromosom[$kelasId] = [];
            $gmPriority = [];
            $gmRegular = [];

            foreach ($mapelKelas as $gm) {
                $namaMapelLower = strtolower($gm->nama_mapel ?? '');
                $isPenjaskes = str_contains($namaMapelLower, 'penjaskes') || str_contains($namaMapelLower, 'penjas') || str_contains($namaMapelLower, 'olahraga');

                if (!empty($gm->is_prioritas_pagi) || $isPenjaskes) {
                    $gmPriority[] = $gm;
                } else {
                    $gmRegular[] = $gm;
                }
            }

            // SORTING BERDASARKAN TOTAL BEBAN GURU
            usort($gmRegular, function($a, $b) use ($totalBebanGuru) {
                $gIdA = $a->guru_id ?? $a->nip ?? 'none';
                $gIdB = $b->guru_id ?? $b->nip ?? 'none';
                $bebanA = $totalBebanGuru[$gIdA] ?? 0;
                $bebanB = $totalBebanGuru[$gIdB] ?? 0;

                if ($bebanA !== $bebanB) return $bebanB <=> $bebanA;
                return (int) $b->beban_jam <=> (int) $a->beban_jam;
            });

            shuffle($gmPriority);
            $mapelKelasTerurut = array_merge($gmPriority, $gmRegular);

            foreach ($mapelKelasTerurut as $gm) {
                $bebanSeharusnya = (int) $gm->beban_jam;
                if ($bebanSeharusnya <= 0) continue;

                $namaMapelLower = strtolower($gm->nama_mapel ?? '');
                $isPenjaskes = str_contains($namaMapelLower, 'penjaskes') || str_contains($namaMapelLower, 'penjas') || str_contains($namaMapelLower, 'olahraga');

                $guruId = 'none';
                if (!empty($gm->guru_id)) {
                    $guruId = 'g_' . $gm->guru_id;
                } elseif (!empty($gm->nip)) {
                    $guruId = 'n_' . $gm->nip;
                }

                // PEMBAGIAN CHUNK
                $chunks = [];
                if ($bebanSeharusnya == 6) { $chunks = [3, 3]; }
                elseif ($bebanSeharusnya == 5) { $chunks = [3, 2]; }
                elseif ($bebanSeharusnya == 4) { $chunks = [2, 2]; }
                elseif ($bebanSeharusnya == 3) { $chunks = [3]; }
                elseif ($bebanSeharusnya == 2) { $chunks = [2]; }
                elseif ($bebanSeharusnya == 1) { $chunks = [1]; }
                else {
                    $sisa = $bebanSeharusnya;
                    while ($sisa > 0) {
                        if ($sisa > 6) { $chunks[] = 3; $sisa -= 3; }
                        elseif ($sisa == 6) { array_push($chunks, 3, 3); $sisa = 0; }
                        elseif ($sisa == 5) { array_push($chunks, 3, 2); $sisa = 0; }
                        elseif ($sisa == 4) { array_push($chunks, 2, 2); $sisa = 0; }
                        elseif ($sisa == 3) { $chunks[] = 3; $sisa = 0; }
                        elseif ($sisa == 2) { $chunks[] = 2; $sisa = 0; }
                    }
                }

                foreach ($chunks as $chunkIndex => $durasiChunk) {
                    $gmId = $gm->id;
                    $chunkId = 'gm_' . $gmId . '_block_' . $chunkIndex;

                    $hariAcak = $this->hari;
                    shuffle($hariAcak);

                    $assignedHari = null;
                    $assignedJam = null;
                    $metodePenempatan = 'NONE'; // Tracker untuk Log

                    // PASS 1: Cari Slot Ideal (Kelas & Guru Kosong)
                    foreach ($hariAcak as $hari) {
                        $maxH = $this->getMaxJam($hari);
                        $batasPencarian = ($isPenjaskes || !empty($gm->is_prioritas_pagi))
                            ? min(4, $maxH - $durasiChunk + 1)
                            : ($maxH - $durasiChunk + 1);

                        for ($jm = 1; $jm <= $batasPencarian; $jm++) {
                            if ($durasiChunk == 1 && $jm == $maxH) continue;

                            $bisa = true;
                            for ($d = 0; $d < $durasiChunk; $d++) {
                                $jamCek = $jm + $d;
                                $guruBentrok = (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]));

                                if (!empty($matrixKelasHari[$kelasId][$hari][$jamCek]) || $guruBentrok) {
                                    $bisa = false; break;
                                }
                            }

                            if ($bisa) {
                                $assignedHari = $hari;
                                $assignedJam = $jm;
                                $metodePenempatan = 'PASS 1';
                                break 2;
                            }
                        }
                    }

                    // PASS 2: Slot 1 Jam di Jam Terakhir
                    if (!$assignedHari && $durasiChunk == 1) {
                        foreach ($hariAcak as $hari) {
                            $maxH = $this->getMaxJam($hari);
                            $jm = $maxH;
                            $guruBentrok = (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jm]));

                            if (empty($matrixKelasHari[$kelasId][$hari][$jm]) && !$guruBentrok) {
                                $assignedHari = $hari;
                                $assignedJam = $jm;
                                $metodePenempatan = 'PASS 2';
                                break;
                            }
                        }
                    }

                    // PASS 3: Guru Bentrok (Abaikan Ketersediaan Guru, cari slot Kelas kosong)
                    if (!$assignedHari) {
                        foreach ($hariAcak as $hari) {
                            $maxH = $this->getMaxJam($hari);
                            $batasPencarian = $maxH - $durasiChunk + 1;

                            for ($jm = 1; $jm <= $batasPencarian; $jm++) {
                                $bisaKelasSaja = true;
                                for ($d = 0; $d < $durasiChunk; $d++) {
                                    if (!empty($matrixKelasHari[$kelasId][$hari][$jm + $d])) {
                                        $bisaKelasSaja = false; break;
                                    }
                                }
                                if ($bisaKelasSaja) {
                                    $assignedHari = $hari;
                                    $assignedJam = $jm;
                                    $metodePenempatan = 'PASS 3';
                                    break 2;
                                }
                            }
                        }
                    }

                    // PASS 4: Absolute Force (Slot Kelas HABIS, Timpa Paksa)
                    if (!$assignedHari) {
                        $assignedHari = $hariAcak[0];
                        $maxH = $this->getMaxJam($assignedHari);
                        $assignedJam = rand(1, max(1, $maxH - $durasiChunk + 1));
                        $metodePenempatan = 'PASS 4';
                    }

                    // --- PENCATATAN LOG ---
                    if ($metodePenempatan === 'PASS 3' && $i === 0) { // Log di kromosom pertama saja agar tidak spam
                        \Illuminate\Support\Facades\Log::warning("BENTROK GURU (Pass 3): Guru {$guruId} (Mapel: {$gm->nama_mapel}) dipaksa mengajar di Kelas {$kelasId} pada Hari {$assignedHari} Jam {$assignedJam}.");
                    } elseif ($metodePenempatan === 'PASS 4' && $i === 0) {
                        \Illuminate\Support\Facades\Log::error("JADWAL TERTUMPUK (Pass 4): Kelas {$kelasId} kepenuhan! Mapel {$gm->nama_mapel} (Durasi {$durasiChunk}) ditimpa paksa pada Hari {$assignedHari} Jam {$assignedJam}. Beban jam akan terlihat tidak sesuai di frontend!");
                    }

                    // SIMPAN KE MATRIKS SESUAI DURASI ASLINYA
                    for ($d = 0; $d < $durasiChunk; $d++) {
                        $jamCek = $assignedJam + $d;
                        $matrixKelasHari[$kelasId][$assignedHari][$jamCek] = true;
                        if (!$isPenjaskes && $guruId !== 'none') {
                            $matrixGuru[$guruId][$assignedHari][$jamCek] = true;
                        }
                    }

                    // SIMPAN KE KROMOSOM
                    $kromosom[$kelasId][$chunkId] = $this->buildKromosomData(
                        $gm, $chunkIndex, $kelasId, $assignedHari, $assignedJam, $durasiChunk, $isPenjaskes
                    );
                }
            }
        }
        $populasi[] = $kromosom;
    }

    return $populasi;
}
    private function buildKromosomData($gm, $chunkIndex, $kelasId, $hari, $jm, $durasi, $isPenjaskes) {
        return [
            'guru_id'              => $gm->guru_id ?? null,
            'nip'                  => $gm->nip ?? null,
            't_list_guru_mapel_id' => $gm->id,
            'blok_id'              => $gm->id . '_' . $chunkIndex,
            'mapel_id'             => $gm->mapel_id,
            'nama_mapel' => $gm->nama_mapel,
            'nama_guru' => $gm->nama_guru,
            'kelas_id'             => $kelasId,
            'hari'                 => $hari,
            'jam_mulai'            => (int) $jm,
            'durasi'               => (int) $durasi,
            'is_penjaskes'         => $isPenjaskes
        ];
    }
 private function hitungFitness($kromosom, $enableDetailedLog = false)
    {
        $penalty = 0;
        $penaltySlotKosong = 0;
        $penaltyKelebihanJam = 0;
        $penaltyBentrokKelas = 0;
        $penaltyBentrokGuru = 0;
        $penaltyHariKurangPenuh = 0;
        $penaltyPecahJam = 0;

        $trackerGuru = [];
        $trackerKelas = [];
        $akumulasiJamPerHari = [];
        $mapelTracker = [];

        // Array penyimpan detail masalah untuk Log
        $detailMasalah = [];

        foreach ($kromosom as $kelasId => $gens) {
            foreach ($gens as $gen) {
                $hari = $gen['hari'] ?? null;
                $jamMulai = $gen['jam_mulai'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                $mapelNama = $gen['nama_mapel'] ?? 'Unknown';

                // Ambil nama guru jika ada, jika tidak fallback ke guru_id
                $guruId = 'none';
                if (!empty($gen['guru_id'])) {
                    $guruId = 'g_' . $gen['guru_id'];
                } elseif (!empty($gen['nip'])) {
                    $guruId = 'n_' . $gen['nip'];
                }
                $guruNama = $gen['nama_guru'] ?? $guruId;

                if (!$hari || !$jamMulai) {
                    $penalty += 100.0;
                    $penaltySlotKosong += 100.0;
                    if ($enableDetailedLog) $detailMasalah[] = "[Slot Kosong] Mapel {$mapelNama} di Kelas {$kelasId} tidak memiliki hari/jam.";
                    continue;
                }

                if (!isset($akumulasiJamPerHari[$kelasId][$hari])) {
                    $akumulasiJamPerHari[$kelasId][$hari] = 0;
                }
                $akumulasiJamPerHari[$kelasId][$hari] += $durasi;

                // ========================================================
                // TRACKER PECAHAN JAM
                // ========================================================
                $identitasMapel = $gen['t_list_guru_mapel_id'] ?? ($guruId . '_' . ($gen['mapel_id'] ?? 'unknown'));

                if (!isset($mapelTracker[$kelasId][$identitasMapel])) {
                    $mapelTracker[$kelasId][$identitasMapel] = [
                        'nama_mapel' => $mapelNama,
                        'hari_mengajar' => []
                    ];
                }

                if (!in_array($hari, $mapelTracker[$kelasId][$identitasMapel]['hari_mengajar'])) {
                    $mapelTracker[$kelasId][$identitasMapel]['hari_mengajar'][] = $hari;
                }

                // Pengecekan Slot per Jam (Durasi)
                for ($d = 0; $d < $durasi; $d++) {
                    $jam = $jamMulai + $d;

                    // 1. Pengecekan kelebihan jam
                    if ($jam > ($this->maxJamPerHari[$hari] ?? 12) || $jam < 1) {
                        $penalty += 100.0;
                        $penaltyKelebihanJam += 100.0;
                        if ($enableDetailedLog) $detailMasalah[] = "[Lebih Jam] Kelas {$kelasId}, Hari {$hari} Jam {$jam} melampaui batas maksimal jam.";
                    }

                    // 2. Pengecekan Kelas Tertumpuk
                    if (isset($trackerKelas[$kelasId][$hari][$jam])) {
                        $penalty += 1000.0;
                        $penaltyBentrokKelas += 1000.0;
                        if ($enableDetailedLog) {
                            $mapelEksisting = $trackerKelas[$kelasId][$hari][$jam];
                            $detailMasalah[] = "[Bentrok Kelas] Kelas {$kelasId} bertumpuk: {$mapelNama} menimpa {$mapelEksisting} di Hari {$hari} Jam {$jam}.";
                        }
                    } else {
                        // Simpan nama mapel untuk log bentrok kelas yang lebih informatif
                        $trackerKelas[$kelasId][$hari][$jam] = $mapelNama;
                    }

                    // 3. Pengecekan Guru Bentrok
                    if ($guruId !== 'none') {
                        $isPenjaskes = $gen['is_penjaskes'] ?? false;
                        if (!$isPenjaskes) {
                            if (!isset($trackerGuru[$guruId][$hari][$jam])) {
                                $trackerGuru[$guruId][$hari][$jam] = [];
                            }

                            // Cek apakah kelas ini sudah masuk ke tracker guru
                            $kelasSudahAda = false;
                            foreach ($trackerGuru[$guruId][$hari][$jam] as $infoGuru) {
                                if ($infoGuru['kelas'] == $kelasId) {
                                    $kelasSudahAda = true;
                                    break;
                                }
                            }

                            if (!$kelasSudahAda) {
                                // Simpan struktur informasi lengkap untuk log
                                $trackerGuru[$guruId][$hari][$jam][] = [
                                    'kelas' => $kelasId,
                                    'mapel' => $mapelNama,
                                    'guru_nama' => $guruNama
                                ];
                            }

                            // Jika guru mengajar di lebih dari 1 kelas di jam yang sama
                            if (count($trackerGuru[$guruId][$hari][$jam]) > 1) {
                                $penalty += 800.0;
                                $penaltyBentrokGuru += 800.0;

                                if ($enableDetailedLog) {
                                    $rincianBentrok = [];
                                    foreach ($trackerGuru[$guruId][$hari][$jam] as $info) {
                                        $rincianBentrok[] = "{$info['mapel']} (Kls {$info['kelas']})";
                                    }
                                    $teksBentrok = implode(' BERSAMAAN DENGAN ', $rincianBentrok);
                                    $detailMasalah[] = "[Bentrok Guru] Guru {$guruNama} mengajar: {$teksBentrok} pada Hari {$hari} Jam {$jam}.";
                                }
                            }
                        }
                    }
                }
            }
        }

        // ========================================================
        // EVALUASI PENALTI PECAHAN JAM
        // ========================================================
        foreach ($mapelTracker as $kelasId => $mapels) {
            foreach ($mapels as $idMapel => $data) {
                $jumlahHari = count($data['hari_mengajar']);
                if ($jumlahHari > 2) {
                    $hukumanPecahan = ($jumlahHari - 2) * 500.0;
                    $penalty += $hukumanPecahan;
                    $penaltyPecahJam += $hukumanPecahan;
                    if ($enableDetailedLog) {
                        $hariTersebar = implode(', ', $data['hari_mengajar']);
                        $detailMasalah[] = "[Pecah Jam] Mapel {$data['nama_mapel']} di Kelas {$kelasId} tersebar berantakan di {$jumlahHari} hari ({$hariTersebar}).";
                    }
                }
            }
        }

        // 4. Pengecekan Hari Kurang Penuh
        foreach ($this->hari as $hariCek) {
            $maxJamHariIni = $this->getMaxJam($hariCek);
            foreach ($kromosom as $kelasId => $gens) {
                $totalTerisi = $akumulasiJamPerHari[$kelasId][$hariCek] ?? 0;
                if ($totalTerisi < $maxJamHariIni) {
                    $kekurangan = $maxJamHariIni - $totalTerisi;
                    $hukumanKurang = $kekurangan * 10.0;
                    $penalty += $hukumanKurang;
                    $penaltyHariKurangPenuh += $hukumanKurang;
                }
            }
        }

        // Cetak Rekap Singkat
        \Illuminate\Support\Facades\Log::info("DEBUG FITNESS -> Total: {$penalty} | Kosong: {$penaltySlotKosong} | Lbh Jam: {$penaltyKelebihanJam} | Bntrk Kls: {$penaltyBentrokKelas} | Bntrk Guru: {$penaltyBentrokGuru} | Pch Jam: {$penaltyPecahJam}");

        // CETAK LOG DETAIL
        if ($enableDetailedLog && count($detailMasalah) > 0) {
            // Kita reverse array lalu unique, agar log mengambil status bentrok terakhir yang paling lengkap (misal A bentrok B bentrok C)
            $uniqueMasalah = array_unique(array_reverse($detailMasalah));
            $logTeks = "=== DETAIL PELANGGARAN KROMOSOM ===\n" . implode("\n", $uniqueMasalah);
            \Illuminate\Support\Facades\Log::debug($logTeks);
        }

        $fitness = max(0.0001, 1.0 / (1.0 + ($penalty / 10.0)));
        return round($fitness, 4);
    }
 private function repairKromosom($kromosom)
    {
        $matrixGuru = [];
        $matrixKelas = [];
        $unassignedQueue = [];

        // Pass 1: Validasi slot yang ada, amankan yang tidak bentrok.
        foreach ($kromosom as $kelasId => &$gens) {
            $sisaGens = [];
            foreach ($gens as $chunkId => $gen) {
                $hari = $gen['hari'] ?? null;
                $jamMulai = $gen['jam_mulai'] ?? null;
                $durasi = $gen['durasi'] ?? 0;

                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                $isBentrok = false;

                if (!$hari || !$jamMulai || $durasi <= 0) {
                    $isBentrok = true;
                } else {
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamCek = $jamMulai + $d;
                        $cekGuruBentrok = (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hari][$jamCek]));

                        if ($jamCek > ($this->maxJamPerHari[$hari] ?? 12) || !empty($matrixKelas[$kelasId][$hari][$jamCek]) || $cekGuruBentrok) {
                            $isBentrok = true;
                            break;
                        }
                    }
                }

                if ($isBentrok) {
                    $unassignedQueue[] = ['kelasId' => $kelasId, 'chunkId' => $chunkId, 'gen' => $gen];
                } else {
                    for ($d = 0; $d < $durasi; $d++) {
                        $jamCek = $jamMulai + $d;
                        $matrixKelas[$kelasId][$hari][$jamCek] = true;
                        if (!$isPenjaskes && $guruId !== 'none') {
                            $matrixGuru[$guruId][$hari][$jamCek] = true;
                        }
                    }
                    $sisaGens[$chunkId] = $gen; // Simpan gen yang aman
                }
            }
            $gens = $sisaGens; // Perbarui gen kelas hanya dengan yang valid
        }
        unset($gens);

        // Sortir antrean yang gagal masuk berdasarkan durasi (Prioritaskan blok besar dulu)
        usort($unassignedQueue, function ($a, $b) {
            return ($b['gen']['durasi'] ?? 0) <=> ($a['gen']['durasi'] ?? 0);
        });

        // Pass 2: Eksekusi antrean unassigned dengan teknik Dynamic Splitting
        while (!empty($unassignedQueue)) {
            $item = array_shift($unassignedQueue);
            $kelasId = $item['kelasId'];
            $chunkId = $item['chunkId'];
            $gen = $item['gen'];
            $durasi = $gen['durasi'];
            $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
            $isPenjaskes = $gen['is_penjaskes'] ?? false;

            // Cari hari yang paling sedikit terisi untuk kelas ini (Distribusi merata)
            $jamTerisiPerHari = [];
            foreach ($this->hari as $h) {
                $totalJamHari = 0;
                $maxH = $this->getMaxJam($h);
                for ($jm = 1; $jm <= $maxH; $jm++) {
                    if (!empty($matrixKelas[$kelasId][$h][$jm])) {
                        $totalJamHari++;
                    }
                }
                $jamTerisiPerHari[$h] = $totalJamHari;
            }

            $hariList = $this->hari;
            usort($hariList, function ($h1, $h2) use ($jamTerisiPerHari) {
                return $jamTerisiPerHari[$h1] <=> $jamTerisiPerHari[$h2];
            });

            $ditemukan = false;

            // Coba pasang di hari kosong
            foreach ($hariList as $hariCoba) {
                $maxH = $this->getMaxJam($hariCoba);
                for ($jm = 1; $jm <= ($maxH - $durasi + 1); $jm++) {
                    $slotAman = true;
                    for ($d = 0; $d < $durasi; $d++) {
                        $jCek = $jm + $d;
                        $cekGuru = (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$hariCoba][$jCek]));

                        if (!empty($matrixKelas[$kelasId][$hariCoba][$jCek]) || $cekGuru) {
                            $slotAman = false;
                            break;
                        }
                    }

                    if ($slotAman) {
                        $gen['hari'] = $hariCoba;
                        $gen['jam_mulai'] = $jm;
                        for ($d = 0; $d < $durasi; $d++) {
                            $jCek = $jm + $d;
                            $matrixKelas[$kelasId][$hariCoba][$jCek] = true;
                            if (!$isPenjaskes && $guruId !== 'none') {
                                $matrixGuru[$guruId][$hariCoba][$jCek] = true;
                            }
                        }
                        $kromosom[$kelasId][$chunkId] = $gen;
                        $ditemukan = true;
                        break 2;
                    }
                }
            }

            // JIKA GAGAL MENEMUKAN SLOT (Bentrok): Lakukan Splitting atau Force Placement
            if (!$ditemukan) {
                if ($durasi > 1) {
                    // Pecah gen menjadi potongan lebih kecil (durasi dikurangi 1 dan sisa 1) agar muat di celah sempit
                    $gen1 = $gen;
                    $gen1['durasi'] = $durasi - 1;
                    $gen2 = $gen;
                    $gen2['durasi'] = 1;

                    // Masukkan kembali ke antrean untuk dicari ulang
                    array_unshift($unassignedQueue, ['kelasId' => $kelasId, 'chunkId' => $chunkId . '_s2', 'gen' => $gen2]);
                    array_unshift($unassignedQueue, ['kelasId' => $kelasId, 'chunkId' => $chunkId . '_s1', 'gen' => $gen1]);
                } else {
                    // Jika durasi sudah 1 dan tetap gagal (artinya guru bentrok di SEMUA slot kosong kelas ini),
                    // Paksa isi ke slot kelas yang kosong (abaikan bentrok guru) agar tidak ada nilai NULL.
                    // Algoritma Genetika (melalui fungsi Fitness) akan mengurus penaltinya dan memperbaikinya di generasi selanjutnya.
                    foreach ($this->hari as $hariCoba) {
                        $maxH = $this->getMaxJam($hariCoba);
                        for ($jm = 1; $jm <= $maxH; $jm++) {
                            if (empty($matrixKelas[$kelasId][$hariCoba][$jm])) {
                                $gen['hari'] = $hariCoba;
                                $gen['jam_mulai'] = $jm;

                                $matrixKelas[$kelasId][$hariCoba][$jm] = true;
                                if (!$isPenjaskes && $guruId !== 'none') {
                                    $matrixGuru[$guruId][$hariCoba][$jm] = true; // Akan dicatat bentrok
                                }

                                $kromosom[$kelasId][$chunkId] = $gen;
                                break 2;
                            }
                        }
                    }
                }
            }
        }

        return $kromosom;
    }
    private function seleksi($fitnessPopulasi)
    {
        $k1 = $fitnessPopulasi[array_rand($fitnessPopulasi)];
        $k2 = $fitnessPopulasi[array_rand($fitnessPopulasi)];
        return ($k1['fitness'] > $k2['fitness']) ? $k1['kromosom'] : $k2['kromosom'];
    }

    private function crossover($parent1, $parent2)
        {
            // Jika gagal melewati rate crossover, kembalikan parent1 langsung
            if ((mt_rand() / mt_getrandmax()) > $this->crossoverRate) {
                return $parent1;
            }

            $child = [];

            // PERBAIKAN: Gunakan array_merge dan array_unique agar kelas dari kedua parent tergabung sempurna
            $allKelasIds = array_unique(array_merge(array_keys($parent1), array_keys($parent2)));

            foreach ($allKelasIds as $kelasId) {
                $gens1 = $parent1[$kelasId] ?? [];
                $gens2 = $parent2[$kelasId] ?? [];

                if (empty($gens1)) {
                    $child[$kelasId] = $gens2;
                    continue;
                }
                if (empty($gens2)) {
                    $child[$kelasId] = $gens1;
                    continue;
                }

                $child[$kelasId] = [];

                // Ambil semua unik chunk ID dari kedua parent untuk kelas ini
                $allChunkIds = array_unique(array_merge(array_keys($gens1), array_keys($gens2)));

                foreach ($allChunkIds as $chunkId) {
                    // Pilih secara acak dari parent 1 atau parent 2, dengan fallback jika salah satu kosong
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

        $matrixGuru = [];
        $matrixKelasHari = [];

        // 1. Petakan matriks jadwal saat ini yang sudah terisi valid
        foreach ($kromosom as $kId => $gens) {
            foreach ($gens as $gen) {
                $h = $gen['hari'] ?? null;
                $jMulai = $gen['jam_mulai'] ?? null;
                $durasi = $gen['durasi'] ?? 0;
                if (!$h || !$jMulai) continue;

                $guruId = !empty($gen['guru_id']) ? 'g_' . $gen['guru_id'] : (!empty($gen['nip']) ? 'n_' . $gen['nip'] : 'none');
                $isPenjaskes = $gen['is_penjaskes'] ?? false;

                for ($d = 0; $d < $durasi; $d++) {
                    $matrixKelasHari[$kId][$h][$jMulai + $d] = true;
                    if (!$isPenjaskes && $guruId !== 'none') {
                        $matrixGuru[$guruId][$h][$jMulai + $d] = true;
                    }
                }
            }
        }

        // 2. CARI APAKAH ADA GEN YANG BERSTATUS NULL (Belum mendapat hari/jam)
        $targetGen = null;
        $targetKelasId = null;

        foreach ($kromosom as $kId => &$gens) {
            foreach ($gens as &$gen) {
                if (empty($gen['hari']) || empty($gen['jam_mulai'])) {
                    $targetGen = &$gen;
                    $targetKelasId = $kId;
                    break 2; // Prioritaskan perbaiki yang null duluan!
                }
            }
        }
        unset($gen, $gens);

        // 3. JIKA TIDAK ADA YANG NULL, LAKUKAN MUTASI NORMAL (Geser jadwal acak yang sudah ada)
        if (!$targetGen) {
            $kelasKeys = array_keys($kromosom);
            if (empty($kelasKeys)) return $kromosom;

            $randomKelasId = $kelasKeys[array_rand($kelasKeys)];
            if (empty($kromosom[$randomKelasId])) return $kromosom;

            $chunkIds = array_keys($kromosom[$randomKelasId]);
            $randomChunkId = $chunkIds[array_rand($chunkIds)];
            $targetGen = &$kromosom[$randomKelasId][$randomChunkId];
            $targetKelasId = $randomKelasId;

            $durasi = $targetGen['durasi'] ?? 0;
            $oldH = $targetGen['hari'] ?? null;
            $oldJMulai = $targetGen['jam_mulai'] ?? null;
            if (!$oldH || !$oldJMulai || $durasi <= 0) return $kromosom;

            $guruId = !empty($targetGen['guru_id']) ? 'g_' . $targetGen['guru_id'] : (!empty($targetGen['nip']) ? 'n_' . $targetGen['nip'] : 'none');
            $isPenjaskes = $targetGen['is_penjaskes'] ?? false;

            // Hapus sementara slot lama untuk dipindah
            for ($d = 0; $d < $durasi; $d++) {
                unset($matrixKelasHari[$targetKelasId][$oldH][$oldJMulai + $d]);
                if (!$isPenjaskes && $guruId !== 'none') {
                    unset($matrixGuru[$guruId][$oldH][$oldJMulai + $d]);
                }
            }
        }

        // Ambil atribut gen target (baik yang tadinya null maupun hasil geseran normal)
        $durasi = $targetGen['durasi'] ?? 0;
        if ($durasi <= 0) return $kromosom;

        $guruId = !empty($targetGen['guru_id']) ? 'g_' . $targetGen['guru_id'] : (!empty($targetGen['nip']) ? 'n_' . $targetGen['nip'] : 'none');
        $isPenjaskes = $targetGen['is_penjaskes'] ?? false;
        $oldH = $targetGen['hari'] ?? null;
        $oldJMulai = $targetGen['jam_mulai'] ?? null;

        // 4. CARI SLOT BARU YANG 100% STERIL
        $hariList = $this->hari;
        shuffle($hariList);
        $ditemukan = false;

        foreach ($hariList as $randomHari) {
            $maxJam = $this->getMaxJam($randomHari);
            for ($jm = 1; $jm <= ($maxJam - $durasi + 1); $jm++) {
                $bisa = true;
                for ($d = 0; $d < $durasi; $d++) {
                    $jamCek = $jm + $d;
                    if (!empty($matrixKelasHari[$targetKelasId][$randomHari][$jamCek]) ||
                        (!$isPenjaskes && $guruId !== 'none' && !empty($matrixGuru[$guruId][$randomHari][$jamCek]))) {
                        $bisa = false;
                        break;
                    }
                }

                if ($bisa) {
                    $targetGen['hari'] = $randomHari;
                    $targetGen['jam_mulai'] = (int) $jm;
                    $ditemukan = true;
                    break 2;
                }
            }
        }

        // Jika tadinya bukan null dan gagal cari slot baru, rollback ke posisi lama
        if (!$ditemukan && $oldH && $oldJMulai) {
            $targetGen['hari'] = $oldH;
            $targetGen['jam_mulai'] = $oldJMulai;
        }

        return $kromosom;
    }
}
