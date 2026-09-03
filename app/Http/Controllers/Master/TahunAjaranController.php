<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Imports\GuruCleanedImport;
use App\Models\User;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MMapel;
use App\Models\WAHYU\MTahunAjaran;
use App\Models\WAHYU\TListGuru;
use App\Models\WAHYU\TListGuruMapel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TahunAjaranController extends Controller
{

    public function index(){
        return Inertia::render('Admin/Master/TahunAjaran/TahunAjaran');
    }

    public function getTahunAjaran(){
        $tahunAjaran = MTahunAjaran::orderBy('id', 'desc')->get();

        $json = [];

        if(!empty($tahunAjaran) && count($tahunAjaran) > 0){
            $json = [
                'data' => $tahunAjaran,
                'success' => true
            ];
        }else{
            $json = [
                'data' => $tahunAjaran,
                'success' => false
            ];
        }

        return response()->json($json);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tahun_ajaran' => 'required',
            'semester' => 'required'
        ]);

        // cek data duplikat
        $check = MTahunAjaran::where('tahun_ajaran', $request->tahun_ajaran)
            ->where('semester', $request->semester)
            ->first();

        if ($check) {
            return redirect()
                ->back()
                ->with('error', 'Data Tahun Ajaran Sudah Ada');
        }

        // ubah semua status menjadi nonactive
        MTahunAjaran::query()->update([
            'status' => 'nonactive'
        ]);

        // simpan data baru
        $storeTahunAjaran = MTahunAjaran::create([
            'tahun_ajaran' => $request->tahun_ajaran,
            'semester' => $request->semester,
            'status' => 'active'
        ]);

        if ($storeTahunAjaran && $storeTahunAjaran->exists) {
            return redirect()
                ->back()
                ->with('success', 'Data Tahun Ajaran Berhasil Disimpan');
        } else {
            return redirect()
                ->back()
                ->with('error', 'Data Tahun Ajaran Gagal Disimpan');
        }
    }

    public function update(Request $request){
        $id = $request->id;

        $updateTahunAjaran = MTahunAjaran::where('id', $id)->update([
            'tahun_ajaran' => $request->tahun_ajaran,
            'semester' => $request->semester
        ]);

        if ($updateTahunAjaran) {
            return redirect()
                ->back()
                ->with('success', 'Data Tahun Ajaran Berhasil Diubah');
        } else {
            return redirect()
                ->back()
                ->with('error', 'Data Tahun Ajaran Gagal Diubah');
        }
    }

    public function ProsesImportSK(Request $request)
{
    $file = $request->file('file');
    $tahun_ajaran_id = $request->tahun_ajaran_id;
    $xlsxPath = $file->getRealPath();

    // Pastikan folder temp ada
    $tempDir = storage_path('app/temp/' . uniqid());
    if (!file_exists($tempDir)) mkdir($tempDir, 0777, true);

    // 1. Muat Spreadsheet
    $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($xlsxPath);
    $reader->setReadDataOnly(true);
    $spreadsheet = $reader->load($xlsxPath);
    $sheetNames = $spreadsheet->getSheetNames();

    $allData = [];

    // 2. Loop per Sheet dan Konversi ke CSV masing-masing
    foreach ($sheetNames as $sheetName) {
    // Filter: Hanya proses sheet yang namanya mengandung tanda kurung '(' atau ')'
    if (str_contains($sheetName, '(') && str_contains($sheetName, ')')) {

        // Set sheet aktif
        $spreadsheet->setActiveSheetIndexByName($sheetName);
        $csvPath = $tempDir . '/' . str_replace(' ', '_', $sheetName) . '.csv';

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Csv');
        $writer->setSheetIndex($spreadsheet->getIndex($spreadsheet->getSheetByName($sheetName)));
        $writer->save($csvPath);

        // Import data dari CSV yang baru dibuat
        $import = new GuruCleanedImport();
        \Maatwebsite\Excel\Facades\Excel::import($import, $csvPath);

        // Gabungkan data
        $allData = array_merge($allData, $import->cleanedData);

        // Hapus CSV per sheet setelah diimport
        unlink($csvPath);
    }
}

    // Hapus folder temp
    rmdir($tempDir);

    $data = $allData;
    // return response()->json($data);
    // 3. Validasi Data
    if (empty($data)) {
        return response()->json(['message' => 'Data tidak ditemukan atau format salah'], 400);
        }


       return response()->stream(function () use ($data, $tahun_ajaran_id) {
    // Matikan batasan waktu eksekusi agar tidak timeout
    set_time_limit(0);

    if (ob_get_level() > 0) {
        ob_end_clean();
    }

    $dataKelas = [];
    $dataMapel = []; // Inisialisasi array untuk menampung Mapel beserta relasi gurunya
    $totalData = count($data);

    // =========================================================================
    // TAHAP 1: PROSES GURU & USER (Porsi 60%)
    // =========================================================================
    foreach ($data as $index => $row) {
        try {
            // Tangani duplikasi nama "Guru Baru"
            $namaRaw = trim($row['nama_guru'] ?? '');
            $nama = ($namaRaw === 'Guru Baru') ? "Guru Baru " . ($index + 1) : $namaRaw;

            // Logika NIP
            $rawNip = trim($row['nip'] ?? '');
            $nip = (in_array($rawNip, ['---', ''])) ? null : $rawNip;

            // UpdateOrCreate MGuru
            if ($nip) {
                $guru = MGuru::updateOrCreate(
                    ['nip' => $nip],
                    ['nama_guru' => $nama]
                );
            } else {
                $guru = MGuru::updateOrCreate(
                    ['nama_guru' => $nama],
                    ['nip' => null,'jenis_kelamin' => $row['jenis_kelamin'] ?? 'Belum Ditentukan']
                );
            }

            $guruId = $guru->id;

            // Penulisan strtolower & Update/Create User
            $username = str_replace([' ', ',', '.', "'", '-','spd','mpd'], '', strtolower($nip ?? $nama));

            $user = User::where('guru_id', $guruId)->first();
            if (!$user) {
                User::create([
                    'guru_id'  => $guruId,
                    'name'     => $nama,
                    'username' => $username,
                    'nip'      => $nip ?? $username,
                    'password' => Hash::make($nip ?? $username),
                    'role_id'  => 2,
                ]);
            } else {
                $user->update([
                    'name'     => $nama,
                    'username' => $username,
                    'nip'      => $nip ?? $username,
                ]);
            }

            // --- DAFTARKAN KELAS & MAPEL DARI MAPEL DI AMPU ---
            if (!empty($row['mapel_di_ampu'])) {
                foreach ($row['mapel_di_ampu'] as $item) {
                    // A. Kumpulkan Data Kelas
                    $kelasKey = trim($item['kelas'] ?? '');
                    $kelasKey = str_replace(' ', '-', $kelasKey);

                    if ($kelasKey && !isset($dataKelas[$kelasKey])) {
                        $tingkat = null;
                        if (stripos($kelasKey, 'XII') !== false) $tingkat = 12;
                        elseif (stripos($kelasKey, 'XI') !== false) $tingkat = 11;
                        elseif (stripos($kelasKey, 'X') !== false) $tingkat = 10;

                        $dataKelas[$kelasKey] = [
                            'nama_kelas'    => $kelasKey,
                            'tingkat'       => $tingkat,
                            'id_wali_kelas' => null,
                        ];
                    }

                    // B. Kumpulkan Data Mapel & Relasi Guru-Mapel
                    $mapelKey = trim($item['nama_mapel'] ?? '');

                    if ($mapelKey) {
                        if (!isset($dataMapel[$mapelKey])) {
                            $dataMapel[$mapelKey] = [
                                'nama_mapel' => $mapelKey,
                                'list_guru'  => []
                            ];
                        }

                        // PASTIKAN NIP DAN GURU_ID DIBAWA DI SINI UNTUK TAHAP 4
                        $dataMapel[$mapelKey]['list_guru'][] = [
                            'guru_id'         => $guruId, // ID utama
                            'nip'             => $nip,    // NIP untuk disave ke tabel relasi jika butuh
                            'nama_kelas'      => $kelasKey,
                            'tahun_ajaran_id' => $tahun_ajaran_id ?? null,
                            'beban_jam'       => $item['beban_jam']
                        ];
                    }
                }
            }

            // --- DAFTARKAN KELAS DARI WALI KELAS ---
            if (!empty($row['wali_kelas'])) {
                $rawWaliKelas = trim(preg_replace('/wali\s*kelas/i', '', $row['wali_kelas']));
                $waliKelasKey = str_replace(' ', '-', $rawWaliKelas);

                if ($waliKelasKey) {
                    if (!isset($dataKelas[$waliKelasKey])) {
                        $tingkat = null;
                        if (stripos($waliKelasKey, 'XII') !== false) $tingkat = 12;
                        elseif (stripos($waliKelasKey, 'XI') !== false) $tingkat = 11;
                        elseif (stripos($waliKelasKey, 'X') !== false) $tingkat = 10;

                        $dataKelas[$waliKelasKey] = [
                            'nama_kelas'      => $waliKelasKey,
                            'tingkat'         => $tingkat,
                            'id_wali_kelas'   => $guruId,
                            'tahun_ajaran_id' => $tahun_ajaran_id ?? null
                        ];
                    } else {
                        $dataKelas[$waliKelasKey]['id_wali_kelas'] = $guruId;
                        $dataKelas[$waliKelasKey]['tahun_ajaran_id'] = $tahun_ajaran_id ?? null;
                    }
                }
            }

            // --- HITUNG PROGRESS GURU ---
            $progress = round((($index + 1) / $totalData) * 60);

            echo "data: " . json_encode([
                'progress' => $progress,
                'message' => "Memproses Guru: $nama"
            ]) . "\n\n";

            flush();

        } catch (\Throwable $e) {
            echo "data: " . json_encode([
                'progress' => round((($index + 1) / $totalData) * 60),
                'message' => "ERROR di Baris " . ($index + 1) . ": " . $e->getMessage(),
                'error' => true
            ]) . "\n\n";
            flush();
            continue;
        }
    }

    // =========================================================================
    // TAHAP 2: PROSES PENYIMPANAN DATA MAPEL (Porsi 15%) -> Total 75%
    // =========================================================================
    $totalMapel = count($dataMapel);
    $mapelIndex = 0;

    if ($totalMapel > 0) {
        foreach ($dataMapel as $mapelData) {
            try {
                $mapelIndex++;
                $namaMapel = $mapelData['nama_mapel'];
                $namaMapelClean = str_replace(['(', ')'], '', $namaMapel);
                $namaMapelClean = trim(preg_replace('/\s+/', ' ', $namaMapelClean));
                $awalan = '';
                $pecahanKata = explode(' ', $namaMapelClean);

                if (count($pecahanKata) > 1) {
                    foreach ($pecahanKata as $kata) {
                        $kataKecil = strtolower($kata);
                        if ($kataKecil === 'indonesia') {
                            $awalan .= 'IND';
                        } elseif ($kataKecil === 'inggris') {
                            $awalan .= 'ING';
                        } else {
                            $awalan .= strtoupper(substr($kata, 0, 1));
                        }
                    }
                } else {
                    $awalan = strtoupper(substr($namaMapelClean, 0, 3));
                }

                MMapel::updateOrCreate(
                    ['nama_mapel' => $namaMapel],
                    ['kode_mapel' => $awalan]
                );

                $progress = 60 + round(($mapelIndex / $totalMapel) * 15);
                echo "data: " . json_encode([
                    'progress' => $progress,
                    'message' => "Menyimpan Mapel: " . $namaMapel . " (" . $awalan . ")"
                ]) . "\n\n";

                flush();
            } catch (\Throwable $e) {
                echo "data: " . json_encode([
                    'progress' => 60 + round(($mapelIndex / $totalMapel) * 15),
                    'message' => "ERROR Mapel " . $mapelData['nama_mapel'] . ": " . $e->getMessage(),
                    'error' => true
                ]) . "\n\n";
                flush();
            }
        }
    }

    // =========================================================================
    // TAHAP 3: PROSES PENYIMPANAN DATA KELAS (Porsi 15%) -> Total 90%
    // =========================================================================
    $totalKelas = count($dataKelas);
    $kelasIndex = 0;

    if ($totalKelas > 0) {
        foreach ($dataKelas as $kelasData) {
            try {
                $kelasIndex++;

                MKelas::updateOrCreate(
                    ['nama_kelas' => $kelasData['nama_kelas']],
                    [
                        'tingkat'         => $kelasData['tingkat'],
                        'id_wali_kelas'   => $kelasData['id_wali_kelas'], // Menampung guru_id
                    ]
                );

                $progress = 75 + round(($kelasIndex / $totalKelas) * 15);
                echo "data: " . json_encode([
                    'progress' => $progress,
                    'message' => "Menyimpan Kelas: " . $kelasData['nama_kelas']
                ]) . "\n\n";

                flush();
            } catch (\Throwable $e) {
                echo "data: " . json_encode([
                    'progress' => 75 + round(($kelasIndex / $totalKelas) * 15),
                    'message' => "ERROR Kelas " . $kelasData['nama_kelas'] . ": " . $e->getMessage(),
                    'error' => true
                ]) . "\n\n";

                flush();
            }
        }
    }

    // =========================================================================
    // TAHAP 4: PROSES MAPPING GURU, KELAS, MAPEL (Porsi Sisa 10%) -> Total 100%
    // =========================================================================
    $mappingIndex = 0;

    if ($totalMapel > 0) {
        foreach ($dataMapel as $mapelData) {
            try {
                $mappingIndex++;

                if (!empty($mapelData['list_guru'])) {
                    $mapel = MMapel::where('nama_mapel', $mapelData['nama_mapel'])->first();

                    foreach ($mapelData['list_guru'] as $mapping) {

                        $kelas = MKelas::where('nama_kelas', $mapping['nama_kelas'])->first();

                        if ($kelas) {
                            // 1. Buat relasi Guru dan Kelas (GUNAKAN guru_id SEBAGAI KUNCI)
                            $listGuru = TListGuru::updateOrCreate(
                                [
                                    'guru_id'         => $mapping['guru_id'], // MASUKKAN GURU ID
                                    'kelas_id'        => $kelas->id,
                                    'tahun_ajaran_id' => $mapping['tahun_ajaran_id'],
                                ],
                                [
                                    'nip'             => $mapping['nip'] // Opsional jika field nip tetap diisi
                                ]
                            );

                            // 2. Buat relasi Mapel ke List Guru (MASUKKAN GURU ID KE SINI JUGA)
                            TListGuruMapel::updateOrCreate(
                                [
                                    't_list_guru_id' => $listGuru->id,
                                    'mapel_id'       => $mapel->id
                                ],
                                [
                                    'guru_id'        => $mapping['guru_id'], // MASUKKAN GURU ID
                                    'nip'            => $mapping['nip'],
                                    'beban_jam'      => $mapping['beban_jam'],
                                ]
                            );
                        }
                    }
                }

                $progress = 90 + round(($mappingIndex / $totalMapel) * 10);
                echo "data: " . json_encode([
                    'progress' => $progress,
                    'message' => "Menyimpan Relasi Mapel: " . $mapelData['nama_mapel']
                ]) . "\n\n";

                flush();

            } catch (\Throwable $e) {
                echo "data: " . json_encode([
                    'progress' => 90 + round(($mappingIndex / $totalMapel) * 10),
                    'message' => "ERROR Mapping " . $mapelData['nama_mapel'] . ": " . $e->getMessage(),
                    'error' => true
                ]) . "\n\n";
                flush();
            }
        }
    }

    // --- SELESAI ---
    echo "data: " . json_encode([
        'progress' => 100,
        'message' => 'Selesai!',
        'done' => true
    ]) . "\n\n";

    flush();

}, 200, [
    'Cache-Control' => 'no-cache',
    'Content-Type' => 'text/event-stream',
    'X-Accel-Buffering' => 'no',
]);
    }
}