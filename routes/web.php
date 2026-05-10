<?php

use App\Http\Controllers\Admin\ManajemenAplikasi\KelolaFiturAplikasiController;
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
use App\Http\Controllers\Admin\Master\SiswaController;
use App\Http\Controllers\Helper\GetDataController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
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
    });


    //role
    Route::prefix('manajemen')->name('manajemen.')->group(function () {

        Route::controller(RoleController::class)->prefix('/kelola-hak-akses', )->name('hak-akses.')->group(function () {
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
        });
    });
    //master
    Route::prefix('master')->name('master.')->group(function () {
        //guru
        Route::controller(GuruController::class)->prefix('/guru', )->name('guru.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::get('/getGuru',  'getGuru')->name('getGuru');
            Route::post('/store',  'store')->name('store');
            Route::post('/update',  'update')->name('update');
            Route::post('/delete/${id}',  'destroy')->name('destroy');
            Route::post('/update-status',  'updateStatus')->name('update-status');
        });

        Route::controller(SiswaController::class)->prefix('/siswa')->name('siswa.')->group(function () {
            Route::get('/',  'index')->name('index');
        });

    });

    Route::prefix('manajemen-aplikasi')->name('manajemen-aplikasi.')->group(function () {

        Route::controller(KelolaInformasiInstansiController::class)->prefix('/kelola-informasi-instansi', )->name('kelola-informasi-instansi.')->group(function () {
            Route::get('/',  'index')->name('index');
        });
        Route::controller(KelolaFiturAplikasiController::class)->prefix('/kelola-fitur-aplikasi', )->name('kelola-fitur-aplikasi.')->group(function () {
            Route::get('/',  'index')->name('index');
            Route::post('/update',  'update')->name('update');
        });
    });


    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
