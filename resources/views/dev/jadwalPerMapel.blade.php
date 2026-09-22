<!DOCTYPE html>
<html lang="id">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Jadwal Pelajaran Penjaskes</title>
        <!-- Tailwind CSS CDN -->
        <script src="https://cdn.tailwindcss.com"></script>
    </head>

    <body class="bg-gray-50 text-gray-800 font-sans antialiased">

        <div class="container mx-auto px-4 py-8 max-w-7xl">

            <!-- Header Section -->
            <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Jadwal Pelajaran Penjaskes</h1>
                    <p class="text-sm text-gray-500 mt-1">Tahun Ajaran: <span
                            class="font-medium text-gray-700">2026/2027</span> &bull; Semester: <span
                            class="font-medium text-gray-700 uppercase">Ganjil</span></p>
                </div>
                <div class="mt-4 md:mt-0">
                    <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Status: Aktif
                    </span>
                </div>
            </div>

            <!-- Table Card -->
            <div class="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col"
                                    class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    No</th>
                                <th scope="col"
                                    class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Kode Jadwal</th>
                                <th scope="col"
                                    class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Kelas</th>
                                <th scope="col"
                                    class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Hari & Waktu</th>
                                <th scope="col"
                                    class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Mata Pelajaran</th>
                                <th scope="col"
                                    class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Guru Pengampu</th>
                                <th scope="col"
                                    class="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Beban Jam</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white text-sm">
                            @if(isset($data) && count($data) > 0)
                            @foreach($data as $index => $item)
                            <tr class="hover:bg-gray-50 transition-colors duration-150">
                                <td class="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                                    {{ $loop->iteration }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap font-mono text-xs text-indigo-600 font-semibold">
                                    {{ $item->kode_jadwal }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                    {{ $item->nama_kelas }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center space-x-2">
                                        <span
                                            class="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">{{ $item->hari }}</span>
                                        <span class="text-gray-600 text-xs">{{ substr($item->jam_mulai, 0, 5) }} -
                                            {{ substr($item->jam_selesai, 0, 5) }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-gray-800">
                                    {{ $item->nama_mapel }} <span
                                        class="text-gray-400 text-xs">({{ $item->kode_mapel }})</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-gray-900 font-medium">{{ $item->nama_guru }}</div>
                                    @if(!empty($item->nip))
                                    <div class="text-xs text-gray-500">NIP: {{ $item->nip }}</div>
                                    @else
                                    <div class="text-xs text-gray-400 italic">Non-NIP</div>
                                    @endif
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {{ $item->beban_jam }} Jam
                                    </span>
                                </td>
                            </tr>
                            @endforeach
                            @else
                            <tr>
                                <td colspan="7" class="px-6 py-8 text-center text-gray-500 italic">
                                    Tidak ada data jadwal yang tersedia.
                                </td>
                            </tr>
                            @endif
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

    </body>

</html>