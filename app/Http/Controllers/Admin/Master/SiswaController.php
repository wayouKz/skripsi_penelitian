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
                        'nisn'            => $siswa['nisn']
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
        $dataKelas = []; // Pastikan inisialisasi array ini

        // 1. Looping semua sheet yang ada di file Excel
        foreach ($sheetNames as $sheetName) {
            // Jika kamu hanya ingin mengekstrak sheet absensi (X1 - X15) dan mengabaikan sheet 'Nilai' atau 'Kelas'
            if (strpos($sheetName, 'Nilai') !== false || $sheetName === 'Kelas') {
                continue;
            }

            // Panggil sheet menggunakan NAMA ASLI DARI EXCEL (misal: "X1")
            $sheet = $spreadsheet->getSheetByName($sheetName);

            // Format nama sheet HANYA untuk kebutuhan database (misal: jadi "X-1")
            $sheetNameFormatted = preg_replace('/([a-zA-Z]+)(\d+)/', '$1-$2', $sheetName);

            // 2. Ubah seluruh data di sheet tersebut menjadi Array (dengan key abjad kolom A, B, C...)
            $sheetData = $sheet->toArray(null, true, true, true);

            // 3. Looping data per baris (Data siswa dimulai dari baris ke-3)
            foreach ($sheetData as $rowIndex => $row) {
                // Lewati baris 1 dan 2 karena itu adalah header (Tanggal / Pertemuan)
                if ($rowIndex < 3) continue;

                $no = $row['A'];
                $namaSiswa = $row['B'];

                // Jika kolom nama kosong, berarti data di sheet tersebut sudah habis
                if (empty($namaSiswa)) {
                    continue;
                }

                // 4. Masukkan data yang relevan ke dalam array utama
                $dataSiswa[] = [
                    'no'              => $no,
                    'nama'            => $namaSiswa,
                    'kelas'           => $sheetNameFormatted, // Gunakan nama yang ada stripnya untuk DB
                    'tahun_ajaran_id' => $tahun_ajaran_id,
                ];

                $dataKelas[] = [
                    'tahun_ajaran_id' => $tahun_ajaran_id,
                    'kelas'           => $sheetNameFormatted // Sebaiknya gunakan yang sudah diformat juga
                ];
            }
        }

        unlink($xlsxPath);

        $data = [
            "dataSiswa" => $dataSiswa,
        ];
      return response()->stream(function () use ($data, $request) {
    set_time_limit(0);

    if (ob_get_level() > 0) {
        ob_end_clean();
    }

    try {
        $mapKelas = MKelas::pluck('id', 'nama_kelas')->toArray();
        $tahunAjaranId = $data['tahun_ajaran_id'] ?? $request->tahun_ajaran_id;

            $totalSiswa = count($data['dataSiswa']);

        foreach ($data['dataSiswa'] as $ind => $val) {
            try {
                // 1. Dapatkan ID Siswa secara langsung
                $siswa = MSiswa::updateOrCreate(
                    ['nama_siswa' => $val['nama']],
                    ['jenis_kelamin' => 'Laki-laki']
                );
                $siswa_id = $siswa->id;

                $namaKelasExcel = $val['kelas'];

                if (!isset($mapKelas[$namaKelasExcel])) {
                    // Jika kelas tidak ditemukan, lempar error agar masuk ke catch
                    throw new \Exception("Kelas '{$namaKelasExcel}' tidak ditemukan.");
                }

                // 2. Dapatkan ID Kelas
                $kelas_id = $mapKelas[$namaKelasExcel];

                // 3. Simpan ke TListSiswa
                TListSiswa::updateOrCreate(
                    [
                        'tahun_ajaran_id' => $tahunAjaranId,
                        'siswa_id'        => $siswa_id,
                    ],
                    [
                        'kelas_id'        => $kelas_id,
                        'nama_siswa'      => $val['nama'],
                    ]
                );

                // 4. Hitung progres saat ini
                $progress = round((($ind + 1) / $totalSiswa) * 100);

                // Kirim response JSON sukses dengan format yang diminta JS
                echo json_encode([
                    'message'  => "Berhasil menyimpan: {$val['nama']}",
                    'progress' => $progress
                ]) . "\n";

            } catch (\Exception $e) {
                // Hitung progres meskipun terjadi error agar bar progres tidak berhenti
                $progress = round((($ind + 1) / $totalSiswa) * 100);

                // Kirim response JSON error ke frontend
                echo json_encode([
                    'message'  => "Error pada {$val['nama']}: " . $e->getMessage(),
                    'progress' => $progress
                ]) . "\n";
            }

            // Dorong data ke browser secara realtime
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
        }
    } catch (\Exception $e) {
        // Tangkap error fatal di luar loop (misal gagal ambil data kelas)
        echo json_encode([
            'status'  => 'fatal_error',
            'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
        ]) . "\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }
}, 200, [
    'Cache-Control' => 'no-cache',
    'Content-Type'  => 'application/x-ndjson',
    'Connection'    => 'keep-alive',
]);
    }
}
