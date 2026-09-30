<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Real-Time GA Scheduler Monitor (Clean UI)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.98); }
            100% { opacity: 1; transform: scale(1); }
        }
        .animate-chromosome { animation: fadeInScale 0.25s ease-in-out forwards; }
    </style>
</head>
<body class="bg-gray-900 text-white p-6 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Header & Konfigurasi Parameter -->
        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg space-y-4">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold flex items-center gap-2">⚡ Real-Time GA Scheduler Monitor</h1>
                    <p class="text-xs text-gray-400 mt-1">Konfigurasi Algoritma Genetika & Jam Operasional (Mulai 07:00, 35 Menit/JP)</p>
                </div>
                <button id="btnStart" onclick="mulaiGenerate()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow transition duration-200 cursor-pointer">
                    🚀 Mulai Generate Jadwal
                </button>
            </div>

            <!-- Panel Input Konfigurasi -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-gray-700 text-xs">
                <div>
                    <label class="block text-gray-400 mb-1 font-semibold">Jumlah Populasi</label>
                    <input type="number" id="inputPopulasi" value="50" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono">
                </div>
                <div>
                    <label class="block text-gray-400 mb-1 font-semibold">Jumlah Generasi</label>
                    <input type="number" id="inputGenerasi" value="500" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono">
                </div>
                <div>
                    <label class="block text-gray-400 mb-1 font-semibold">Senin - Rabu (11 JP)</label>
                    <input type="text" value="07:00 - 13:25 (35m/JP)" disabled class="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-gray-400 font-mono">
                </div>
                <div>
                    <label class="block text-gray-400 mb-1 font-semibold">Kamis - Jumat (12 JP)</label>
                    <input type="text" value="07:00 - 14:00 (35m/JP)" disabled class="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-gray-400 font-mono">
                </div>
            </div>
        </div>

        <!-- Grid Dashboard / Status -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-gray-800 p-5 rounded-xl shadow border border-gray-700 flex flex-col justify-between">
                <div>
                    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Status Proses</h2>
                    <div id="statusMessage" class="text-sm text-yellow-400 font-medium mb-4">Menunggu eksekusi...</div>

                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-400">Progres Generasi</span>
                        <span id="genInfo" class="text-xs font-mono text-gray-300">0 / 500</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-4">
                        <div id="progressBar" class="bg-indigo-500 h-4 transition-all duration-300 text-center text-[10px] font-bold leading-4" style="width: 0%">0%</div>
                    </div>
                </div>
                <div class="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 flex justify-between items-center">
                    <span class="text-xs text-gray-400">Fitness Terbaik:</span>
                    <span id="fitnessVal" class="text-green-400 font-bold font-mono text-base">0.0000</span>
                </div>
            </div>

            <!-- Blok Pelacakan Bentrok & Tumpang Tindih -->
            <div class="bg-gray-800 p-5 rounded-xl shadow border border-gray-700 md:col-span-2 flex flex-col">
                <div class="flex justify-between items-center mb-3">
                    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">🚨 Pelacakan Bentrok & Tumpang Tindih</h2>
                    <span id="clashBadge" class="text-xs font-mono bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600">Menunggu...</span>
                </div>
                <div id="clashContainer" class="bg-black p-3 rounded-lg border border-gray-900 flex-1 h-48 overflow-y-auto space-y-2 font-mono text-xs text-gray-500">
                    <div>[System] Log bentrok akan muncul di sini saat proses selesai atau optimal ditemukan. (Note: Penjaskes dikecualikan dari tracking guru)</div>
                </div>
            </div>
        </div>

        <!-- Blok Visualisasi Matriks -->
        <div class="bg-gray-800 p-5 rounded-xl shadow border border-gray-700">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Visualisasi Matriks Jadwal Per Kelas</h2>
                <span id="kromosomGenInfo" class="text-xs font-mono bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-700">Gen: -</span>
            </div>

            <div id="matrixContainer" class="space-y-8">
                <div class="text-gray-500 italic text-sm">Belum ada jadwal yang terbentuk...</div>
            </div>
        </div>

        <!-- Blok Tabel Rekapitulasi Guru -->
        <div class="bg-gray-800 p-5 rounded-xl shadow border border-gray-700">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">📋 Rekapitulasi Guru, Mapel, Beban Jam & Kelas</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse text-xs text-left font-mono">
                    <thead>
                        <tr class="bg-gray-700 text-gray-200">
                            <th class="border border-gray-600 p-2.5 w-24 text-center">Guru ID</th>
                            <th class="border border-gray-600 p-2.5">Mata Pelajaran yang Diampu</th>
                            <th class="border border-gray-600 p-2.5 w-32 text-center">Total Beban Jam</th>
                            <th class="border border-gray-600 p-2.5">Kelas yang Diajar</th>
                        </tr>
                    </thead>
                    <tbody id="groupedTeacherTableBody" class="text-gray-300">
                        <tr>
                            <td colspan="4" class="border border-gray-700 p-4 text-center text-gray-500 italic">Belum ada data rekapitulasi guru...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <script>
        const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

        const slotWaktuArrayData = {
            "Senin": [
                { "id": 1, "mulai": "07:00", "selesai": "07:35" }, { "id": 2, "mulai": "07:35", "selesai": "08:10" },
                { "id": 3, "mulai": "08:10", "selesai": "08:45" }, { "id": 4, "mulai": "08:45", "selesai": "09:20" },
                { "id": 5, "mulai": "09:20", "selesai": "09:55" }, { "id": 6, "mulai": "09:55", "selesai": "10:30" },
                { "id": 7, "mulai": "10:30", "selesai": "11:05" }, { "id": 8, "mulai": "11:05", "selesai": "11:40" },
                { "id": 9, "mulai": "11:40", "selesai": "12:15" }, { "id": 10, "mulai": "12:15", "selesai": "12:50" },
                { "id": 11, "mulai": "12:50", "selesai": "13:25" }
            ],
            "Selasa": [
                { "id": 1, "mulai": "07:00", "selesai": "07:35" }, { "id": 2, "mulai": "07:35", "selesai": "08:10" },
                { "id": 3, "mulai": "08:10", "selesai": "08:45" }, { "id": 4, "mulai": "08:45", "selesai": "09:20" },
                { "id": 5, "mulai": "09:20", "selesai": "09:55" }, { "id": 6, "mulai": "09:55", "selesai": "10:30" },
                { "id": 7, "mulai": "10:30", "selesai": "11:05" }, { "id": 8, "mulai": "11:05", "selesai": "11:40" },
                { "id": 9, "mulai": "11:40", "selesai": "12:15" }, { "id": 10, "mulai": "12:15", "selesai": "12:50" },
                { "id": 11, "mulai": "12:50", "selesai": "13:25" }, { "id": 12, "mulai": "13:25", "selesai": "14:00" }
            ],
            "Rabu": [
                { "id": 1, "mulai": "07:00", "selesai": "07:35" }, { "id": 2, "mulai": "07:35", "selesai": "08:10" },
                { "id": 3, "mulai": "08:10", "selesai": "08:45" }, { "id": 4, "mulai": "08:45", "selesai": "09:20" },
                { "id": 5, "mulai": "09:20", "selesai": "09:55" }, { "id": 6, "mulai": "09:55", "selesai": "10:30" },
                { "id": 7, "mulai": "10:30", "selesai": "11:05" }, { "id": 8, "mulai": "11:05", "selesai": "11:40" },
                { "id": 9, "mulai": "11:40", "selesai": "12:15" }, { "id": 10, "mulai": "12:15", "selesai": "12:50" },
                { "id": 11, "mulai": "12:50", "selesai": "13:25" }
            ],
            "Kamis": [
                { "id": 1, "mulai": "07:00", "selesai": "07:35" }, { "id": 2, "mulai": "07:35", "selesai": "08:10" },
                { "id": 3, "mulai": "08:10", "selesai": "08:45" }, { "id": 4, "mulai": "08:45", "selesai": "09:20" },
                { "id": 5, "mulai": "09:20", "selesai": "09:55" }, { "id": 6, "mulai": "09:55", "selesai": "10:30" },
                { "id": 7, "mulai": "10:30", "selesai": "11:05" }, { "id": 8, "mulai": "11:05", "selesai": "11:40" },
                { "id": 9, "mulai": "11:40", "selesai": "12:15" }, { "id": 10, "mulai": "12:15", "selesai": "12:50" },
                { "id": 11, "mulai": "12:50", "selesai": "13:25" }, { "id": 12, "mulai": "13:25", "selesai": "14:00" }
            ],
            "Jumat": [
                { "id": 1, "mulai": "07:00", "selesai": "07:35" }, { "id": 2, "mulai": "07:35", "selesai": "08:10" },
                { "id": 3, "mulai": "08:10", "selesai": "08:45" }, { "id": 4, "mulai": "08:45", "selesai": "09:20" },
                { "id": 5, "mulai": "09:20", "selesai": "09:55" }, { "id": 6, "mulai": "09:55", "selesai": "10:30" },
                { "id": 7, "mulai": "10:30", "selesai": "11:05" }, { "id": 8, "mulai": "11:05", "selesai": "11:40" },
                { "id": 9, "mulai": "11:40", "selesai": "12:15" }, { "id": 10, "mulai": "12:15", "selesai": "12:50" },
                { "id": 11, "mulai": "12:50", "selesai": "13:25" }, { "id": 12, "mulai": "13:25", "selesai": "14:00" }
            ]
        };

        const colorPalette = [
            { bg: 'bg-blue-950/80', border: 'border-blue-500', text: 'text-blue-200', title: 'text-blue-300' },
            { bg: 'bg-emerald-950/80', border: 'border-emerald-500', text: 'text-emerald-200', title: 'text-emerald-300' },
            { bg: 'bg-purple-950/80', border: 'border-purple-500', text: 'text-purple-200', title: 'text-purple-300' },
            { bg: 'bg-amber-950/80', border: 'border-amber-500', text: 'text-amber-200', title: 'text-amber-300' },
            { bg: 'bg-rose-950/80', border: 'border-rose-500', text: 'text-rose-200', title: 'text-rose-300' },
            { bg: 'bg-cyan-950/80', border: 'border-cyan-500', text: 'text-cyan-200', title: 'text-cyan-300' },
            { bg: 'bg-indigo-950/80', border: 'border-indigo-500', text: 'text-indigo-200', title: 'text-indigo-300' },
            { bg: 'bg-teal-950/80', border: 'border-teal-500', text: 'text-teal-200', title: 'text-teal-300' },
            { bg: 'bg-orange-950/80', border: 'border-orange-500', text: 'text-orange-200', title: 'text-orange-300' },
            { bg: 'bg-pink-950/80', border: 'border-pink-500', text: 'text-pink-200', title: 'text-pink-300' }
        ];

        function getSubjectColor(mapelName) {
            let hash = 0;
            for (let i = 0; i < mapelName.length; i++) {
                hash = mapelName.charCodeAt(i) + ((hash << 5) - hash);
            }
            return colorPalette[Math.abs(hash) % colorPalette.length];
        }

        async function mulaiGenerate() {
            const btn = document.getElementById('btnStart');
            const progressBar = document.getElementById('progressBar');
            const statusMessage = document.getElementById('statusMessage');
            const genInfo = document.getElementById('genInfo');
            const fitnessVal = document.getElementById('fitnessVal');
            const matrixContainer = document.getElementById('matrixContainer');
            const kromosomGenInfo = document.getElementById('kromosomGenInfo');
            const groupedTableBody = document.getElementById('groupedTeacherTableBody');
            const clashContainer = document.getElementById('clashContainer');
            const clashBadge = document.getElementById('clashBadge');

            const populasiInput = parseInt(document.getElementById('inputPopulasi').value) || 50;
            const generasiInput = parseInt(document.getElementById('inputGenerasi').value) || 500;
            const tahunAjaranId = 1;

            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');

            try {
                const response = await fetch('/master/generate-jadwal/store', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}',
                        'Accept': 'text/event-stream'
                    },
                    body: JSON.stringify({
                        tahun_ajaran_id: tahunAjaranId,
                        populasi: populasiInput,
                        generasi: generasiInput,
                        slot_waktu: slotWaktuArrayData
                    })
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    let lines = buffer.split('\n\n');
                    buffer = lines.pop();

                    for (let line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.substring(6);
                            try {
                                const data = JSON.parse(jsonStr);

                                if (data.type === 'progress') {
                                    if (data.generation !== undefined) {
                                        const percent = Math.round((data.generation / generasiInput) * 100);
                                        progressBar.style.width = percent + '%';
                                        progressBar.innerText = percent + '%';
                                        genInfo.innerText = `${data.generation} / ${generasiInput}`;
                                        fitnessVal.innerText = parseFloat(data.fitness || 0).toFixed(6);
                                    }
                                    if (data.message) {
                                        statusMessage.innerText = data.message;
                                    }
                                }
                                else if (data.type === 'new_best' || data.type === 'done') {
                                    if (data.type === 'new_best') {
                                        fitnessVal.innerText = parseFloat(data.fitness).toFixed(6);
                                        kromosomGenInfo.innerText = `Gen: ${data.generation}`;
                                    } else {
                                        statusMessage.innerText = data.message;
                                        statusMessage.className = "text-sm text-green-400 font-bold";
                                        progressBar.style.width = '100%';
                                        progressBar.innerText = '100%';
                                        btn.disabled = false;
                                        btn.classList.remove('opacity-50', 'cursor-not-allowed');
                                    }

                                    const kromosomData = data.kromosom || data.best_kromosom;
                                    if (kromosomData && Object.keys(kromosomData).length > 0) {
                                        matrixContainer.innerHTML = '';
                                        groupedTableBody.innerHTML = '';

                                        let teacherSlots = {};
                                        let teacherGroupedMap = {};
                                        let clashReports = [];

                                        // 1. Rekap data guru & pengisian matriks ketersediaan guru
                                        for (const [kelasId, blocks] of Object.entries(kromosomData)) {
                                            for (const [blokKey, gen] of Object.entries(blocks)) {
                                                let guruId = gen.guru_id ? String(gen.guru_id) : 'none';
                                                let h = gen.hari;
                                                let jMulai = parseInt(gen.jam_mulai || 1);
                                                let durasi = parseInt(gen.durasi || 1);
                                                let namaMapel = gen.nama_mapel || 'Mapel';

                                                // Logika Pengecualian Penjaskes
                                                let isPenjaskes = gen.is_penjaskes === true || String(namaMapel).toLowerCase().includes('penjas') || String(namaMapel).toLowerCase().includes('olahraga');

                                                if (!teacherGroupedMap[guruId]) {
                                                    teacherGroupedMap[guruId] = { guru_id: guruId, mapels: new Set(), total_beban: 0, kelas: new Set() };
                                                }
                                                teacherGroupedMap[guruId].mapels.add(namaMapel);
                                                teacherGroupedMap[guruId].total_beban += durasi;
                                                teacherGroupedMap[guruId].kelas.add(`Kelas ${kelasId}`);

                                                // HANYA simpan slot guru untuk mapel non-penjaskes untuk menghindari tracking guru Penjaskes
                                                if (guruId && guruId !== 'none' && guruId !== '0' && !isPenjaskes) {
                                                    if (!teacherSlots[guruId]) teacherSlots[guruId] = {};
                                                    if (!teacherSlots[guruId][h]) teacherSlots[guruId][h] = {};

                                                    for (let d = 0; d < durasi; d++) {
                                                        let jamKe = jMulai + d;
                                                        if (!teacherSlots[guruId][h][jamKe]) {
                                                            teacherSlots[guruId][h][jamKe] = [];
                                                        }

                                                        let exists = teacherSlots[guruId][h][jamKe].find(x => x.kelas_id === String(kelasId));
                                                        if (!exists) {
                                                            teacherSlots[guruId][h][jamKe].push({
                                                                kelas_id: String(kelasId),
                                                                mapel: namaMapel
                                                            });
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        // Evaluasi Laporan Bentrok: Bentrok Jadwal Guru
                                        for (const [gId, hariData] of Object.entries(teacherSlots)) {
                                            for (const [h, jamData] of Object.entries(hariData)) {
                                                for (const [j, jadwalList] of Object.entries(jamData)) {
                                                    if (jadwalList.length > 1) {
                                                        let mapelList = jadwalList.map(x => `${x.mapel} (Kelas ${x.kelas_id})`).join(' vs ');
                                                        clashReports.push({
                                                            type: 'Guru',
                                                            title: `Tumpang Tindih Guru (ID: ${gId})`,
                                                            desc: `${h}, Jam ke-${j} : Mengajar di ${jadwalList.length} kelas sekaligus -> ${mapelList}`
                                                        });
                                                    }
                                                }
                                            }
                                        }

                                        // Render Rekap Guru
                                        for (const [gId, info] of Object.entries(teacherGroupedMap)) {
                                            let tr = document.createElement('tr');
                                            tr.className = "hover:bg-gray-800/50 border-b border-gray-700/50";
                                            tr.innerHTML = `
                                                <td class="border border-gray-700 p-2.5 font-bold text-green-400 text-center">ID: ${gId}</td>
                                                <td class="border border-gray-700 p-2.5 text-amber-300">${Array.from(info.mapels).join(', ')}</td>
                                                <td class="border border-gray-700 p-2.5 text-center font-bold text-cyan-300">${info.total_beban} JP</td>
                                                <td class="border border-gray-700 p-2.5 text-gray-300">${Array.from(info.kelas).join(', ')}</td>
                                            `;
                                            groupedTableBody.appendChild(tr);
                                        }

                                        // 2. Render Matriks Kelas & Evaluasi Tumpang Tindih Slot Kelas
                                        for (const [kelasId, blocks] of Object.entries(kromosomData)) {
                                            let totalBlok = Object.keys(blocks).length;
                                            let totalJam = 0;
                                            let classSubjects = new Set();

                                            let jadwalMatrix = {};
                                            hariList.forEach(h => {
                                                jadwalMatrix[h] = {};
                                                let limitJam = (h === 'Kamis' || h === 'Jumat') ? 12 : 11;
                                                for (let j = 1; j <= limitJam; j++) {
                                                    jadwalMatrix[h][j] = [];
                                                }
                                            });

                                            for (const [blokKey, gen] of Object.entries(blocks)) {
                                                let h = gen.hari;
                                                let jMulai = parseInt(gen.jam_mulai);
                                                let durasi = parseInt(gen.durasi || 1);

                                                totalJam += durasi;
                                                if(gen.nama_mapel) classSubjects.add(gen.nama_mapel);

                                                if (jadwalMatrix[h]) {
                                                    for (let d = 0; d < durasi; d++) {
                                                        let jamKe = jMulai + d;
                                                        if (jadwalMatrix[h][jamKe]) {
                                                            jadwalMatrix[h][jamKe].push({
                                                                ...gen,
                                                                is_start: (d === 0)
                                                            });
                                                        }
                                                    }
                                                }
                                            }

                                            let kelasWrapper = document.createElement('div');
                                            kelasWrapper.className = "bg-gray-900 p-4 rounded-lg border border-gray-700 overflow-x-auto space-y-3 animate-chromosome";

                                            let title = document.createElement('div');
                                            title.className = "flex justify-between items-center";
                                            title.innerHTML = `
                                                <h3 class="text-yellow-400 font-bold text-base">📁 Kelas ID: ${kelasId}</h3>
                                                <span class="text-xs font-mono bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1 rounded-full">
                                                    Total Blok: <strong class="text-cyan-400">${totalBlok}</strong> | Total Jam: <strong class="text-green-400">${totalJam} JP</strong>
                                                </span>
                                            `;
                                            kelasWrapper.appendChild(title);

                                            let legendContainer = document.createElement('div');
                                            legendContainer.className = "flex flex-wrap gap-2 bg-gray-950 p-2.5 rounded border border-gray-800 text-[11px]";
                                            legendContainer.innerHTML = `<span class="text-gray-400 font-bold self-center mr-1">Legenda Mapel:</span>`;
                                            classSubjects.forEach(subj => {
                                                let col = getSubjectColor(subj);
                                                let badge = document.createElement('span');
                                                badge.className = `px-2 py-0.5 rounded border ${col.bg} ${col.border} ${col.title} font-semibold`;
                                                badge.innerText = subj;
                                                legendContainer.appendChild(badge);
                                            });
                                            kelasWrapper.appendChild(legendContainer);

                                            let table = document.createElement('table');
                                            table.className = "w-full border-collapse text-xs text-center font-mono";

                                            let thead = document.createElement('thead');
                                            let headerRow = document.createElement('tr');
                                            headerRow.className = "bg-gray-800 text-gray-300";
                                            headerRow.innerHTML = `<th class="border border-gray-700 p-2 w-24">Hari / Jam</th>`;
                                            for(let j=1; j<=12; j++) {
                                                headerRow.innerHTML += `<th class="border border-gray-700 p-2">Jam ${j}</th>`;
                                            }
                                            thead.appendChild(headerRow);
                                            table.appendChild(thead);

                                            let tbody = document.createElement('tbody');
                                            hariList.forEach(h => {
                                                let limitJam = (h === 'Kamis' || h === 'Jumat') ? 12 : 11;
                                                let row = document.createElement('tr');
                                                row.className = "hover:bg-gray-800/50 transition duration-150";
                                                row.innerHTML = `<td class="border border-gray-700 p-2 font-bold bg-gray-800/80 text-cyan-300">${h}</td>`;

                                                for(let j=1; j<=12; j++) {
                                                    if (j > limitJam) {
                                                        row.innerHTML += `<td class="border border-gray-700 p-2 bg-gray-950/40 text-gray-700">-</td>`;
                                                        continue;
                                                    }

                                                    let slots = jadwalMatrix[h][j];

                                                    if (!slots || slots.length === 0) {
                                                        row.innerHTML += `<td class="border border-gray-700 p-2 text-gray-600">-</td>`;
                                                        continue;
                                                    }

                                                    let isBentrok = slots.length > 1;

                                                    if (isBentrok) {
                                                        let mapelListStr = slots.map(s => `${s.nama_mapel} (Guru ID: ${s.guru_id})`).join(' vs ');
                                                        clashReports.push({
                                                            type: 'Kelas',
                                                            title: `Bentrok Mapel (Kelas ${kelasId})`,
                                                            desc: `${h}, Jam ke-${j} : ${mapelListStr}`
                                                        });
                                                    }

                                                    let hasTeacherClash = false;
                                                    slots.forEach(s => {
                                                        let isPenjas = s.is_penjaskes === true || String(s.nama_mapel).toLowerCase().includes('penjas') || String(s.nama_mapel).toLowerCase().includes('olahraga');
                                                        let guruIdStr = s.guru_id ? String(s.guru_id) : null;

                                                        // Validasi bentrok guru dipastikan kebal terhadap penjaskes
                                                        if (!isPenjas && guruIdStr && guruIdStr !== 'none' && teacherSlots[guruIdStr]?.[h]?.[j]?.length > 1) {
                                                            hasTeacherClash = true;
                                                        }
                                                    });

                                                    if (hasTeacherClash) isBentrok = true;

                                                    if (isBentrok) {
                                                        let mapelListStr = slots.map(s => `<span class="underline">${s.nama_mapel}</span>`).join(' & ');
                                                        row.innerHTML += `
                                                            <td class="border border-gray-700 p-2 bg-red-950/90 border-red-500 text-red-200 animate-pulse">
                                                                <div class="font-bold text-red-300 truncate text-[10px]" title="Bentrok: ${slots.map(s=>s.nama_mapel).join(', ')}">⚠️ TUMPANG TINDIH</div>
                                                                <div class="text-[9px] text-red-200 font-semibold truncate leading-tight mt-1">${mapelListStr}</div>
                                                            </td>
                                                        `;
                                                    } else {
                                                        let primarySlot = slots[0];

                                                        let blockIsClean = true;
                                                        for (let d = 0; d < primarySlot.durasi; d++) {
                                                            let checkJam = primarySlot.jam_mulai + d;
                                                            if (jadwalMatrix[h][checkJam] && jadwalMatrix[h][checkJam].length > 1) {
                                                                blockIsClean = false;
                                                            }
                                                        }

                                                        if (blockIsClean) {
                                                            if (primarySlot.is_start) {
                                                                let subColor = getSubjectColor(primarySlot.nama_mapel || 'Mapel');
                                                                let bgClass = `${subColor.bg} ${subColor.border} ${subColor.text}`;
                                                                row.innerHTML += `
                                                                    <td colspan="${primarySlot.durasi}" class="border border-gray-700 p-2 ${bgClass}">
                                                                        <div class="font-bold ${subColor.title} truncate" title="${primarySlot.nama_mapel}">${primarySlot.nama_mapel || 'Mapel'}</div>
                                                                        <div class="text-[10px] text-gray-400 truncate">Guru ID: ${primarySlot.guru_id}</div>
                                                                    </td>
                                                                `;
                                                            }
                                                        } else {
                                                            let subColor = getSubjectColor(primarySlot.nama_mapel || 'Mapel');
                                                            let bgClass = `${subColor.bg} ${subColor.border} ${subColor.text}`;
                                                            row.innerHTML += `
                                                                <td colspan="1" class="border border-gray-700 p-2 ${bgClass}">
                                                                    <div class="font-bold ${subColor.title} truncate" title="${primarySlot.nama_mapel}">${primarySlot.nama_mapel || 'Mapel'}</div>
                                                                    <div class="text-[10px] text-gray-400 truncate">Guru ID: ${primarySlot.guru_id}</div>
                                                                </td>
                                                            `;
                                                        }
                                                    }
                                                }
                                                tbody.appendChild(row);
                                            });
                                            table.appendChild(tbody);
                                            kelasWrapper.appendChild(table);
                                            matrixContainer.appendChild(kelasWrapper);
                                        }

                                        // Render UI Laporan Bentrok
                                        clashContainer.innerHTML = '';
                                        if (clashReports.length === 0) {
                                            clashBadge.className = "text-xs font-mono bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-700";
                                            clashBadge.innerText = "Aman (0 Bentrok)";
                                            clashContainer.innerHTML = `<div class="bg-green-950/30 border border-green-900 text-green-400 p-4 rounded-lg text-sm flex items-center justify-center h-full">✅ Tidak ada tumpang tindih mapel atau bentrok jadwal guru.</div>`;
                                        } else {
                                            clashBadge.className = "text-xs font-mono bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-700 animate-pulse";
                                            clashBadge.innerText = `${clashReports.length} Bentrok`;

                                            const uniqueClashList = Array.from(new Set(clashReports.map(a => JSON.stringify(a)))).map(a => JSON.parse(a));

                                            uniqueClashList.forEach(c => {
                                                let icon = c.type === 'Guru' ? '🧑‍🏫' : '🏫';
                                                clashContainer.innerHTML += `
                                                    <div class="bg-red-950/20 border border-red-900/50 p-3 rounded-lg flex flex-col md:flex-row items-start gap-3 text-left">
                                                        <div class="text-xl">${icon}</div>
                                                        <div>
                                                            <div class="text-red-300 font-bold text-[13px]">${c.title}</div>
                                                            <div class="text-red-200/80 text-[11px] mt-0.5">${c.desc}</div>
                                                        </div>
                                                    </div>
                                                `;
                                            });
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error("Gagal parse JSON dari stream:", e);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error saat fetch SSE:", err);
                statusMessage.innerText = "Error koneksi ke server.";
                statusMessage.className = "text-sm text-red-400 font-bold";
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    </script>
</body>
</html>
