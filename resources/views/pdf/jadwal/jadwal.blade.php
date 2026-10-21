@extends('pdf.format.layout')
@section('content')

@php
$groupedByKelas = collect($jadwal)->groupBy('nama_kelas');
$hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

// [background, border, warna teks]
$palette = [
['#eef2ff', '#a5b4fc', '#3730a3'],
['#ecfdf5', '#6ee7b7', '#065f46'],
['#fffbeb', '#fcd34d', '#92400e'],
['#fff7ed', '#fdba74', '#9a3412'],
['#f0f9ff', '#7dd3fc', '#075985'],
['#fdf2f8', '#f9a8d4', '#9d174d'],
['#f5f3ff', '#c4b5fd', '#5b21b6'],
['#f0fdfa', '#5eead4', '#115e59'],
];
@endphp

<style>
.matrix {
    width: 100%;
    border-collapse: separate;
    border-spacing: 2px;
    table-layout: fixed;
}

.matrix th {
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    font-size: 7px;
    padding: 3px 1px;
    text-align: center;
    color: #111;
}

.matrix td {
    text-align: center;
    vertical-align: middle;
    padding: 3px 2px;
    border-radius: 4px;
}

.matrix td.hari {
    width: 10%;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    font-weight: bold;
    font-size: 8px;
}

.matrix td.kosong {
    color: #bbb;
    font-size: 8px;
    background-color: #fafafa;
    border: 1px solid #eee;
}

.jam {
    font-size: 6px;
    color: #666;
}

.mapel {
    font-size: 8px;
    font-weight: bold;
    color: #111;
}

.guru {
    font-size: 6px;
}
</style>

@foreach($groupedByKelas as $namaKelas => $jadwalPerKelas)
@include('pdf.format.kop_surat')

@php
$items = collect($jadwalPerKelas)->map(fn($i) => (object) [
'hari' => $i->hari,
'mulai' => substr($i->jam_mulai, 0, 5),
'selesai' => substr($i->jam_selesai, 0, 5),
'mapel' => $i->nama_mapel,
'guru' => $i->nama_guru,
]);

$batas = $items->pluck('mulai')->merge($items->pluck('selesai'))->unique()->sort()->values();

$slots = collect();
for ($k = 0; $k < $batas->count() - 1; $k++) {
    $s = $batas[$k];
    $e = $batas[$k + 1];
    if ($items->contains(fn($it) => $it->mulai <= $s && $it->selesai >= $e)) {
        $slots->push(['mulai' => $s, 'selesai' => $e]);
        }
        }
        $n = $slots->count();
        $mapelList = $items->pluck('mapel')->unique()->values();
        @endphp

        <h3 style="text-align: center; margin: 0 0 2px 0; color: #222;">JADWAL PELAJARAN KELAS {{ $namaKelas }}</h3>
        <p style="text-align: center; margin: 0 0 6px 0; font-size: 9px; color: #666;">
            Tahun Ajaran: {{ $namaTahunAjaran ?? '-' }} / {{ strtoupper($semester) ?? '-' }}
        </p>

        <table class="matrix">
            <thead>
                <tr>
                    <th style="width: 7%;">HARI / JAM</th>
                    @foreach($slots as $slot)
                    <th>{{ $slot['mulai'] }}<br>{{ $slot['selesai'] }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($hariList as $hari)
                @php
                $itemHari = $items->where('hari', $hari)->sortBy('mulai')->values();
                $i = 0;
                @endphp
                <tr>
                    <td class="hari">{{ strtoupper($hari) }}</td>

                    @while($i < $n) @php $slot=$slots[$i]; $item=$itemHari->firstWhere('mulai', $slot['mulai']);
                        @endphp

                        @if($item)
                        @php
                        $span = max($slots->filter(fn($s) => $s['mulai'] >= $item->mulai && $s['selesai'] <= $item->
                            selesai)->count(), 1);
                            $c = $palette[$mapelList->search($item->mapel) % count($palette)];
                            @endphp
                            <td colspan="{{ $span }}"
                                style="background-color: {{ $c[0] }}; border: 1px solid {{ $c[1] }};">
                                @if($span > 1)
                                <div class="jam">{{ $item->mulai }} - {{ $item->selesai }}</div>
                                @endif
                                <div class="mapel">{{ $item->mapel }}</div>
                                <div class="guru" style="color: {{ $c[2] }};">{{ $item->guru }}</div>
                            </td>
                            @php $i += $span; @endphp
                            @else
                            @php
                            $span = 1;
                            while ($i + $span < $n && !$itemHari->contains('mulai', $slots[$i + $span]['mulai'])) {
                                $span++;
                                }
                                @endphp
                                <td colspan="{{ $span }}" class="kosong">-</td>
                                @php $i += $span; @endphp
                                @endif
                                @endwhile
                </tr>
                @endforeach
            </tbody>
        </table>

        @include('pdf.format.sign_kepala_madrasah')
        @if(!$loop->last)
        <pagebreak />
        @endif
        @endforeach

        @endsection
