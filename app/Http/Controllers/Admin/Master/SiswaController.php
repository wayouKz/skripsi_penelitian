<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use App\Models\TAlumni;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MSiswa;
use App\Models\WAHYU\TListSiswa;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SiswaController extends Controller
{
    public function index(){
        return Inertia::render('Admin/Master/Siswa/Siswa');
    }

    public function store(Request $request){
        $request->validate([
           'nisn' => 'required|numeric',
           'nama_siswa' => 'required',
           'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
           'tempat_lahir' => 'required',
           'tanggal_lahir' => 'required',
           'alamat' => 'required',
           'no_telp' => 'required|numeric',
           'no_telp_orang_tua' => 'required|numeric',
        ]);

        $foto = $request->file('foto');

        if($foto){
            $foto_name = $foto->getClientOriginalName();
            $foto->storeAs('public/foto', $foto_name);
        }else{
            $foto_name = null;
            // return redirect()->route('master.siswa.index')->with('error', 'Foto Tidak Boleh Kosong');
        }

        $siswa = MSiswa::create([
            'nisn' => $request->nisn,
            'nama_siswa' => $request->nama_siswa,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_telp' => $request->no_telp,
            'no_telp_orang_tua' => $request->no_telp_orang_tua,
            'foto' => $foto_name
        ]);

        if($siswa){
            return redirect()->route('master.siswa.index')->with('success', 'Data Berhasil Ditambahkan');
        } else {
            return redirect()->route('master.siswa.index')->with('error', 'Data Gagal Ditambahkan');
        }
    }

    public function getSiswa(){
        $siswa = MSiswa::get();
        if($siswa){
            return response()->json([
                'success' => true,
                'data' => $siswa
            ]);
        }else if(!$siswa){
            return response()->json([
                'success' => false,
                'message' => 'Data Tidak Ditemukan'
            ]);
        }
    }

    public function update(Request $request){
        $request->validate([
            'nisn' => 'required|numeric',
            'nama_siswa' => 'required',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'tempat_lahir' => 'required',
            'tanggal_lahir' => 'required',
            'alamat' => 'required',
            'no_telp' => 'required|numeric',
            'no_telp_orang_tua' => 'required|numeric',
        ]);

        $siswa = MSiswa::where('id', $request->id)->first();

        if(!$siswa){
            return redirect()->route('master.siswa.index')->with('error', 'Data Tidak Ditemukan');
        }

        $foto = $request->file('foto');

        if($foto){
            $foto_name = $foto->getClientOriginalName();
            $foto->storeAs('public/foto', $foto_name);
        }else{
            $foto_name = null;
            // return redirect()->route('master.siswa.index')->with('error', 'Foto Tidak Boleh Kosong');
        }

        $siswa->update([
            'nama_siswa' => $request->nama_siswa,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_telp' => $request->no_telp,
            'no_telp_orang_tua' => $request->no_telp_orang_tua,
            'foto' => $foto_name
        ]);

        if($siswa){
            return redirect()->route('master.siswa.index')->with('success', 'Data Berhasil Diupdate');
        } else {
            return redirect()->route('master.siswa.index')->with('error', 'Data Gagal Diupdate');
        }
    }

    public function destroy($id){
        $siswa = MSiswa::where('id', $id)->first();

        if(!$siswa){
            return response()->json([
                'success' => false,
                'message' => 'Data Tidak Ditemukan'
            ],200);
        }

        $siswa->delete();

        if($siswa){
        return response()->json([
            'success' => true,
            'message' => 'Data Berhasil Dihapus'
        ],200);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Data Gagal Dihapus'
            ],200);
        }
    }

  public function mappingKelasSiswa(Request $request) {
    DB::beginTransaction();
    try {
        $payload = $request->payload;

        // Variabel untuk melacak siswa dan kelas yang disinkronisasi
        $semuaNisnMapped = [];
        $semuaKelasID = [];
        $tahunAjaranGlobal = null;

        foreach ($payload as $index => $value) {
            $kelasID = $value['kelas_id'];
            $tahunAjaran = $value['tahun_ajaran'];
            $siswa = $value['siswa_ids'];

            $semuaKelasID[] = $kelasID;
            $tahunAjaranGlobal = $tahunAjaran; // Simpan untuk fungsi delete di bawah

            foreach ($siswa as $s) {
                // Kumpulkan semua NISN yang ditarik ke dalam kelas
                $semuaNisnMapped[] = $s['nisn'];
                // updateOrCreate:
                // Cari data berdasarkan [tahun_ajaran_id, nisn]
                // Jika ketemu -> Update kelas_id (Berguna jika siswa DIPINDAHKAN antar kelas)
                // Jika tidak ketemu -> Create data baru
                TListSiswa::updateOrCreate(
                    [
                        'tahun_ajaran_id' => $tahunAjaran,
                        'nisn' => $s['nisn']
                    ],
                    [
                        'kelas_id' => $kelasID,
                        'nama_siswa' => $s['nama_siswa'] ?? null,
                        // Gunakan null coalescing (??) agar tidak error jika dari frontend tidak dikirim
                    ]
                );
            }
        }

        // FUNGSI PEMBERSIH (HAPUS SISWA YANG DIKELUARKAN DARI KELAS)
        // Cari siswa di tahun ajaran & kelas tersebut yang NISN-nya TIDAK ADA di payload
        if ($tahunAjaranGlobal && count($semuaKelasID) > 0) {
            TListSiswa::where('tahun_ajaran_id', $tahunAjaranGlobal)
                ->whereIn('kelas_id', $semuaKelasID)
                ->whereNotIn('nisn', $semuaNisnMapped)
                ->delete();
        }

        DB::commit();

        return response()->json([
            'msg'     => 'Data pemetaan kelas berhasil disimpan',
            'success' => true
        ], 200);

    } catch(Exception $e) {
        DB::rollBack();
        return response()->json([
            'msg'     => 'Gagal menyimpan data: ' . $e->getMessage(),
            'success' => false
        ], 500);
    }
  }

  public function prosesKenaikan(Request $request)
{
    // Validasi input
    $request->validate([
        'tahun_ajaran_tujuan_id' => 'required',
        'siswa_ids'              => 'required|array',
    ]);

    DB::beginTransaction();
    try {
        $taTujuan    = $request->tahun_ajaran_tujuan_id;
        $kelasTujuan = $request->kelas_tujuan_id;
        $siswaList   = $request->siswa_ids; // Array dari [{nisn, nama_siswa}]
        $tahunAjaranAsal = $request->tahun_ajaran_asal_id;
        // 1. Jika Kelas Tujuan adalah "LULUS"
       if (is_null($kelasTujuan) || $kelasTujuan === 'LULUS') {
            foreach ($siswaList as $siswa) {
                // Update status di tabel t_list_siswas agar tidak lagi muncul di mapping kelas
                TListSiswa::where('nisn', $siswa['nisn'])
                    ->update(['status' => 'alumni']);
                TAlumni::updateOrCreate([
                    'lulus_tahun_ajaran' => $tahunAjaranAsal,
                    'nisn'            => $siswa['nisn'],
                ]);
            }
        }
        // 2. Jika Kelas Tujuan adalah Kelas Baru (Naik Tingkat)
        else {
            foreach ($siswaList as $siswa) {
                // Gunakan updateOrCreate untuk memindahkan siswa
                // Kuncinya adalah kombinasi tahun_ajaran_id + nisn
                TListSiswa::updateOrCreate(
                    [
                        'tahun_ajaran_id' => $taTujuan,
                        'nisn'            => $siswa['nisn'] ?? null,
                        'siswa_id'              => $siswa['siswa_id'] ?? null, // Optional: jika ada ID dari frontend
                    ],
                    [
                        'kelas_id'   => $kelasTujuan,
                        'nama_siswa' => $siswa['nama_siswa'],
                        'status'     => 'siswa_aktif', // Set status menjadi Aktif di tahun ajaran baru
                    ]
                );
            }
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'msg'     => $kelasTujuan === 'LULUS'
                         ? 'Siswa telah berhasil diluluskan.'
                         : 'Kenaikan kelas berhasil diproses.'
        ], 200);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'msg'     => 'Terjadi kesalahan: ' . $e->getMessage()
        ], 500);
    }
}
public function importSiswa(Request $request)
    {
        $file = $request->file('fileExcel');
        $tahun_ajaran_id = $request->tahun_ajaran_id;

        $xlsxPath = $file->getRealPath();
        $tempDir = storage_path('app/temp/' . uniqid());
        if (!file_exists($tempDir)) mkdir($tempDir, 0777, true);

        $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($xlsxPath);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($xlsxPath);
        $sheetNames = $spreadsheet->getSheetNames();

        $dataSiswa = [];
        $genderMap = [];

        // ==============================================================================
        // LANGKAH 1: PENCERDASAN SCANNER JENIS KELAMIN DI SEMUA SHEET
        // ==============================================================================
        foreach ($sheetNames as $sheetName) {
            if (in_array($sheetName, ['X', 'XI & XII', 'Tanpa NIM', 'data-export'])) continue;

            $sheet = $spreadsheet->getSheetByName($sheetName);
            if (!$sheet) continue;

            $sheetData = $sheet->toArray(null, true, true, true);

            foreach ($sheetData as $row) {
                // Ubah baris menjadi array nilai murni untuk disapu bersih isinya
                $rowValues = array_values(array_filter($row, function($val) {
                    return !is_null($val) && trim($val) !== '';
                }));

                $detectedName = null;
                $detectedGender = null;

                // Cari string nama (panjang karakter > 3) dan kode gender ('L' / 'P') dalam satu baris yang sama
                foreach ($rowValues as $val) {
                    $cleanVal = trim($val);
                    $upperVal = strtoupper($cleanVal);

                    // Jika ketemu kode gender tunggal L atau P
                    if (in_array($upperVal, ['L', 'P']) && !$detectedGender) {
                        $detectedGender = ($upperVal === 'L') ? 'Laki-Laki' : 'Perempuan';
                    }
                    // Jika teks cukup panjang dan bukan angka/simbol, asumsikan itu Nama Siswa
                    elseif (strlen($cleanVal) > 3 && !is_numeric($cleanVal) && !$detectedName) {
                        // Pastikan bukan judul header
                        if (strpos($upperVal, 'DAFTAR') === false && strpos($upperVal, 'TP.') === false) {
                            $detectedName = $cleanVal;
                        }
                    }
                }

                // Jika nama dan gender klop dalam satu baris, masukkan ke peta memori
                if ($detectedName && $detectedGender) {
                    $genderMap[$detectedName] = $detectedGender;
                }
            }
        }

        // ==============================================================================
        // LANGKAH 2: AMBIL DATA UTAMA (NAMA, NISN, KELAS) LALU COCOKKAN
        // ==============================================================================
        foreach ($sheetNames as $sheetName) {
            if (!in_array($sheetName, ['X', 'XI & XII', 'Tanpa NIM'])) continue;

            $sheet = $spreadsheet->getSheetByName($sheetName);
            if (!$sheet) continue;

            $sheetData = $sheet->toArray(null, true, true, true);

            foreach ($sheetData as $rowIndex => $row) {
                $namaSiswa = isset($row['A']) ? trim($row['A']) : '';
                $nisn      = isset($row['B']) ? trim($row['B']) : null;
                $kelasAsli = isset($row['C']) ? trim($row['C']) : '';

                if (empty($namaSiswa) || empty($kelasAsli)) continue;

                $kelasFormatted = str_replace('.', '-', $kelasAsli);

                // Ambil dari memori hasil pemindaian cerdas, fallback ke 'Belum Ditentukan'
                $jenisKelamin = isset($genderMap[$namaSiswa]) ? $genderMap[$namaSiswa] : 'Belum Ditentukan';

                $dataSiswa[] = [
                    'nama'            => $namaSiswa,
                    'nisn'            => $nisn,
                    'jenis_kelamin'   => $jenisKelamin,
                    'kelas'           => $kelasFormatted,
                ];
            }
        }

        $data = [
            "dataSiswa" => $dataSiswa,
            "tahun_ajaran_id" => $tahun_ajaran_id
        ];

        return response()->stream(function () use ($data) {
            set_time_limit(0);
            if (ob_get_level() > 0) ob_end_clean();

            try {
                $mapKelas = MKelas::pluck('id', 'nama_kelas')->toArray();
                $tahunAjaranId = $data['tahun_ajaran_id'];
                $totalSiswa = count($data['dataSiswa']);

                foreach ($data['dataSiswa'] as $ind => $val) {
                    try {
                        // Simpan / Update ke database MSiswa
                        $siswa = MSiswa::updateOrCreate(
                            ['nama_siswa' => $val['nama']],
                            [
                                'nisn'          => $val['nisn'],
                                'jenis_kelamin' => $val['jenis_kelamin']
                            ]
                        );
                        $siswa_id = $siswa->id;
                        $namaKelasExcel = $val['kelas'];

                        if (!isset($mapKelas[$namaKelasExcel])) {
                            throw new \Exception("Kelas '{$namaKelasExcel}' tidak ditemukan.");
                        }

                        // Simpan relasi ke TListSiswa
                        TListSiswa::updateOrCreate(
                            [
                                'tahun_ajaran_id' => $tahunAjaranId,
                                'siswa_id'        => $siswa_id,
                            ],
                            [
                                'kelas_id'        => $mapKelas[$namaKelasExcel],
                                'nama_siswa'      => $val['nama'],
                            ]
                        );

                        $progress = round((($ind + 1) / $totalSiswa) * 100);
                        echo json_encode([
                            'status'   => 'success',
                            'message'  => "Disimpan: {$val['nama']} ({$val['jenis_kelamin']})",
                            'progress' => $progress
                        ]) . "\n";

                    } catch (\Exception $e) {
                        $progress = round((($ind + 1) / $totalSiswa) * 100);
                        echo json_encode([
                            'status'   => 'error',
                            'message'  => "Error {$val['nama']}: " . $e->getMessage(),
                            'progress' => $progress
                        ]) . "\n";
                    }

                    if (ob_get_level() > 0) ob_flush();
                    flush();
                }
            } catch (\Exception $e) {
                echo json_encode(['status' => 'fatal_error', 'message' => $e->getMessage()]) . "\n";
                if (ob_get_level() > 0) ob_flush();
                flush();
            }
        }, 200, [
            'Cache-Control' => 'no-cache',
            'Content-Type'  => 'application/x-ndjson',
            'Connection'    => 'keep-alive',
        ]);
    }
}