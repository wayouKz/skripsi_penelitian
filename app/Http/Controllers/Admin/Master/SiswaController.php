<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiswaController extends Controller
{
    public function index(){
        return Inertia::render('Admin/Master/Siswa/Siswa');
    }
}
