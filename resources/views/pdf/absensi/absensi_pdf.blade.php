@extends('pdf.format.layout')

@section('content')

<style>
.pdf-container {
    margin-top: 10px;
}

.pdf-header {
    text-align: center;
    margin-bottom: 10px;
    margin-top: 5px;
}

.pdf-title {
    font-weight: bold;
    font-size: 12px;
    text-transform: uppercase;
    margin: 0;
}

.pdf-subtitle {
    font-size: 8px;
    color: #555;
    margin-top: 2px;
}

.info-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 6px;
    font-size: 9px;
    line-height: 1.4;
}

.info-table td {
    border: none !important;
    padding: 0 !important;
    vertical-align: top;
}

.pdf-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #777;
    font-size: 7.5px;
    margin-top: 4px;
}

.pdf-table th,
.pdf-table td {
    border: 1px solid #777;
    padding: 2px 2px;
    text-align: center;
}

.pdf-table th {
    background-color: #eaeaea;
    font-weight: bold;
    font-size: 8px;
}

.text-left {
    text-align: left !important;
    padding-left: 4px !important;
}

.nama-col {
    width: 120px !important;
    max-width: 120px !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pdf-footer {
    margin-top: 8px;
    font-size: 8px;
    color: #444;
}

.pdf-footer span {
    margin-right: 12px;
}
</style>

<div class="pdf-container">
    {{-- Looping per Mata Pelajaran --}}
    @forelse($daftarAbsenSiswa as $namaMapel => $dataMapel)
    {{-- Menggunakan $loop->last untuk memberi perintah page break secara aman via server-side --}}
    <div class="mapel-section" style="{{ !$loop->last ? 'page-break-after: always; break-after: page;' : '' }}">
        @include('pdf.format.kop_surat')

        <div class="pdf-header">
            <h3 class="pdf-title">Rekapitulasi Absensi Siswa</h3>

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
                    <th style="width: 20px;">No</th>
                    <th class="text-left nama-col">Nama Siswa</th>
                    @for($i = 1; $i <= 16; $i++) <th style="width: 18px;">{{ $i }}</th>
                        @endfor
                </tr>
            </thead>
            <tbody>
                @foreach($dataMapel['siswa'] as $index => $siswa)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="text-left nama-col" style="font-weight: 500;">{{ $siswa['nama_siswa'] }}</td>

                    @for($i = 1; $i <= 16; $i++) @php $absen=collect($siswa['absen'])->firstWhere('pertemuan', $i);
                        $status = '';
                        if ($absen && isset($absen['status'])) {
                        $status = strtoupper(substr($absen['status'], 0, 1));
                        }
                        @endphp
                        <td><b>{{ $status }}</b></td>
                        @endfor
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="pdf-footer">
            <b>Keterangan:</b>
            <span><b>H</b> = Hadir</span>
            <span><b>S</b> = Sakit</span>
            <span><b>I</b> = Izin</span>
            <span><b>A</b> = Alfa</span>
        </div>
    </div>
    @empty
    @include('pdf.format.kop_surat')
     <div class="pdf-header">
            <h3 class="pdf-title">Rekapitulasi Absensi Siswa</h3>
        </div>
        <p style="text-align: center;">Tidak ada data absensi yang tersedia.</p>
    @endforelse
</div>
@endsection
