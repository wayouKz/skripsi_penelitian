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
        'nama_instansi'      => $request->nama_instansi,
        'alamat_instansi'    => $request->alamat_instansi,
        'telepon_instansi'   => $request->telepon_instansi,
        'email_instansi'     => $request->email_instansi,
        'website_instansi'   => $request->website_instansi,
        'kepala_sekolah_id'  => $request->kepala_sekolah['value'] ?? null,

        // === WARNA TEMA ===
        'warna_primary'      => $request->warna_primary,
        'warna_primary_dark' => $request->warna_primary_dark,
        'warna_primary_light'=> $request->warna_primary_light,
        'warna_hex'          => $request->warna_hex,
        'nama_tema'          => $request->nama_tema,
    ];

    // 4. Proses Logo secara Dinamis
    if ($request->hasFile('logo_instansi')) {
        $logo = $request->file('logo_instansi');
        $logo_name = "logo_" . time() . "." . $logo->getClientOriginalExtension();

        if ($cekConfigurasi && $cekConfigurasi->logo_instansi) {
            $old_logo_path = 'public/logo/' . $cekConfigurasi->logo_instansi;
            if (Storage::exists($old_logo_path)) {
                Storage::delete($old_logo_path);
            }
        }

        $logo->storeAs('public/logo', $logo_name);
        $save['logo_instansi'] = $logo_name;
    }

    // 5. Proses Sampul secara Dinamis
    if ($request->hasFile('sampul_instansi')) {
        $sampul = $request->file('sampul_instansi');
        $sampul_name = "sampul_" . time() . "." . $sampul->getClientOriginalExtension();

        if ($cekConfigurasi && $cekConfigurasi->sampul_instansi) {
            $old_sampul_path = 'public/sampul_instansi/' . $cekConfigurasi->sampul_instansi;
            if (Storage::exists($old_sampul_path)) {
                Storage::delete($old_sampul_path);
            }
        }

        $sampul->storeAs('public/sampul_instansi', $sampul_name);
        $save['sampul_instansi'] = $sampul_name;
    }

    // --- PERBAIKAN DI SINI ---
    // Pastikan dicek apakah $cekConfigurasi ada (tidak null) sebelum mengambil 'card_img'
    $existingImages = $cekConfigurasi ? $cekConfigurasi->card_img : [];

    if (is_string($existingImages)) {
        $existingImages = json_decode($existingImages, true) ?? [];
    } elseif (!is_array($existingImages)) {
        $existingImages = [];
    }

    $save['card_img'] = $existingImages;

    for ($i = 1; $i <= 3; $i++) {
        $hasNewFile = $request->hasFile('foto_highlight_' . $i);
        $isDeleted = filter_var($request->input('hapus_foto_' . $i), FILTER_VALIDATE_BOOLEAN);

        if ($hasNewFile || $isDeleted) {

            // Hapus foto lama
            if (!empty($existingImages[$i - 1])) {
                $old_card_path = 'public/foto_highlight/' . $existingImages[$i - 1];
                if (Storage::exists($old_card_path)) {
                    Storage::delete($old_card_path);
                }
            }

            // Simpan foto baru atau null
            if ($hasNewFile) {
                $foto = $request->file('foto_highlight_' . $i);
                $foto_name = "foto_highlight_" . time() . "_" . $i . "." . $foto->getClientOriginalExtension();
                $foto->storeAs('public/foto_highlight', $foto_name);

                $save['card_img'][$i - 1] = $foto_name;
            } else {
                $save['card_img'][$i - 1] = null;
            }
        }
    }

    $save['card_img'] = json_encode($save['card_img']);
    // --- AKHIR PERBAIKAN ---

    // 6. Update atau Create data dengan array $save yang sudah dinamis
    if ($cekConfigurasi) {
        $cekConfigurasi->update($save);
    } else {
        Config::create($save);
    }

    return redirect()->back()->with('success', 'Konfigurasi berhasil disimpan!');
}
}
