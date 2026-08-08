<style>
.kop-surat {
    width: 100%;
    border-bottom: 3px double #000;
    padding-bottom: 8px;
    margin-bottom: 20px;
}

.kop-surat h1 {
    font-size: 16px;
    margin: 0;
    text-transform: uppercase;
    font-weight: bold;
}

.kop-surat p {
    font-size: 11px;
    margin: 2px 0 0;
}
</style>

<table class="kop-surat" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <!-- 1. Kolom Logo Kiri (Lebar 15%) -->
        <td width="15%" style="text-align: left; vertical-align: middle;">
            <img src="{{ public_path('storage/public/logo/' . $instansi->logo_instansi) }}"
                style="width: 70px; height: auto;" alt="Logo Instansi">
        </td>

        <!-- 2. Kolom Teks Tengah (Lebar 70% - Presisi di Tengah Halaman) -->
        <td width="70%" style="text-align: center; vertical-align: middle;">
            <h1>{{ $instansi->nama_instansi }}</h1>
            <p>{{ $instansi->alamat_instansi }}</p>
            <p>Telepon: {{ $instansi->telepon_instansi }} | Website: <i>{{ $instansi->website_instansi }}</i></p>
        </td>

        <!-- 3. Kolom Penyeimbang Kanan (Lebar 15% Kosong agar Teks Tidak Tergeser) -->
        <td width="15%"></td>
    </tr>
</table>