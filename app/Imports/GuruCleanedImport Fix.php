<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeSheet;

class GuruCleanedImport implements ToCollection, WithEvents
{
    public $cleanedData = [];
    private $columnMap = [];
    private $sheetName = '';

    public function registerEvents(): array
    {
        return [
            BeforeSheet::class => function(BeforeSheet $event) {
                $this->sheetName = $event->getSheet()->getTitle();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        $this->initializeHeaderMap($rows);
        $currentRecord = null;
        $activeMapel = null;

        foreach ($rows as $index => $row) {
            // Abaikan 5 baris pertama (header)
            if ($index <= 5) continue;

            $col0 = trim((string)($row[0] ?? ''));
            $col1 = trim((string)($row[1] ?? ''));
            $col3 = trim((string)($row[3] ?? ''));

            if ($this->shouldSkip($col0, $col1)) continue;

            // Deteksi Guru Baru
            if (is_numeric(str_replace('.', '', $col0)) && $this->isValidGuruName($col1)) {
                if ($currentRecord) $this->saveRecord($currentRecord);

                $currentRecord = [
                    'nama_guru' => $col1,
                    'nip' => '',
                    'wali_kelas' => null,
                    'mapel_di_ampu' => []
                ];
                $activeMapel = null;
            }

            if (!$currentRecord) continue;

            $this->extractWaliKelas($row, $currentRecord);
            $this->extractNip($col1, $currentRecord);

            if (!empty($col3) && $this->isMapelName($col3)) {
                $activeMapel = $col3;
            }

            // Deteksi Jam per Kolom Kelas
            if ($activeMapel) {
                foreach ($this->columnMap as $colIndex => $namaKelas) {
                    $val = $row[$colIndex] ?? 0;
                    $jam = (int)filter_var($val, FILTER_SANITIZE_NUMBER_INT);
                    if ($jam > 0 && $jam < 50) {
                        $this->addMapelData($currentRecord, $activeMapel, $namaKelas, $jam);
                    }
                }
            }
        }
        if ($currentRecord) $this->saveRecord($currentRecord);
    }

    private function initializeHeaderMap(Collection $rows)
    {
        $parent = $rows->get(4); // Baris yang berisi "KELAS X", "KELAS XI", dst.
        $sub = $rows->get(5);    // Baris yang berisi nomor kelas "1", "2", "3", dst.
        if (!$parent || !$sub) return;

        $currentParent = '';

        foreach ($sub as $i => $v) {
            if ($i > 60) break;

            // Update prefix kelas (X/XI/XII) jika ketemu sel baru di baris 4
            if (!empty($parent[$i])) {
                $cleaned = trim(str_ireplace('KELAS', '', (string)$parent[$i]));
                if (!empty($cleaned)) $currentParent = $cleaned;
            }

            // Bentuk nama kelas jika sel di baris 5 adalah angka
            $val = trim((string)$v);
            if (is_numeric($val) && (int)$val > 0) {
                $namaKelas = trim($currentParent) . '-' . $val;

                // FILTER: Abaikan kelas yang mengandung huruf D
                if (stripos($namaKelas, '-D') !== false) continue;

                $this->columnMap[$i] = $namaKelas;
            }
        }
    }

    private function addMapelData(&$r, $m, $k, $j) {
        if (stripos($k, '-D') !== false) return; // Proteksi tambahan

        foreach($r['mapel_di_ampu'] as $item) {
            if($item['nama_mapel'] === $m && $item['kelas'] === $k) return;
        }
        $r['mapel_di_ampu'][] = ['nama_mapel' => $m, 'kelas' => $k, 'beban_jam' => $j];
    }

    private function isValidGuruName($name) {
        $blacklist = ['NO', 'KETERANGAN'];
        if (preg_match('/^(X|XI|XII|RB)\s+/i', $name)) return false;
        return !in_array(strtoupper($name), $blacklist);
    }

    private function isMapelName($name) {
        $invalid = ['MATA PELAJARAN', 'NO', 'NAMA', 'KELAS', 'JML'];
        return !in_array(strtoupper($name), $invalid) && strlen($name) > 2;
    }

    private function extractWaliKelas($row, &$currentRecord) {
        if (!is_null($currentRecord['wali_kelas'])) return;
        foreach ($row as $cell) {
            $s = (string)$cell;
            if (stripos($s, 'Wali Kelas') !== false) {
                $currentRecord['wali_kelas'] = $s;
                break;
            }
        }
    }

    private function extractNip($col1, &$currentRecord) {
        if (stripos($col1, 'NIP') !== false) {
            $currentRecord['nip'] = preg_replace('/[^0-9]/', '', str_ireplace(['NIP.', 'NIP'], '', $col1));
        }
    }

    private function shouldSkip($c0, $c1) {
        return (empty($c0) && empty($c1)) || stripos($c0, 'Lampiran') !== false || stripos($c0, 'RB Kelas') !== false;
    }

    private function saveRecord($r) {
        if (!empty(trim($r['nama_guru'])) && !preg_match('/^\d+$/', $r['nama_guru'])) {
            $this->cleanedData[] = $r;
        }
    }
}