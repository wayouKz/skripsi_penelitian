<?php

namespace App\Http\Controllers\Admin\ManajemenAplikasi;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class KelolaInformasiInstansiController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ManajemenAplikasi/KelolaInformasiInstansi');
    }
}