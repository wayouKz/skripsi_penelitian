@extends('pdf.format.layout')

@section('content')
@include('pdf.format.kop_surat')

<style>
.judul {
    text-align: center;
    margin-bottom: 10px;
    font-size: 13pt;
    color: #444;
}

.tbl {
    width: 100%;
    table-layout: fixed;
    font-size: 9pt;
    font-family: sans-serif;
    color: #333;
    border-collapse: collapse;
    margin-top: 6px;
}

.tbl th,
.tbl td {
    border: 1px solid #9ca3af;
    padding: 4px 3px;
    overflow: hidden;
}

.tbl th {
    background-color: #e5e7eb;
    text-align: center;
    vertical-align: middle;
}

/* Kolom kelas: sempit, angka di tengah */
.tbl td.k {
    padding: 4px 0;
    text-align: center;
    font-size: 9pt;
}

.tbl th.k {
    padding: 2px 0;
    font-size: 8pt;
    height: 45px;
    text-rotate: 90;
}

.tbl td.mid {
    vertical-align: middle;
}

.c {
    text-align: center;
}

.l {
    text-align: left;
}

.r {
    text-align: right;
}

.b {
    font-weight: bold;
}

.total-row td {
    background-color: #d1d5db;
    font-weight: bold;
    color: #111827;
}

.kosong {
    color: red;
    font-weight: bold;
    text-align: center;
}
</style>

@php
$no = 1;

// Daftar kelas unik (kolom), diurutkan natural: X-1, X-2, ..., XII-13
$kelas = $DaftarGuruMapel
->pluck('kelas')
->filter()
->unique()
->sort(function ($a, $b) {
return strnatcmp($a, $b);
})
->values();

$jumlahKelas = max($kelas->count(), 1);

// Lebar kolom (dalam %) supaya total = 100
$wNo = 3;
$wGuru = 14;
$wMapel = 12;
$wTotal = 3.5;
$wKelas = round((100 - $wNo - $wGuru - $wMapel - $wTotal) / $jumlahKelas, 3);

// Group per guru
$guruGroup = $DaftarGuruMapel->groupBy('nama');

// Total vertikal per kelas
$totalJamPerKelas = [];
@endphp

<h4 class="judul">{{ $title }}</h4>

<table class="tbl">
    <colgroup>
        <col style="width: {{ $wNo }}%;">
        <col style="width: {{ $wGuru }}%;">
        <col style="width: {{ $wMapel }}%;">
        @for($i = 0; $i < $jumlahKelas; $i++) <col style="width: {{ $wKelas }}%;">
            @endfor
            <col style="width: {{ $wTotal }}%;">
    </colgroup>

    <thead>
        <tr>
            <th rowspan="2">No</th>
            <th rowspan="2" class="l">Nama Guru</th>
            <th rowspan="2" class="l">Mata Pelajaran</th>
            <th colspan="{{ $jumlahKelas }}">Kelas</th>
            <th rowspan="2">Total</th>
        </tr>
        <tr>
            @forelse($kelas as $kls)
            <th class="k">{{ $kls }}</th>
            @empty
            <th class="k">-</th>
            @endforelse
        </tr>
    </thead>

    <tbody>
        @if ($guruGroup->isEmpty())
        <tr>
            <td colspan="{{ 4 + $jumlahKelas }}" class="kosong">Tidak ada data</td>
        </tr>
        @endif

        @foreach($guruGroup as $namaGuru => $listGuru)
        @php
        $mapelGroup = $listGuru->groupBy('mapel');
        $rowspan = $mapelGroup->count();
        $firstGuru = true;
        @endphp

        @foreach($mapelGroup as $namaMapel => $itemsMapel)
        @php
        $totalJam = 0;
        $jamPerKelas = $itemsMapel->groupBy('kelas')->map->sum('beban_jam');
        @endphp

        <tr>
            @if($firstGuru)
            <td rowspan="{{ $rowspan }}" class="c mid">{{ $no++ }}</td>
            <td rowspan="{{ $rowspan }}" class="mid b">{{ $namaGuru }}</td>
            @php $firstGuru = false; @endphp
            @endif

            <td>{{ $namaMapel ?? '-' }}</td>

            @forelse($kelas as $kls)
            @php
            $nilaiJam = $jamPerKelas[$kls] ?? 0;
            $totalJam += $nilaiJam;
            $totalJamPerKelas[$kls] = ($totalJamPerKelas[$kls] ?? 0) + $nilaiJam;
            @endphp
            <td class="k">{{ $nilaiJam ?: '' }}</td>
            @empty
            <td class="k"></td>
            @endforelse

            <td class="c b">{{ $totalJam }}</td>
        </tr>
        @endforeach
        @endforeach

        @if (!$guruGroup->isEmpty())
        <tr class="total-row">
            <td colspan="3" class="r">JUMLAH TOTAL</td>

            @forelse($kelas as $kls)
            <td class="k">{{ $totalJamPerKelas[$kls] ?? 0 }}</td>
            @empty
            <td class="k"></td>
            @endforelse

            <td class="c">{{ $DaftarGuruMapel->sum('beban_jam') }}</td>
        </tr>
        @endif
    </tbody>
</table>

@endsection
