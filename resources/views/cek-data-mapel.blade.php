<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>

    <body>
        @php $no = 1; @endphp
        <table border="1" style="border-collapse: collapse" hidden>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Kelas</th>
                    <th>Beban Jam</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($dataJam as $item => $value)
                <tr>
                    <td>{{ $no++ }}</td>
                    <td>{{ $value->nama_kelas }}</td>
                    <td>{{ $value->beban_jam }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @php $no = 1; @endphp
        @php
        $no = 1;

        $kelas = $dataJamGuru
        ->pluck('nama_kelas')
        ->unique()
        ->sort(function ($a, $b) {
        return strnatcmp($a, $b);
        })
        ->values();

        // Group berdasarkan guru dan mapel
        $grouped = $dataJamGuru->groupBy(function ($item) {
        return $item->nama_guru . '|' . $item->nama_mapel;
        });

        // Group lagi berdasarkan guru
        $guruGroup = $grouped->groupBy(function ($items) {
        return $items->first()->nama_guru;
        });
        @endphp

        <table border="1" style="width:100%; border-collapse:collapse; border:1px solid black">
            <thead>
                <tr>
                    <th rowspan="2">No</th>
                    <th rowspan="2">Nama Guru</th>
                    <th rowspan="2">Mapel</th>
                    <th colspan="{{ $kelas->count() }}" style="margin:10px;">Kelas</th>
                    <th rowspan="2">Total Jam</th>
                </tr>
                <tr>
                    @foreach($kelas as $kls)
                    <th>{{ $kls }}</th>
                    @endforeach
                </tr>
            </thead>

            <tbody>
                @php
                // Siapkan array untuk menampung total jam per kelas (vertikal)
                $totalJamPerKelas = [];
                @endphp

                @foreach($guruGroup as $guru => $mapels)
                @php
                $rowspan = $mapels->count();
                $firstGuru = true;
                @endphp

                @foreach($mapels as $items)
                @php
                $first = $items->first();
                $totalJam = 0; // Total jam per baris (horizontal)
                @endphp

                <tr>
                    @if($firstGuru)
                    <td rowspan="{{ $rowspan }}" style="text-align:center; vertical-align:middle;">
                        {{ $no++ }}
                    </td>
                    <td rowspan="{{ $rowspan }}" style="vertical-align:middle;">
                        {{ $guru }}
                    </td>
                    @php
                    $firstGuru = false;
                    @endphp
                    @endif

                    <td>{{ $first->nama_mapel }}</td>

                    @foreach($kelas as $kls)
                    @php
                    $jam = $items->firstWhere('nama_kelas', $kls);
                    $nilaiJam = $jam ? $jam->beban_jam : 0;

                    // Tambahkan ke total horizontal (per baris)
                    $totalJam += $nilaiJam;

                    // Tambahkan ke total vertikal (per kolom/kelas)
                    $totalJamPerKelas[$kls] = ($totalJamPerKelas[$kls] ?? 0) + $nilaiJam;
                    @endphp

                    <td style="text-align:center">
                        {{ $nilaiJam ?: '' }}
                    </td>
                    @endforeach

                    <td style="text-align:center">
                        {{ $totalJam }}
                    </td>
                </tr>
                @endforeach
                @endforeach

                <!-- Baris Jumlah Paling Bawah -->
                <tr>
                    <!-- colspan="3" karena menggabungkan kolom No, Nama Guru, dan Mapel -->
                    <td colspan="3" style="text-align:right; font-weight:bold; padding-right:15px;">
                        JUMLAH TOTAL
                    </td>

                    <!-- Menampilkan total masing-masing kelas (kolom) -->
                    @foreach($kelas as $kls)
                    <td style="text-align:center; font-weight:bold;">
                        {{ $totalJamPerKelas[$kls] ?? 0 }}
                    </td>
                    @endforeach

                    <!-- Grand Total Keseluruhan -->
                    <td style="text-align:center; font-weight:bold;">
                        {{ $dataJamGuru->sum('beban_jam') }}
                    </td>
                </tr>
            </tbody>
        </table>
        @php
        // Kelompokkan data jadwal berdasarkan nama kelasnya terlebih dahulu
        $groupedByKelas = collect($jadwal)->groupBy('nama_kelas');
        @endphp

        @forelse($groupedByKelas as $namaKelas => $jadwalPerKelas)
        <div style="margin-bottom: 40px;">
            <h3 style="margin-bottom: 10px; font-family: sans-serif;">Kelas: {{ $namaKelas }}</h3>

            <table border="1" style="width:100%; border-collapse:collapse; border:1px solid black">
                <thead>
                    <tr>
                        <th style="padding: 8px;">Waktu / Jam</th>
                        <th style="padding: 8px;">Senin</th>
                        <th style="padding: 8px;">Selasa</th>
                        <th style="padding: 8px;">Rabu</th>
                        <th style="padding: 8px;">Kamis</th>
                        <th style="padding: 8px;">Jumat</th>
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
                        <td style="text-align:center; font-weight:bold; padding: 6px;">
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
                            <div style="font-weight: bold; font-size: 13px;">{{ $itemJadwal->nama_mapel }}</div>
                            <div style="font-size: 11px; color: #555;">{{ $itemJadwal->nama_guru }}</div>
                            @else
                            <span style="color: #aaa;">- KOSONG -</span>
                            @endif
                        </td>
                        @endforeach
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @empty
        <p style="text-align:center;">Tidak ada data jadwal yang tersedia.</p>
        @endforelse
    </body>

</html>
