<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;

class GuruCleanedImport implements ToCollection
{
    public $cleanedData = [];
    private $columnMap = [];

    public function collection(Collection $rows)
    {
        $this->initializeHeaderMap($rows);
        $currentRecord = null;
        $activeMapel = null;

      foreach ($rows as $index => $row) {
            $c0 = trim(preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', (string)($row[0] ?? '')));
            $c1 = trim(preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', (string)($row[1] ?? '')));
            $c2 = trim(preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', (string)($row[2] ?? '')));
            $c3 = trim(preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', (string)($row[3] ?? '')));

            if (in_array(strtolower($c1), ['nama', 'nama guru', 'nama lengkap', 'nama pendidik'])) {
                continue;
            }

            if ($this->shouldSkip($c0, $c1, $c2) && empty($currentRecord)) continue;

            $isNomorValid = !empty($c0) && (is_numeric(str_replace(['.', ' ', '-'], '', $c0)) || preg_match('/^[0-9]+[a-z]?$/i', trim($c0)));
            $isNamaValid  = !empty($c1) && stripos($c1, 'NIP') === false && $this->isValidGuruName($c1);

            // Jika ada nama guru baru di baris ini
            if ((($isNomorValid && $isNamaValid) || (empty($c0) && $isNamaValid)) && !$this->isAdministrativeLabel($c1)) {
                if ($currentRecord) $this->cleanedData[] = $currentRecord;
                $currentRecord = ['nama_guru' => $c1, 'nip' => '', 'wali_kelas' => null, 'mapel_di_ampu' => []];
                $activeMapel = null;
            }
            // Jika $c1 kosong atau berisi NIP (karena kena merge row vertikal), tetap gunakan $currentRecord yang sedang aktif
            elseif ($currentRecord && (empty($c1) || stripos($c1, 'NIP') !== false)) {
                // Konteks guru tetap terikat ke $currentRecord sebelumnya
            }

            if (!$currentRecord) continue;

            $this->extractMetadata($row, $c1, $currentRecord);

            // Deteksi mapel dari kolom c3 atau c2 (mendukung multi-row mapel akibat merge)
            $potensiMapel = null;
            if (!empty($c3)) {
                $potensiMapel = $c3;
            } elseif (!empty($c2)) {
                $potensiMapel = $c2;
            }

            if (!empty($potensiMapel)) {
                $lines = preg_split('/\r\n|\r|\n/', $potensiMapel);
                foreach ($lines as $line) {
                    $cleanLine = trim($line);
                    if (!empty($cleanLine) && $this->isMapelName($cleanLine)) {
                        $activeMapel = $cleanLine;
                    }
                }
            }

            if ($activeMapel && $currentRecord) {
                foreach ($this->columnMap as $i => $namaKelas) {
                    $val = $row[$i] ?? 0;
                    $jam = (is_numeric($val)) ? (int)$val : (int)filter_var($val, FILTER_SANITIZE_NUMBER_INT);
                    if ($jam > 0 && $jam < 50) {
                        $this->addMapelData($currentRecord, $activeMapel, $namaKelas, $jam);
                    }
                }
            }
        }
        if ($currentRecord) $this->cleanedData[] = $currentRecord;
    }

    private function initializeHeaderMap($rows) {
        // 1. Cari baris yang mengandung keyword "NAMA" dan "KELAS"
        $targetIndex = null;
        foreach ($rows as $index => $row) {
            $rowStr = implode(' ', array_map('strtolower', $row->toArray()));
            if (str_contains($rowStr, 'nama') && str_contains($rowStr, 'kelas')) {
                $targetIndex = $index;
                break;
            }
        }

        // Jika tidak ditemukan, gunakan default (misal 1)
        $headerIndex = ($targetIndex !== null) ? $targetIndex : 1;

        // 2. Ambil data dari baris tersebut (atau baris tepat di bawahnya jika angka ada di baris berikutnya)
        $sub = $rows->get($headerIndex);

        // Opsional: Jika angka kelas ada di baris tepat di bawah header
        $nextRow = $rows->get($headerIndex + 1);

        // Gunakan baris yang berisi data angka (kita cek mana yang lebih cocok)
        $checkRow = ($this->hasNumbers($nextRow)) ? $nextRow : $sub;

        $grade = 'X'; $prevVal = 0;
        foreach ($checkRow as $i => $v) {
            // Deteksi mulai kolom data (biasanya setelah kolom Nama/Mapel)
            if ($i < 3) continue;

            $val = (int)$v;
            if ($val > 0) {
                if ($val == 1 && $prevVal > 1) $grade = ($grade === 'X') ? 'XI' : 'XII';
                $namaKelas = $grade . '-' . $val;
                // if (stripos($namaKelas, '-D') === false) $this->columnMap[$i] = $namaKelas;
                $this->columnMap[$i] = $namaKelas;
                $prevVal = $val;
            }
        }
    }

    // Fungsi pembantu untuk mengecek apakah baris berisi angka
    private function hasNumbers($row) {
        if (!$row) return false;
        foreach ($row as $cell) {
            if (is_numeric(trim((string)$cell)) && (int)$cell > 0) return true;
        }
        return false;
    }

    private function addMapelData(&$r, $m, $k, $j) {
        foreach($r['mapel_di_ampu'] as &$item) {
            if($item['nama_mapel'] === $m && $item['kelas'] === $k) {
                $item['beban_jam'] += $j; return;
            }
        }
        $r['mapel_di_ampu'][] = ['nama_mapel' => $m, 'kelas' => $k, 'beban_jam' => $j];
    }

    private function extractMetadata($row, $c1, &$r) {
        if (is_null($r['wali_kelas'])) {
            foreach ($row as $s) if (stripos((string)$s, 'Wali Kelas') !== false) $r['wali_kelas'] = $s;
        }
        if (stripos($c1, 'NIP') !== false) $r['nip'] = preg_replace('/[^0-9]/', '', str_ireplace(['NIP.', 'NIP'], '', $c1));
    }

private function isMapelName($name) {
    $u = strtoupper(trim($name));

    // Abaikan jika berupa label umum atau angka romawi tingkat/golongan murni
    if (in_array($u, ['NO', 'NAMA', 'KELAS', 'JML', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'])) {
        return false;
    }

    // Abaikan jika format golongan seperti III/A, III/B, III/C, III/D, IV/A, dll.
    if (preg_match('/^(I|II|III|IV|V|VI)\s*[\/\-]\s*[a-d]$/i', $u)) {
        return false;
    }

    foreach (['MATA PELAJARAN', 'KEPALA', 'WAKAMAD', 'WALI KELAS', 'PEMBINA', 'KOORDINATOR', 'KEP.', 'GURU', 'GTT'] as $term) {
        if (stripos($u, $term) !== false) return false;
    }

    return strlen($u) >= 2 && stripos($u, 'NIP') === false;
}
    private function isValidGuruName($name) {
        return !preg_match('/^(X|XI|XII|RB)\s+/i', $name) && !in_array(strtoupper($name), ['NO', 'KETERANGAN']);
    }

    private function shouldSkip($c0, $c1, $c2) {
        return (stripos($c0, 'Lampiran') !== false || stripos($c0, 'RB Kelas') !== false) || (empty($c0) && empty($c1) && empty($c2));
    }

    private function isAdministrativeLabel($name) {
        $name = trim($name);

        // 1. Buang jika cuma angka
        if (is_numeric($name)) return true;

        // 2. Buang jika mengandung kata kunci label sistem
        $labels = [
            'JUMLAH', 'KELOMPOK', 'MATA PELAJARAN', 'ROMBONGAN', 'MADRASAH',
            'STRUKTUR', 'KURIKULUM', '-D'
        ];

        foreach ($labels as $label) {
            if (stripos($name, $label) !== false) return true;
        }

        return false;
    }
}