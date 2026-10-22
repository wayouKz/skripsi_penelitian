<style>
.pdf-footer {
    margin-top: 6px;
    width: 100%;
    font-size: 8px;
}

.footer-table {
    width: 100%;
    border-collapse: collapse;
    border: none !important;
}

.footer-table td {
    border: none !important;
    padding: 0 !important;
    vertical-align: top;
}
</style>

@php
// 'mapel' = tanda tangan guru mapel, 'wali' = tanda tangan wali kelas
$isWali = ($jenisGuru ?? 'mapel') === 'wali';
$judulTtd = $isWali ? 'Wali Kelas' : 'Guru Mata Pelajaran';

$namaTtd = null;
$nipTtd = null;

if ($isWali) {
// Kondisi 1: wali kelas diambil dari $jadwalPerKelas
$sumberWali = $jadwalPerKelas ?? null;

// Jika $jadwalPerKelas berupa kumpulan baris (bukan satu baris),
// cari baris pertama yang memiliki wali_kelas.
if (!empty($sumberWali) && data_get($sumberWali, 'wali_kelas') === null) {
$sumberWali = collect($sumberWali)->first(function ($row) {
return !empty(data_get($row, 'wali_kelas'))
|| !empty(data_get($row, '0.wali_kelas')); // data dikelompokkan per kelas
});

// Jika baris pertama ternyata berupa grup, ambil isi pertamanya
if ($sumberWali && data_get($sumberWali, 'wali_kelas') === null) {
$sumberWali = collect($sumberWali)->first();
}
}

$namaTtd = data_get($sumberWali, 'wali_kelas');
$nipTtd = data_get($sumberWali, 'wali_kelas_nip');
} else {
// Kondisi 2: guru mata pelajaran
$namaTtd = data_get($dataMapel ?? [], 'nama_guru');
$nipTtd = data_get($dataMapel ?? [], 'nip');
}
@endphp

<div class="pdf-footer">
    <table class="footer-table">
        <tr>
            <td style="width: 40%; text-align: center;">
                Mengetahui,<br>
                Kepala Madrasah<br><br><br><br><br><br><br><br>
                <b><u>{{ $instansi->kepalaSekolah->nama_guru ?? '........................................' }}</u></b><br>
                NIP. {{ $instansi->kepalaSekolah->nip ?? '........................................' }}
            </td>

            <td style="width: 30%; text-align: center;">
                Gorontalo, {{ \Carbon\Carbon::now()->locale('id')->tranprimarydFormat('d F Y') }}<br>
                {{ $judulTtd }}<br><br><br><br><br><br><br><br>
                <div style="height: 60px;"></div>

                @if(!empty($namaTtd))
                <b><u>{{ $namaTtd }}</u></b><br>
                NIP. {{ !empty($nipTtd) ? $nipTtd : '-' }}
                @else
                <b>........................................</b><br>
                NIP. ........................................
                @endif
            </td>
        </tr>
    </table>
</div>
