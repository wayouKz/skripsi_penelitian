@extends('pdf.format.layout')

@section('content')
@include('pdf.format.kop_surat')

<h4 style="text-align: center; margin-bottom: 20px; font-size: 12px; color: #666;">{{ $title }}</h4>

@php
// Mengelompokkan data utama berdasarkan nama guru
$groupGuruMapel = $DaftarGuruMapel->groupBy('nama');
@endphp

<table width="100%" style="font-size: 10px; font-family: sans-serif; color: #333; border-collapse: collapse; margin-top: 10px;">
    <thead>
        <tr style="background-color: #e5e7eb;">
            <th style="border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; width: 35%;">Mata Pelajaran</th>
            <th style="border: 1px solid #9ca3af; padding: 6px 8px; text-align: center; width: 15%;">Beban Jam</th>
        </tr>
    </thead>
    <tbody>
        <!-- Loop 1: Group Berdasarkan Nama Guru -->
        @foreach($groupGuruMapel as $namaGuru => $listMapelGuru)

        @php
        // Gunakan sum() untuk menjumlahkan beban jam keseluruhan guru
        // Ganti 'beban_jam' dengan nama kolom beban jam yang ada di database Anda jika berbeda
        $totalJamGuru = $listMapelGuru->sum('beban_jam');
        @endphp

        <!-- Baris Header Grup Guru -->
        <tr style="background-color: #d1d5db;">
            <td colspan="1" style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold; color: #111827;">
                Nama Guru: {{ $namaGuru }}
            </td>
            <td style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold; color: #111827; text-align: center;">
                Total: {{ $totalJamGuru }} Jam
            </td>
        </tr>

        @php
        $groupKelas = $listMapelGuru->groupBy('kelas');
        @endphp

        <!-- Loop 2: Group Berdasarkan Kelas -->
        @foreach($groupKelas as $namaKelas => $listJadwal)

        <!-- Baris Sub-Header Grup Kelas -->
        <tr style="background-color: #f3f4f6;">
            <td colspan="2" style="border: 1px solid #9ca3af; padding: 6px 8px 6px 20px; font-weight: bold; color: #374151; font-style: italic;">
                Kelas: {{ $namaKelas ?? '-' }}
            </td>
        </tr>

        @php
        // Grouping berdasarkan Mapel
        $groupMapel = $listJadwal->groupBy('mapel');
        @endphp

        <!-- Loop 3: Group Berdasarkan Mata Pelajaran -->
        @foreach($groupMapel as $namaMapel => $itemsMapel)
        @php
        // Hitung total jam menggunakan sum() untuk mapel tersebut
        $totalJamMapel = $itemsMapel->sum('beban_jam');
        $rowspan = $itemsMapel->count();
        @endphp

        @foreach($itemsMapel as $index => $item)
        <tr>
            {{-- Kolom Mata Pelajaran dengan Rowspan --}}
            @if($index === 0)
            <td rowspan="{{ $rowspan }}" style="border: 1px solid #9ca3af; padding: 6px 8px; vertical-align: middle; font-weight: bold;">
                {{ $namaMapel ?? '-' }}
            </td>
            @endif

            {{-- Kolom Beban Jam menggunakan hasil sum() --}}
            @if($index === 0)
            <td rowspan="{{ $rowspan }}" style="border: 1px solid #9ca3af; padding: 6px 8px; text-align: center; vertical-align: middle;">
                {{ $totalJamMapel }} Jam
            </td>
            @endif
        </tr>
        @endforeach

        @endforeach

        @endforeach

        @endforeach
    </tbody>
</table>

@endsection
