<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Config;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MMapel;
use App\Models\WAHYU\MSiswa;
use App\Models\WAHYU\MTahunAjaran;
use App\Models\WAHYU\TJadwal;
use App\Models\WAHYU\TListGuru;
use App\Models\WAHYU\TListGuruMapel;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class LandingPageController extends Controller
{
    public function index(){
        $data['totalSiswa'] = MSiswa::getSiswaActive()->count();
        $data['totalGuru'] = MGuru::GetAllGuru()->count();
        $data['totalMapel'] = MMapel::getMapel()->count();
        $mapel = MMapel::getMapel()->get();
        $data['dataMapel'] = [];
            foreach($mapel as $m){
                $data['dataMapel'][] = [
                    'value' => $m->id,         // Sesuaikan dengan primary key atau kode mapel Anda
                    'label' => $m->nama_mapel  // Sesuaikan dengan kolom nama mata pelajaran
                ];
            }
        $tahunAjaraAktif = MTahunAjaran::getTahunAjaranAktif();
        $data['dataGuruMapel'] = MMapel::mapGuruMapel($tahunAjaraAktif->id);
        $data['dataSiswa'] = MSiswa::getSiswaActive();
        $data['dataGuru'] = MGuru::GetAllGuru()->get();
        $data['dataJadwal'] = TJadwal::getJadwalByTahunAjaran($tahunAjaraAktif->id);
        return Inertia::render('LandingPage/Welcome', [
        'canLogin' => Route::has('login'),
        'data' => $data,
        'config' => Config::first(),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
    }
}
