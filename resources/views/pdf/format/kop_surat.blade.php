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
            <img src="{{ !empty($instansi->logo_instansi) && file_exists(public_path('storage/public/logo/' . $instansi->logo_instansi))
    ? public_path('storage/public/logo/' . $instansi->logo_instansi)
    : public_path('img/logo-default.jpg') }}" alt="Logo Instansi">
        </td>

        <!-- 2. Kolom Teks Tengah (Lebar 70% - Presisi di Tengah Halaman) -->
        <td width="70%" style="text-align: center; vertical-align: middle;">
            <h1> {{ strtoupper($instansi->nama_instansi) ??  "Nama Instansi" }}
            </h1>
            <p>{{ !empty($instansi->alamat_instansi) ? $instansi->alamat_instansi : "Alamat Instansi" }}</p>
            <p>Telepon: {{ !empty($instansi->telepon_instansi) ? $instansi->telepon_instansi : "(+62) 000-0000-0000" }}
                | Website:
                <i>{{ !empty($instansi->website_instansi) ? $instansi->website_instansi : "website.com" }}</i></p>
        </td>

        <!-- 3. Kolom Penyeimbang Kanan (Lebar 15% Kosong agar Teks Tidak Tergeser) -->
        <td width="15%"></td>
    </tr>
</table>
