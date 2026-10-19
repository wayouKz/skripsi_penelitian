@extends('pdf.format.layout')

@section('content')

<style>
.pdf-container {
    margin-top: 5px;
}

.pdf-header {
    text-align: center;
    margin-bottom: 6px;
    margin-top: 2px;
}

.pdf-title {
    font-weight: bold;
    font-size: 11px;
    text-transform: uppercase;
    margin: 0 0 4px 0;
}

.info-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
    margin-bottom: 4px;
    font-size: 8px;
    line-height: 1.3;
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
    font-size: 7px;
    margin-top: 2px;
}

.pdf-table th,
.pdf-table td {
    border: 1px solid #333;
    padding: 1px 1px;
    text-align: center;
    vertical-align: middle;
}

.pdf-table th {
    background-color: #f2f2f2;
    font-weight: bold;
    font-size: 7.5px;
}

.text-left {
    text-align: left !important;
    padding-left: 3px !important;
}

.nama-col {
    width: 110px !important;
    max-width: 110px !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.no-col {
    width: 18px !important;
}

.lk-col {
    width: 22px !important;
}

.rekap-col {
    width: 18px !important;
}

.pertemuan-col {
    width: 15px !important;
}

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

<div class="pdf-container">
    {{-- Looping per Mata Pelajaran --}}
    @forelse($daftarAbsenSiswa as $namaMapel => $dataMapel)
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
                    <th colspan="16">TANGGAL PERTEMUAN</th>
                    <th colspan="4">REKAP</th>
                    <th rowspan="2" class="rekap-col">KET</th>
                </tr>
                <tr>
                    @for($i = 1; $i <= 16; $i++) <th class="pertemuan-col">{{ $i }}</th>
                        @endfor
                        <th class="rekap-col">H</th>
                        <th class="rekap-col">S</th>
                        <th class="rekap-col">I</th>
                        <th class="rekap-col">A</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dataMapel['siswa'] as $index => $siswa)
                @php
                // Hitung rekap kehadiran per siswa
                $totalH = 0;
                $totalS = 0;
                $totalI = 0;
                $totalA = 0;

                $arrStatus = [];
                for($i = 1; $i <= 16; $i++) { $absen=collect($siswa['absen'])->firstWhere('pertemuan', $i);
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
                        <td class="text-left nama-col" style="font-weight: 500;">{{ $siswa['nama_siswa'] }}</td>
                        <td>{{ isset($siswa['jenis_kelamin']) ? strtoupper(substr($siswa['jenis_kelamin'], 0, 1)) : '-' }}
                        </td>

                        @for($i = 1; $i <= 16; $i++) <td><b>{{ $arrStatus[$i] }}</b></td>
                            @endfor

                            <td>{{ $totalH > 0 ? $totalH : '' }}</td>
                            <td>{{ $totalS > 0 ? $totalS : '' }}</td>
                            <td>{{ $totalI > 0 ? $totalI : '' }}</td>
                            <td>{{ $totalA > 0 ? $totalA : '' }}</td>
                            <td></td>
                    </tr>
                    @endforeach
            </tbody>
        </table>

        <div class="pdf-footer">
            <table class="footer-table">
                <tr>
                    <td style="width: 40%;">
                        <b>Keterangan:</b><br>
                        <span>H = Hadir</span> |
                        <span>S = Sakit</span> |
                        <span>I = Izin</span> |
                        <span>A = Alfa</span>
                    </td>
                    <td style="width: 30%; text-align: center;">
                        Mengetahui,<br>
                        Kepala Madrasah<br><br><br><br>
                        <b><u>{{ $instansi->kepalaSekolah->nama_guru ?? '........................................' }}</u></b><br>
                        NIP. {{ $instansi->kepalaSekolah->nip ?? '........................................' }}
                    </td>
                    <td style="width: 30%; text-align: center;">
                        Gorontalo, {{ date('d F Y') }}<br>
                        Guru Mata Pelajaran<br><br><br><br>
                        <b><u>{{ $dataMapel['nama_guru'] ?? '........................................' }}</u></b><br>
                        NIP. {{ $dataMapel['nip'] ?? '........................................' }}
                    </td>
                </tr>
            </table>
        </div>
    </div>
    @empty
    @include('pdf.format.kop_surat')
    <div class="pdf-header">
        <h3 class="pdf-title">DAFTAR PRESENSI PESERTA DIDIK</h3>
    </div>
    <p style="text-align: center;">Tidak ada data absensi yang tersedia.</p>
    @endforelse
</div>

@endsection
