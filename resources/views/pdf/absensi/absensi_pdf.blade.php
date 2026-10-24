@extends('pdf.format.layout')

@section('content')

<style>
@page {
    margin: 10px 25px;
}

.pdf-container {
    margin-top: 0;
}

.pdf-header {
    text-align: center;
    margin-bottom: 3px;
    margin-top: 0;
}

.pdf-title {
    font-weight: bold;
    font-size: 11px;
    text-transform: uppercase;
    margin: 0 0 2px 0;
}

.info-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2px;
    margin-bottom: 2px;
    font-size: 8.5px;
    line-height: 1.2;
}

.info-table td {
    border: none !important;
    padding: 0 !important;
    vertical-align: top;
}

.pdf-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #333;
    font-size: 8px;
    margin-top: 2px;
    page-break-inside: avoid;
}

.pdf-table th,
.pdf-table td {
    border: 1px solid #333;
    padding: 0 1px;
    line-height: 1;
    height: 10px;
    text-align: center;
    vertical-align: middle;
}

.pdf-table th {
    background-color: #f2f2f2;
    font-weight: bold;
    font-size: 8px;
}

/* Tanggal kecil di bawah nomor pertemuan */
.tgl-pertemuan {
    display: block;
    font-size: 5px;
    font-weight: normal;
    line-height: 1;
    margin-top: 0;
}

/* Nama rata kiri */
.pdf-table th.text-left,
.pdf-table td.text-left {
    text-align: left !important;
    padding-left: 4px !important;
}

.nama-col {
    width: 130px !important;
    max-width: 130px !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.no-col {
    width: 20px !important;
}

.lk-col {
    width: 24px !important;
}

.rekap-col {
    width: 20px !important;
}

.pertemuan-col {
    width: 16px !important;
}

.pdf-footer {
    margin-top: 3px;
    width: 100%;
    font-size: 8.5px;
    page-break-inside: avoid;
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
<div class="pdf-container">
    {{-- Looping per Mata Pelajaran --}}
    @forelse($daftarAbsenSiswa as $namaMapel => $dataMapel)

    @php
    // Kumpulkan tanggal tiap pertemuan (dipakai di header kolom 1-20).
    // Tanggal pertemuan sama untuk semua siswa, jadi ambil yang pertama ditemukan.
    $tglPertemuan = [];

    foreach ($dataMapel['siswa'] ?? [] as $s) {
    foreach ($s['absen'] ?? [] as $a) {
    $p = $a['pertemuan'] ?? null;

    if ($p && empty($tglPertemuan[$p]) && !empty($a['tanggal_absen'])) {
    $tglPertemuan[$p] = $a['tanggal_absen'];
    }
    }
    }
    @endphp

    <div class="mapel-section" style="{{ !$loop->last ? 'page-break-after: always; break-after: page;' : '' }}">
        @include('pdf.format.kop_surat')

        <div class="pdf-header">
            <h3 class="pdf-title">DAFTAR PRESENSI PESERTA DIDIK</h3>

            <table class="info-table">
                <tr>
                    <td style="text-align: left;">
                        <b>Mata Pelajaran:</b> {{ $namaMapel ?? 'Umum / Lainnya' }} <br>
                        <b>Guru Pengampu:</b> {{ $dataMapel['nama_guru'] ?? '-' }}
                    </td>
                    <td style="text-align: right;">
                        <b>Kelas:</b> {{ $dataMapel['kelas'] ?? '-' }} <br>
                        <b>Tahun Ajaran / Semester:</b> {{ $dataMapel['tahun_ajaran'] ?? '-' }}
                        ({{ strtoupper($dataMapel['semester'] ?? '-') }})
                    </td>
                </tr>
            </table>
        </div>

        <table class="pdf-table">
            <thead>
                <tr>
                    <th rowspan="2" class="no-col">No</th>
                    <th rowspan="2" class="text-left nama-col">NAMA PESERTA DIDIK</th>
                    <th rowspan="2" class="lk-col">L/P</th>
                    <th colspan="20">TANGGAL PERTEMUAN</th>
                    <th colspan="4">REKAP</th>
                    <th rowspan="2" class="rekap-col">KET</th>
                </tr>
                <tr>
                    @for($i = 1; $i <= 20; $i++) <th class="pertemuan-col">
                        {{ $i }}
                        <br />
                        <span class="tgl-pertemuan" style="font-weight: bold;">
                            {{ !empty($tglPertemuan[$i]) ? \Carbon\Carbon::parse($tglPertemuan[$i])->format('d/m/Y') : '' }}
                        </span>
                        </th>
                        @endfor
                        <th class="rekap-col">H</th>
                        <th class="rekap-col">S</th>
                        <th class="rekap-col">I</th>
                        <th class="rekap-col">A</th>
                </tr>
            </thead>
            <tbody>
                @forelse($dataMapel['siswa'] ?? [] as $index => $siswa)
                @php
                // Hitung rekap kehadiran per siswa
                $totalH = 0;
                $totalS = 0;
                $totalI = 0;
                $totalA = 0;

                $absenByPertemuan = collect($siswa['absen'] ?? [])->keyBy('pertemuan');
                $arrStatus = [];

                for ($i = 1; $i <= 20; $i++) { $absen=$absenByPertemuan->get($i);
                    $status = '';

                    if ($absen && isset($absen['status'])) {
                    $status = strtoupper(substr($absen['status'], 0, 1));

                    if ($status == 'H') $totalH++;
                    elseif ($status == 'S') $totalS++;
                    elseif ($status == 'I') $totalI++;
                    elseif ($status == 'A') $totalA++;
                    }

                    $arrStatus[$i] = $status;
                    }
                    @endphp
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td class="text-left nama-col">{{ $siswa['nama_siswa'] ?? '-' }}</td>
                        <td>{{ isset($siswa['jenis_kelamin']) ? strtoupper(substr($siswa['jenis_kelamin'], 0, 1)) : '-' }}
                        </td>

                        @for($i = 1; $i <= 20; $i++) <td><b>{{ $arrStatus[$i] }}</b></td>
                            @endfor

                            <td>{{ $totalH > 0 ? $totalH : '' }}</td>
                            <td>{{ $totalS > 0 ? $totalS : '' }}</td>
                            <td>{{ $totalI > 0 ? $totalI : '' }}</td>
                            <td>{{ $totalA > 0 ? $totalA : '' }}</td>
                            <td></td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="28" style="text-align: center; font-style: italic; padding: 10px;">
                            Tidak ada data siswa untuk mata pelajaran ini.
                        </td>
                    </tr>
                    @endforelse
            </tbody>
        </table>

        <table style="font-size: 9px; margin-top: 3px;">
            <tr>
                <td style="width: 40%;">
                    <b>Keterangan:</b><br>
                    <span>H = Hadir</span> |
                    <span>S = Sakit</span> |
                    <span>I = Izin</span> |
                    <span>A = Alfa</span>
                </td>
            </tr>
        </table>

        @include('pdf.format.sign_kepala_madrasah')
    </div>

    @empty
    <div style="text-align: center; padding: 40px; font-size: 10px; font-style: italic;">
        @include('pdf.format.kop_surat')
        <h3 class="pdf-title" style="margin-top: 20px;">DAFTAR PRESENSI PESERTA DIDIK</h3>
        <p>Data presensi tidak tersedia.</p>
    </div>
    @endforelse
</div>

@endsection