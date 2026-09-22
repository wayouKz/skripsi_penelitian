<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\List_Feature;
use App\Models\WAHYU\MGuru;
use App\Models\WAHYU\MKelas;
use App\Models\WAHYU\MMapel;
use App\Models\WAHYU\MSiswa;
use Gemini;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $Guru = MGuru::where('status','active')->count();
        $Siswa = MSiswa::where('status','active')->count();
        $Kelas = MKelas::where('status','active')->count();
        $Mapel = MMapel::where('status','active')->count();

        $total = [
            'Guru' => $Guru,
            'Siswa' => $Siswa,
            'Kelas' => $Kelas,
            'Mapel' => $Mapel
        ];

        return Inertia::render('Dashboard/Dashboard',compact('total'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

}
