<?php

use App\Http\Controllers\Admin\ManajemenAplikasi\GenerativeAI;
use App\Http\Controllers\Admin\ManajemenAplikasi\KelolaFiturAplikasiController;
use App\Http\Controllers\Akademik\JurnalMengajarController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Helper\SearchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Config\InstalerController;
use App\Http\Controllers\Admin\Master\RoleController;
use App\Http\Controllers\Admin\Master\GuruController;
use App\Http\Controllers\Admin\ManajemenAplikasi\KelolaUserController;
use App\Http\Controllers\Admin\ManajemenAplikasi\KelolaInformasiInstansiController;
use App\Http\Controllers\Admin\ManajemenAplikasi\KelolaInformasiHakAksesController;
use App\Http\Controllers\Admin\Master\JurusanController;
use App\Http\Controllers\Admin\Master\SiswaController;
use App\Http\Controllers\Akademik\AbsenController;
use App\Http\Controllers\Akademik\PenilaianController;
use App\Http\Controllers\Akademik\KelasDiAmpuController;
use App\Http\Controllers\Helper\DevController;
use App\Http\Controllers\Helper\GetDataController;
use App\Http\Controllers\Helper\Pdf;
use App\Http\Controllers\Master\JadwalController;
use App\Http\Controllers\Master\KelasController;
use App\Http\Controllers\Master\MapelController;
use App\Http\Controllers\Master\TahunAjaranController;
use App\Models\Config;

Route::get('/', function () {
    return redirect()->route('login');
    // return Inertia::render('Welcome', [
    //     'canLogin' => Route::has('login'),
    //     'config' => Config::first(),
    //     'canRegister' => Route::has('register'),
    //     'laravelVersion' => Application::VERSION,
    //     'phpVersion' => PHP_VERSION,
    // ]);
});

Route::prefix('install')->group(function () {
    Route::get('/', [InstalerController::class, 'index'])->name('install');
    Route::post('/installer', [InstalerController::class, 'setup'])->name('install.store');
    Route::get('/migrate', [InstalerController::class, 'migrate'])->name('install.migrate');
    Route::get('/setup-migrate', [InstalerController::class, 'setUpMigrate'])->name('install.setup-migrate');
    Route::get('/configure', [InstalerController::class, 'configure'])->name('install.configure');
    Route::post('/configure-post', [InstalerController::class, 'configureStore'])->name('install.configure.store');
});
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');
Route::middleware('auth')->group(function () {

    //search

    Route::controller(GetDataController::class)->prefix('getData')->name('getData.')->group(function () {
        Route::get('/list-feature',  'getListFeatureByRole')->name('list-feature');
        Route::get('/get-list-feature',  'getListFeature')->name('get-list-feature');
        Route::get('/kelas',  'getKelas')->name('get-kelas');
        Route::get('/cek-siswa-tahun-ajaran',  'cekSiswaTahunAjaran')->name('cek-siswa');
        Route::get('/get-Mapel-Guru',  'getMapelGuru')->name('get-mapel-guru');
        Route::get('/get-list-guru',  'getListGuru')->name('get-list-guru');
        Route::get('get-kelas-siswa',  'getKelasSiswa')->name('get-kelas-siswa');
        Route::get('get-kelas-siswa-unmapped',  'getKelasSiswaUnmapped')->name('get-list-siswa-unmapped');
        Route::get('get-tahun-ajaran',  'getTahunAjaran')->name('get-tahun-ajaran');
        Route::get('get-kelas-tujuan',  'getKelasTujuan')->name('get-kelas-tujuan');
        Route::get('siswa-in-kelas',  'getSiswaInKelas')->name('siswa-in-kelas');
        Route::get('get-cek-kelas-tujuan',  'cekKelasTujuan')->name('cek-kelas-tujuan');
        Route::get('get-siswa-alumni',  'getSiswaAlumni')->name('get-siswa-alumni');
        Route::get('get-history-jadwal',  'getHistoryJadwal')->name('get-history-jadwal');
        Route::get('get-guru-pengampu-kelas',  'getGuruPengampuKelas')->name('get-guru-pengampu-kelas');
        Route::get('get-Siswa-PerKelas',  'getSiswaPerKelas')->name('getSiswaPerKelas');
        Route::get('get-mapel-guru-kelas',  'getMapelGuruKelas')->name('get-mapel-guru-kelas');
        Route::get('get-jadwal-guru-kelas',  'getJadwalGuruKelas')->name('get-jadwal-guru-kelas');
        Route::get('get-history-absensi',  'getHistoryAbsensi')->name('get-history-absensi');
        Route::get('get-kelas-aktif',  'getKelasAktif')->name('get-kelas-aktif');
        Route::get('get-jadwal-perguru',  'getJadwalPerGuru')->name('get-jadwal-perguru');
        Route::get('get-siswa-perwalian',  'getSiswaPerwalian')->name('get-siswa-perwalian');
        Route::get('get-total-jam',  'getTotalJam')->name('get-total-jam');
        Route::get('/cek-data-mapel',  'cekDataMapel')->name('cek-data-mapel');
    });

    Route::controller(Pdf::class)->prefix('pdf')->name('pdf.')->group(function () {
        Route::get('/jadwal',  'jadwal')->name('jadwal');
        Route::get('/guru-mapel',  'guruMapel')->name('pdfGuruMapel');
        Route::get('/absensi-pdf',  'absensiPdf')->name('absensi_pdf');
    });


    //role
    Route::prefix('manajemen')->name('manajemen.')->group(function () {

        Route::controller(RoleController::class)->prefix('/kelola-hak-akses', )->name('kelola-hak-akses.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::get('/getHakAkses',  'getRole')->name('getHakAkses');
            Route::post('/update-status',  'updateStatus')->name('update-status');
            Route::post('/store',  'store')->name('store');
            Route::post('/update',  'update')->name('update');
            Route::post('/delete',  'delete')->name('destroy');
        });

        Route::controller(KelolaUserController::class)->prefix('/kelola-user', )->name('kelola-user.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::get('/getUser',  'getUser')->name('getUser');
            Route::post('/reset-password',  'resetPassword')->name('reset-password');
            Route::post('/update/{id}',  'update')->name('update');
            Route::post('/update-status',  'update_status')->name('update-status');
            Route::post('/store',  'store')->name('store');
            Route::post('/delete/{id}',  'destroy')->name('destroy');
        });

        Route::controller(GenerativeAI::class)->prefix('/generative-ai', )->name('generative-ai.')->group(function () {
            Route::post('/recomendation-guru',  'RecomendationGuru')->name('recomendation-guru');
        });
    });
    //master
    Route::prefix('master')->name('master.')->group(function () {
        //guru
        Route::controller(GuruController::class)->prefix('/guru', )->name('guru.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::get('/getGuru',  'getGuru')->name('getGuru');
            Route::get('/getWaliKelas',  'getWaliKelas')->name('getWaliKelas');
            Route::post('/store',  'store')->name('store');
            Route::post('/update',  'update')->name('update');
            Route::post('/delete/{id}',  'destroy')->name('destroy');
            Route::post('/update-status',  'updateStatus')->name('update-status');
            Route::post('/mapping-mappel',  'mappingGuruMapel')->name('mapping-mappel');
            Route::get('/get-guru-mapel',  'DataGuruMapel')->name('getGuruMapel');
        });

        Route::controller(SiswaController::class)->prefix('/siswa')->name('siswa.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::post('/store',  'store')->name('store');
            Route::post('/update',  'update')->name('update');
            Route::post('/delete/{id}',  'destroy')->name('destroy');
            Route::get('/getSiswa',  'getSiswa')->name('getSiswa');
            Route::post('mapping-kelas-siswa',  'mappingKelasSiswa')->name('mapping-kelas');
            Route::post('/proses-kenaikan',  'prosesKenaikan')->name('proses-kenaikan');
            Route::post('/import-siswa', 'importSiswa')->name('import-siswa');
        });

        Route::controller(TahunAjaranController::class)->prefix('/tahun-ajaran')->name('tahun-ajaran.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::get('/getTahunAjaran',  'getTahunAjaran')->name('getTahunAjaran');
            Route::post('/store',  'store')->name('store');
            Route::post('/update',  'update')->name('update');
        Route::post('/import-sk',  'ProsesImportSK')->name('import-sk');

        });

        Route::controller(KelasController::class)->prefix('/kelas')->name('kelas.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::get('/mapping-kelas/{namaKelas}',  'mappingKelas')->name('mappingKelas');
            Route::get('/getKelas',  'getKelas')->name('getKelas');
            Route::get('/getWaliKelas',  'getWaliKelas')->name('getWaliKelas');
            Route::get('/getSiswaPerTahunAjaran/{id_tahun_ajaran}/{kelas_id}',  'getSiswaPerTahunAjaran')->name('getSiswaPerTahunAjaran');
            Route::post('/store',  'store')->name('store');
            Route::post('/update',  'update')->name('update');
            Route::post('/destroy',  'destroy')->name('destroy');
            Route::post('/update-status',  'update-status')->name('update');
        });

        Route::controller(JurusanController::class)->prefix('/jurusan')->name('jurusan.')->group(function () {
            Route::get('/get-jurusan',  'getJurusan')->name('getJurusan');
            Route::post('/store',  'store')->name('store');
            Route::post('/update',  'update')->name('update');
            Route::post('/destroy',  'destroy')->name('destroy');
        });

        Route::controller(MapelController::class)->prefix('/mapel')->name('mapel.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::get('/get-mapel',  'getMapel')->name('getMapel');
            Route::post('/store',  'store')->name('store');
            Route::post('/update',  'update')->name('update');
            Route::post('/destroy/{id}',  'destroy')->name('destroy');
        });
        Route::controller(JadwalController::class)->prefix('/generate-jadwal')->name('generate-jadwal.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::post('/store',  'generate')->name('store');
        });

    });

    Route::prefix('akademik')->name('akademik.')->group(function () {
        Route::controller(AbsenController::class)->prefix('/absensi', )->name('absensi.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::post('/store',  'store')->name('store');
        });

        Route::controller(KelasDiAmpuController::class)->prefix('/kelas-diampu', )->name('kelas-diampu.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::get('/{id}',  'show')->name('detail');
        });

        Route::controller(JurnalMengajarController::class)->prefix('/jurnal', )->name('jurnal.')->group(function () {
            Route::get('/',  'index')->name('index');
        });

        Route::controller(PenilaianController::class)->prefix('/penilaian', )->name('penilaian.')->group(function () {
            Route::get('/',  'index')->name('index');
        });
    });
    Route::prefix('manajemen-aplikasi')->name('manajemen-aplikasi.')->group(function () {

        Route::controller(KelolaInformasiInstansiController::class)->prefix('/kelola-informasi-instansi', )->name('kelola-informasi-instansi.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::post('/store',  'store')->name('store');
        });
    });


    Route::controller(DevController::class)->prefix('/developer', )->name('dev.')->group(function () {
       Route::get('/cek-bentrok-jadwal',  'cekBentrokJadwal')->name('cek-bentrok-jadwal');
       Route::get('/cek-target-jam-mengajar',  'cekTargetJamMengajar')->name('cek-target-jam-mengajar');
       Route::get('/cek-beban-jam-mengajar-per-kelas',  'cekBebanJamMengajarPerKelas')->name('cek-beban-jam-mengajar-per-kelas');
    });
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';