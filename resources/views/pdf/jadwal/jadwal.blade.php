@extends('pdf.format.layout')
@section('content')
@include('pdf.format.kop_surat')
@php
// Kelompokkan data jadwal berdasarkan nama kelasnya terlebih dahulu
$groupedByKelas = collect($jadwal)->groupBy('nama_kelas');
@endphp

@foreach($groupedByKelas as $namaKelas => $jadwalPerKelas)
<!-- Header Dokumen per Kelas -->
<h2 style="text-align: center; margin-bottom: 5px; color: #222;">JADWAL PELAJARAN KELAS {{ $namaKelas }}</h2>
<p style="text-align: center; margin-bottom: 20px; font-size: 12px; color: #666;">
<<<<<<< HEAD
    Tahun Ajaran: {{ $namaTahunAjaran ?? '-' }}
=======
    Tahun Ajaran: {{ $namaTahunAjaran ?? '-' }} / {{ $tahunAjaran->semester ?? '-' }}
>>>>>>> main
</p>

<!-- Tabel Jadwal -->
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;" border="1" cellpadding="5">
    <thead>
        <tr style="background-color: #22c55e; color: white;">
            <th style="text-align: center; width: 14%; font-size: 11px;">Waktu</th>
            <th style="text-align: center; font-size: 11px;">Senin</th>
            <th style="text-align: center; font-size: 11px;">Selasa</th>
            <th style="text-align: center; font-size: 11px;">Rabu</th>
            <th style="text-align: center; font-size: 11px;">Kamis</th>
            <th style="text-align: center; font-size: 11px;">Jumat</th>
        </tr>
    </thead>
    <tbody>
        @php
        // Ambil daftar jam mulai yang unik khusus untuk kelas ini lalu urutkan
        $daftarJamMulai = collect($jadwalPerKelas)->pluck('jam_mulai')->unique()->sort()->values();
        @endphp

        @foreach($daftarJamMulai as $waktuMulai)
        @php
        $itemContoh = collect($jadwalPerKelas)->firstWhere('jam_mulai', $waktuMulai);
        $waktuSelesai = $itemContoh ? $itemContoh->jam_selesai : '';
        @endphp
        <tr>
            <td style="text-align:center; font-weight:bold; padding: 6px; font-size: 10px;">
                {{ substr($waktuMulai, 0, 5) }} - {{ substr($waktuSelesai, 0, 5) }}
            </td>

            @foreach(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as $hari)
            @php
            // Cari data yang cocok berdasarkan jam_mulai dan hari dalam lingkup kelas ini
            $itemJadwal = collect($jadwalPerKelas)->first(function($item) use ($waktuMulai, $hari) {
            return $item->jam_mulai == $waktuMulai && $item->hari == $hari;
            });
            @endphp

            <td style="text-align:center; vertical-align:middle; padding: 6px;">
                @if($itemJadwal)
                <div style="font-weight: bold; font-size: 11px;">{{ $itemJadwal->nama_mapel }}</div>
                <div style="font-size: 9px; color: #555;">{{ $itemJadwal->nama_guru }}</div>
                @else
                <span style="color: #aaa; font-size: 9px;">- KOSONG -</span>
                @endif
            </td>
            @endforeach
        </tr>
        @endforeach
    </tbody>
</table>

<!-- Page break otomatis tiap pindah kelas (kecuali kelas terakhir) -->
@if(!$loop->last)

<pagebreak />
@endif
@endforeach
@include('pdf.format.sign_kepala_madrasah')
<<<<<<< HEAD
@endsection
=======
@endsection
>>>>>>> main
