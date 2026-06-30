<?php

namespace App\Services;

class GeneticAlgorithmService
{
    private $populasi;
    private $maxGenerasi;
    private $crossoverRate;
    private $mutationRate;

    // Properti Callback untuk Real-Time Log
    public $onGenerationComplete = null;

    // Data Master
    private $guruMapels;
    private $kelas;
    private $hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    private $jam = [];
    private $slotWaktu = [];
    private $prioritasPagiNip;
    private $prioritasPagi;
    public function __construct($params, $guruMapels, $kelas,$prioritasPagi = [])
    {
        $this->populasi = $params['populasi'] ?? 100;
        $this->maxGenerasi = $params['generasi'] ?? 500;
        $this->crossoverRate = $params['crossover_rate'] ?? 0.8;
        $this->mutationRate = $params['mutation_rate'] ?? 0.1;
        $this->prioritasPagiNip = $params['prioritas_pagi_nip'] ?? [];
        $this->prioritasPagi = $prioritasPagi;

        // Ambil Slot Waktu Dinamis dari Frontend
        if (isset($params['slot_waktu']) && is_array($params['slot_waktu']) && count($params['slot_waktu']) > 0) {
            $this->jam = [];
            $this->slotWaktu = [];
            foreach ($params['slot_waktu'] as $index => $slot) {
                $jamKe = $index + 1;
                $this->jam[] = $jamKe;
                $this->slotWaktu[$jamKe] = [
                    'mulai' => $slot['mulai'] . ':00',
                    'selesai' => $slot['selesai'] . ':00'
                ];
            }
        } else {
            // Default 8 Jam jika payload kosong
            $this->slotWaktu = [
                1 => ['mulai' => '07:00:00', 'selesai' => '07:45:00'],
                2 => ['mulai' => '07:45:00', 'selesai' => '08:30:00'],
                3 => ['mulai' => '08:30:00', 'selesai' => '09:15:00'],
                4 => ['mulai' => '09:30:00', 'selesai' => '10:15:00'],
                5 => ['mulai' => '10:15:00', 'selesai' => '11:00:00'],
                6 => ['mulai' => '11:00:00', 'selesai' => '11:45:00'],
                7 => ['mulai' => '12:30:00', 'selesai' => '13:15:00'],
                8 => ['mulai' => '13:15:00', 'selesai' => '14:00:00'],
            ];
            $this->jam = array_keys($this->slotWaktu);
        }

        $this->guruMapels = $guruMapels;
        $this->kelas = $kelas;
    }

    public function generate()
    {
        $populasiSaatIni = $this->inisialisasiPopulasi();
        $generasi = 0;
        $bestFitness = 0;
        $bestKromosom = [];

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

            if (is_callable($this->onGenerationComplete)) {
                ($this->onGenerationComplete)($generasi, $bestFitness);
            }

            // Hentikan jika sudah mencapai nilai optimal tanpa bentrok keras
            if ($bestFitness >= 1.0) break;

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

        return [
            'status' => 'success',
            'generasi_terakhir' => $generasi,
            'fitness_terbaik' => round($bestFitness, 4),
            'jadwal' => $bestKromosom
        ];
    }

    private function inisialisasiPopulasi()
    {
        $populasi = [];
        for ($i = 0; $i < $this->populasi; $i++) {
            $kromosom = [];
            $matrixKelas = []; // Melacak slot yang terisi agar kelas tidak bentrok sendiri

            foreach ($this->guruMapels as $gm) {
                $sisaJam = $gm->beban_jam;
                $blokWaktu = [];

                while ($sisaJam > 0) {
                    if ($sisaJam == 4) { $ambil = 2; }
                    elseif ($sisaJam == 5) { $ambil = 3; }
                    else { $ambil = $sisaJam > 3 ? 3 : $sisaJam; }
                    $blokWaktu[] = $ambil;
                    $sisaJam -= $ambil;
                }

                foreach ($blokWaktu as $indeksBlok => $bebanBlok) {
                    $slotDitemukan = false;
                    $percobaan = 0;

                    while (!$slotDitemukan && $percobaan < 150) {
                        $hariDipilih = $this->hari[array_rand($this->hari)];

                        // 🌟 KUNCI SLOT PAGI UNTUK GURU PRIORITAS
                        $isPrioritas = false;
                        foreach ($this->prioritasPagi as $p) {
                            if ($gm->nip === (string)$p['nip'] && (int)$gm->kelas_id === (int)$p['kelas_id']) {
                                $isPrioritas = true;
                                break;
                            }
                        }
                        if ($isPrioritas) {
                            // Asumsi jam pagi adalah jam 1, 2, 3.
                            // Batasi nilai random agar tidak melebihi jam ke-3
                           $maxMulai = min(3 - $bebanBlok, count($this->jam) - $bebanBlok);
                            $jamMulaiAwal = $this->jam[mt_rand(0, max(0, $maxMulai - 1))];
                        } else {
                            // Untuk guru biasa, bebas dari jam 1 sampai 10
                            $maxMulai = max(0, count($this->jam) - $bebanBlok);
                            $jamMulaiAwal = $this->jam[mt_rand(0, $maxMulai)];
                        }
                        $jamMulaiAwal = $this->jam[mt_rand(0, $maxMulai)];

                       $bentrok = false;
                        for ($j = 0; $j < $bebanBlok; $j++) {
                            $jamCek = $jamMulaiAwal + $j;
                            if (isset($matrixKelas[$gm->kelas_id][$hariDipilih][$jamCek]) ||
                                isset($matrixGuru[$gm->nip][$hariDipilih][$jamCek])) { // Pastikan Anda juga melacak $matrixGuru
                                $bentrok = true;
                                break;
                            }
                        }
                        if (!$bentrok) {
                            $slotDitemukan = true;
                            for ($j = 0; $j < $bebanBlok; $j++) {
                                $jamSekarang = $jamMulaiAwal + $j;
                                $matrixKelas[$gm->kelas_id][$hariDipilih][$jamSekarang] = true;

                                $kromosom[] = $this->buatGenJadwal($gm, $hariDipilih, $jamSekarang, $indeksBlok, $bebanBlok);
                            }
                        }
                        $percobaan++;
                    }

                    // 🌟 SOLUSI TETRIS: Jika gagal mendapatkan slot berurutan karena sisa ruang menyempit,
                    // cari sisa slot kosong mana saja yang tersedia daripada memaksakan tabrakan jam!
                    if (!$slotDitemukan) {
                        $slotKosongTersedia = [];
                        foreach ($this->hari as $h) {
                            foreach ($this->jam as $jm) {
                                if (!isset($matrixKelas[$gm->kelas_id][$h][$jm])) {
                                    $slotKosongTersedia[] = ['hari' => $h, 'jam' => $jm];
                                }
                            }
                        }

                        for ($j = 0; $j < $bebanBlok; $j++) {
                            if (!empty($slotKosongTersedia)) {
                                $slotTerpilih = array_shift($slotKosongTersedia);
                                $hDipilih = $slotTerpilih['hari'];
                                $jDipilih = $slotTerpilih['jam'];

                                $matrixKelas[$gm->kelas_id][$hDipilih][$jDipilih] = true;
                                $kromosom[] = $this->buatGenJadwal($gm, $hDipilih, $jDipilih, $indeksBlok, $bebanBlok);
                            } else {
                                // Fallback darurat mutlak
                                $hDipilih = $this->hari[array_rand($this->hari)];
                                $jDipilih = $this->jam[array_rand($this->jam)];
                                $kromosom[] = $this->buatGenJadwal($gm, $hDipilih, $jDipilih, $indeksBlok, $bebanBlok);
                            }
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
        return [
            'nip'                  => $gm->nip,
            't_list_guru_id'       => $gm->t_list_guru_id ?? null,
            't_list_guru_mapel_id' => $gm->id,
            'blok_id'              => $gm->id . '_' . $indeksBlok,
            'mapel_id'             => $gm->mapel_id,
            'kelas_id'             => $gm->kelas_id,
            'hari'                 => $hari,
            'jam'                  => $jam,
            'jam_mulai'            => $this->slotWaktu[$jam]['mulai'] ?? '00:00:00',
            'jam_selesai'          => $this->slotWaktu[$jam]['selesai'] ?? '00:00:00',
            'beban_jam'            => $bebanBlok
        ];
    }

    private function hitungFitness($kromosom)
    {
        $penalty = 0;
        $count = count($kromosom);

        // --- 1. HARD CONSTRAINTS ---
        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                if ($kromosom[$i]['hari'] === $kromosom[$j]['hari'] && $kromosom[$i]['jam'] === $kromosom[$j]['jam']) {
                    // Guru mengajar rangkap di waktu yang sama (Pinalti dinormalisasi ke 1.0)
                    if ($kromosom[$i]['nip'] === $kromosom[$j]['nip']) {
                        $penalty += 1.0;
                    }
                    // Satu kelas menerima dua mapel sekaligus
                    if ($kromosom[$i]['kelas_id'] === $kromosom[$j]['kelas_id']) {
                        $penalty += 1.0;
                    }
                }
            }

            if (in_array($kromosom[$i]['nip'], $this->prioritasPagiNip) && $kromosom[$i]['jam'] > 3) {
                $penalty += 1.0;
            }
        }

        // --- 2. SOFT CONSTRAINTS (Jam Berurutan Berbasis blok_id) ---
        $groupedByBlok = [];
        foreach ($kromosom as $gen) {
            $key = $gen['kelas_id'] . '_' . $gen['blok_id'];
            $groupedByBlok[$key][] = $gen;
        }

        foreach ($groupedByBlok as $key => $gens) {
            $jumlahJam = count($gens);
            if ($jumlahJam > 1) {
                $hariUnik = array_unique(array_column($gens, 'hari'));
                if (count($hariUnik) > 1) {
                    $penalty += (count($hariUnik) - 1) * 0.2;
                } else {
                    $jamList = array_column($gens, 'jam');
                    sort($jamList);
                    for ($k = 0; $k < $jumlahJam - 1; $k++) {
                        if ($jamList[$k + 1] - $jamList[$k] !== 1) {
                            $penalty += 0.1;
                        }
                    }
                }
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

        $groupedP1 = [];
        $groupedP2 = [];
        foreach ($parent1 as $gen) $groupedP1[$gen['kelas_id']][] = $gen;
        foreach ($parent2 as $gen) $groupedP2[$gen['kelas_id']][] = $gen;

        $child = [];
        foreach ($groupedP1 as $kelasId => $gens) {
            if (mt_rand(0, 1) === 1) {
                $child = array_merge($child, $groupedP1[$kelasId]);
            } else {
                $child = array_merge($child, $groupedP2[$kelasId] ?? $groupedP1[$kelasId]);
            }
        }
        return $child;
    }

private function mutasi($kromosom)
    {
        if ((mt_rand() / mt_getrandmax()) > $this->mutationRate) return $kromosom;

        $groupedByKelas = [];
        foreach ($kromosom as $gen) $groupedByKelas[$gen['kelas_id']][] = $gen;

        $kromosomBaru = [];
        foreach ($groupedByKelas as $kelasId => $gens) {
            // Cek apakah mutasi akan dilakukan pada kelas ini
            if (count($gens) > 1 && (mt_rand() / mt_getrandmax()) < $this->mutationRate) {

                $idx1 = array_rand($gens);
                $idx2 = array_rand($gens);
                while ($idx1 === $idx2) $idx2 = array_rand($gens);

                // 🌟 LOGIKA PENGAMAN: Mencegah Guru Prioritas tergeser
                // $isGuru1Prioritas = in_array($gens[$idx1]['nip'], $this->prioritasPagiNip);
                // $isGuru2Prioritas = in_array($gens[$idx2]['nip'], $this->prioritasPagiNip);
                $isGuru1Prioritas = false;
                foreach($this->prioritasPagi as $p) {
                    if ($gens[$idx1]['nip'] === $p['nip'] && $gens[$idx1]['kelas_id'] === (int)$p['kelas_id']) {
                        $isGuru1Prioritas = true; break;
                    }
                }
                $isGuru2Prioritas = false;
                foreach($this->prioritasPagi as $p) {
                    if ($gens[$idx1]['nip'] === $p['nip'] && $gens[$idx1]['kelas_id'] === (int)$p['kelas_id']) {
                        $isGuru2Prioritas = true; break;
                    }
                }
                // Jika salah satu (atau keduanya) adalah Guru Prioritas,
                // mutasi dibatalkan atau dialihkan agar posisi pagi tetap terjaga
                if ($isGuru1Prioritas || $isGuru2Prioritas) {
                    // Opsi: Lewati mutasi jika ada guru prioritas agar aman
                    $kromosomBaru = array_merge($kromosomBaru, $gens);
                    continue;
                }

                // Jika bukan guru prioritas, lakukan swap normal seperti sebelumnya
                $tempHari = $gens[$idx1]['hari'];
                $tempJam  = $gens[$idx1]['jam'];
                $tempMulai = $gens[$idx1]['jam_mulai'];
                $tempSelesai = $gens[$idx1]['jam_selesai'];

                $gens[$idx1]['hari'] = $gens[$idx2]['hari'];
                $gens[$idx1]['jam']  = $gens[$idx2]['jam'];
                $gens[$idx1]['jam_mulai'] = $gens[$idx2]['jam_mulai'];
                $gens[$idx1]['jam_selesai'] = $gens[$idx2]['jam_selesai'];

                $gens[$idx2]['hari'] = $tempHari;
                $gens[$idx2]['jam']  = $tempJam;
                $gens[$idx2]['jam_mulai'] = $tempMulai;
                $gens[$idx2]['jam_selesai'] = $tempSelesai;
            }
            $kromosomBaru = array_merge($kromosomBaru, $gens);
        }
        return $kromosomBaru;
    }
}