<?php

namespace App\Http\Controllers\Admin\ManajemenAplikasi;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Config;
use Illuminate\Support\Facades\Storage;

class KelolaInformasiInstansiController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ManajemenAplikasi/KelolaInformasiInstansi');
    }
        public function store(Request $request)
{
    // 1. Tambahkan validasi agar lebih aman (terutama untuk file)
    $request->validate([
        'nama_instansi'   => 'required|string|max:255',
    ]);

    // 2. Cek apakah konfigurasi sudah ada di database
    $cekConfigurasi = Config::first();

    // 3. Siapkan data dasar yang selalu disimpan/diupdate (selain file)
    $save = [
        'nama_instansi'    => $request->nama_instansi,
        'alamat_instansi'  => $request->alamat_instansi,
        'telepon_instansi' => $request->telepon_instansi,
        'email_instansi'   => $request->email_instansi,
        'website_instansi' => $request->website_instansi,
    ];

    // 4. Proses Logo secara Dinamis (Hanya jika ada file yang diunggah)
    if ($request->hasFile('logo_instansi')) {
        $logo = $request->file('logo_instansi');
        // Tambahkan time() agar nama unik dan tidak terkena cache browser
        $logo_name = "logo_" . time() . "." . $logo->getClientOriginalExtension();

        // Hapus logo lama dari storage jika ada
        if ($cekConfigurasi && $cekConfigurasi->logo_instansi) {
            $old_logo_path = 'public/logo/' . $cekConfigurasi->logo_instansi;
            if (Storage::exists($old_logo_path)) {
                Storage::delete($old_logo_path);
            }
        }

        // Simpan logo baru dan masukkan ke array $save
        $logo->storeAs('public/logo', $logo_name);
        $save['logo_instansi'] = $logo_name;
    }

    // 5. Proses Sampul secara Dinamis (Hanya jika ada file yang diunggah)
    if ($request->hasFile('sampul_instansi')) {
        $sampul = $request->file('sampul_instansi');
        // Tambahkan time() agar nama unik
        $sampul_name = "sampul_" . time() . "." . $sampul->getClientOriginalExtension();

        // Hapus sampul lama dari storage jika ada
        if ($cekConfigurasi && $cekConfigurasi->sampul_instansi) {
            $old_sampul_path = 'public/sampul_instansi/' . $cekConfigurasi->sampul_instansi;
            if (Storage::exists($old_sampul_path)) {
                Storage::delete($old_sampul_path);
            }
        }

        // Simpan sampul baru dan masukkan ke array $save
        $sampul->storeAs('public/sampul_instansi', $sampul_name);
        $save['sampul_instansi'] = $sampul_name;
    }

    // 6. Update atau Create data dengan array $save yang sudah dinamis
    if ($cekConfigurasi) {
        $cekConfigurasi->update($save);
    } else {
        Config::create($save);
    }

    return redirect()->back()->with('success', 'Konfigurasi berhasil disimpan!');
    }
}