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
        @keyframes highlightPulse {
            0% { box-shadow: 0 0 0 0rem rgba(234, 179, 8, 0.7); border-color: rgba(234, 179, 8, 1); }
            50% { box-shadow: 0 0 20px 4px rgba(234, 179, 8, 0.5); border-color: rgba(234, 179, 8, 1); }
            100% { box-shadow: 0 0 0 0rem rgba(234, 179, 8, 0); }
        }
        @keyframes toastSlideIn {
            0% { transform: translateX(100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
        }
        .animate-chromosome { animation: fadeInScale 0.25s ease-in-out forwards; }
        .highlight-update { animation: highlightPulse 1.2s ease-in-out infinite; }
        .toast-animate { animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* Custom scrollbar untuk log */
        .log-scroll::-webkit-scrollbar { width: 6px; }
        .log-scroll::-webkit-scrollbar-track { background: #111827; }
        .log-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
    </style>
</head>
<body class="bg-gray-900 text-white p-6 font-sans relative">

    <!-- CONTAINER NOTIFIKASI TOAST MELAYANG -->
    <div id="toastContainer" class="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"></div>

    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Header & Konfigurasi Parameter -->
        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg space-y-4">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold flex items-center gap-2">⚡ Real-Time GA Scheduler Monitor</h1>
                    <p class="text-xs text-gray-400 mt-1">Konfigurasi Algoritma Genetika & Jam Operasional (Mulai 07:00, 35 Menit/JP)</p>
                </div>
                <button id="btnStart" onclick="mulaiGenerate()" class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow transition duration-200 cursor-pointer">
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
                    <span id="fitnessVal" class="text-primary-400 font-bold font-mono text-base">0.0000</span>
                </div>
            </div>

            <!-- Pelacakan Bentrok -->
            <div class="bg-gray-800 p-5 rounded-xl shadow border border-gray-700 md:col-span-2 flex flex-col">
                <div class="flex justify-between items-center mb-3">
                    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">🚨 Pelacakan Bentrok & Tumpang Tindih</h2>
                    <span id="clashBadge" class="text-xs font-mono bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600">Menunggu...</span>
                </div>
                <div id="clashContainer" class="bg-black p-3 rounded-lg border border-gray-900 flex-1 h-48 overflow-y-auto log-scroll space-y-2 font-mono text-xs text-gray-500">
                    <div>[System] Log bentrok akan muncul di sini saat proses selesai atau optimal ditemukan.</div>
                </div>
            </div>
        </div>

        <!-- ================= PANEL BARU: LIVE ACTIVITY LOG ================= -->
        <div class="bg-gray-800 p-5 rounded-xl shadow border border-gray-700">
            <div class="flex justify-between items-center mb-3">
                <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span class="animate-pulse h-2 w-2 bg-red-500 rounded-full inline-block"></span>
                    Live Activity Log
                </h2>
                <span id="logCounterBadge" class="text-xs font-mono bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-700">0 Events Terpantau</span>
            </div>
            <div id="activityLogContainer" class="bg-black p-3 rounded-lg border border-gray-900 h-64 overflow-y-auto log-scroll space-y-2 font-mono text-xs text-gray-400">
                <div id="emptyLogText" class="text-gray-600 italic">[System] Menunggu log mutasi & relokasi mapel...</div>
            </div>
        </div>
        <!-- =============================================================== -->

        <!-- Matriks Jadwal -->
        <div id="matrixSection" class="bg-gray-800 p-5 rounded-xl shadow border border-gray-700 transition-all duration-300">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Visualisasi Matriks Jadwal Per Kelas</h2>
                <span id="kromosomGenInfo" class="text-xs font-mono bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-700">Gen: -</span>
            </div>

            <div id="matrixContainer" class="space-y-8">
                <div class="text-gray-500 italic text-sm">Belum ada jadwal yang terbentuk...</div>
            </div>
        </div>

        <!-- Rekapitulasi Guru -->
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
                { "id": 11, "mulai": "12:50", "selesai": "13:25" }
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
            { bg: 'bg-primary-950/80', border: 'border-primary-500', text: 'text-primary-200', title: 'text-primary-300' },
            { bg: 'bg-orange-950/80', border: 'border-orange-500', text: 'text-orange-200', title: 'text-orange-300' },
            { bg: 'bg-pink-950/80', border: 'border-pink-500', text: 'text-pink-200', title: 'text-pink-300' }
        ];

        let lastFitness = 0;
        let totalLogCount = 0; // State untuk menghitung log live event

        function getSubjectColor(mapelName) {
            let hash = 0;
            for (let i = 0; i < mapelName.length; i++) {
                hash = mapelName.charCodeAt(i) + ((hash << 5) - hash);
            }
            return colorPalette[Math.abs(hash) % colorPalette.length];
        }

        function showToastAlert(gen, oldFit, newFit, clashCount) {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            const fitDiff = (newFit - oldFit).toFixed(6);
            const isClashFree = clashCount === 0;

            toast.className = `toast-animate pointer-events-auto bg-gray-800 border ${isClashFree ? 'border-primary-500' : 'border-yellow-500'} p-4 rounded-xl shadow-2xl space-y-1 text-xs`;
            toast.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-bold text-yellow-400 flex items-center gap-1">⚡ Generasi ${gen} Updated!</span>
                    <span class="text-[10px] font-mono bg-gray-900 text-gray-400 px-2 py-0.5 rounded">GA Event</span>
                </div>
                <div class="text-gray-200">
                    Fitness: <strong class="text-primary-400 font-mono">${parseFloat(newFit).toFixed(6)}</strong>
                    <span class="text-emerald-400 text-[10px]">(+${fitDiff})</span>
                </div>
                <div class="text-gray-400 text-[11px]">
                    Status Bentrok: <strong class="${isClashFree ? 'text-primary-400' : 'text-red-400'}">${isClashFree ? '0 Bentrok (Optimal!)' : clashCount + ' Bentrok Terdeteksi'}</strong>
                </div>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease-in-out';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }

        // ================= FUNGSI UNTUK APPEND LOG KE UI =================
        function appendLiveLog(logObj) {
            const container = document.getElementById('activityLogContainer');
            const emptyText = document.getElementById('emptyLogText');
            const badgeCount = document.getElementById('logCounterBadge');

            if (emptyText) emptyText.remove(); // Hapus text waiting saat log pertama masuk
            totalLogCount++;
            badgeCount.innerText = `${totalLogCount} Events Terpantau`;

            // Tentukan style badge berdasarkan "tahap"
            let badgeClass = "bg-gray-700 text-gray-300";
            if (logObj.tahap === 'TUKAR_MAPEL') badgeClass = "bg-blue-900 border border-blue-600 text-blue-300";
            else if (logObj.tahap === 'RELOKASI_MAPEL') badgeClass = "bg-orange-900 border border-orange-600 text-orange-300";
            else if (logObj.tahap === 'STAGNASI') badgeClass = "bg-red-900 border border-red-600 text-red-300";
            else if (logObj.tahap === 'NEW_BEST') badgeClass = "bg-primary-900 border border-primary-600 text-primary-300";
            else if (logObj.tahap === 'START' || logObj.tahap === 'FINISH') badgeClass = "bg-purple-900 border border-purple-600 text-purple-300";

            // Parse jam dari datetime (misal "2026-10-03 19:35:00" -> "19:35:00")
            let timeOnly = logObj.waktu;
            if(logObj.waktu && logObj.waktu.includes(' ')) timeOnly = logObj.waktu.split(' ')[1];

            // Render Detail Data JSON
            let detailHtml = '';
            if (logObj.data && Object.keys(logObj.data).length > 0) {
                detailHtml = `<div class="mt-1 pl-3 border-l-2 border-gray-700 text-[10px] text-gray-500 ml-1">`;
                for (const [key, val] of Object.entries(logObj.data)) {
                    detailHtml += `<span class="text-gray-400 capitalize">${key.replace('_', ' ')}:</span> <span class="text-gray-300">${val}</span> &nbsp; | &nbsp; `;
                }
                // Hapus separator terakhir
                detailHtml = detailHtml.substring(0, detailHtml.length - 15) + `</div>`;
            }

            const item = document.createElement('div');
            item.className = "border-b border-gray-800/80 pb-2 mb-2 last:border-0 hover:bg-gray-800/30 transition-colors";
            item.innerHTML = `
                <div class="flex items-start gap-2">
                    <span class="text-[10px] text-gray-600 whitespace-nowrap">[${timeOnly}]</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded ${badgeClass} font-bold whitespace-nowrap">${logObj.tahap}</span>
                    <span class="text-gray-200">${logObj.pesan}</span>
                </div>
                ${detailHtml}
            `;

            container.appendChild(item);

            // Auto-scroll kebawah
            container.scrollTop = container.scrollHeight;

            // Batasi elemen max 200 agar DOM / browser tidak lag
            if (container.children.length > 200) {
                container.removeChild(container.firstElementChild);
            }
        }
        // =================================================================

        function focusOnUpdate(kromosomData) {
            if (!kromosomData) return;

            const kelasIds = Object.keys(kromosomData);
            if (kelasIds.length === 0) return;

            const randomKelasId = kelasIds[Math.floor(Math.random() * kelasIds.length)];
            const targetCard = document.getElementById(`kelas-card-${randomKelasId}`);

            if (targetCard) {
                targetCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                targetCard.classList.add('highlight-update');
                setTimeout(() => {
                    targetCard.classList.remove('highlight-update');
                }, 1200);
            }
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

            // Log Container Reset
            const activityLogContainer = document.getElementById('activityLogContainer');
            activityLogContainer.innerHTML = '<div id="emptyLogText" class="text-gray-600 italic">[System] Proses dimulai, memantau log mutasi...</div>';
            totalLogCount = 0;
            document.getElementById('logCounterBadge').innerText = "0 Events Terpantau";

            const populasiInput = parseInt(document.getElementById('inputPopulasi').value) || 50;
            const generasiInput = parseInt(document.getElementById('inputGenerasi').value) || 500;
            const tahunAjaranId = 1; // Ubah sesuai controller Anda

            lastFitness = 0;
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');

            try {
                const response = await fetch('/master/generate-jadwal/store', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}', // Pastikan format ini sesuai di framework Anda
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
                    buffer = lines.pop(); // Sisa stream dimasukkan kembali ke buffer

                    for (let line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.substring(6);
                            try {
                                const data = JSON.parse(jsonStr);

                                // ====== EVENT: LOG ACTIVITY ======
                                if (data.type === 'log_update') {
                                    appendLiveLog(data.log);
                                }
                                // ====== EVENT: PROGRESS ======
                                else if (data.type === 'progress') {
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
                                // ====== EVENT: NEW_BEST / DONE ======
                                else if (data.type === 'new_best' || data.type === 'done') {
                                    let currentFitness = parseFloat(data.fitness || 0);

                                    if (data.type === 'new_best') {
                                        fitnessVal.innerText = currentFitness.toFixed(6);
                                        kromosomGenInfo.innerText = `Gen: ${data.generation}`;
                                    } else {
                                        statusMessage.innerText = data.message;
                                        statusMessage.className = "text-sm text-primary-400 font-bold";
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

                                        // 1. Rekap data guru
                                        for (const [kelasId, blocks] of Object.entries(kromosomData)) {
                                            for (const [blokKey, gen] of Object.entries(blocks)) {
                                                let guruId = gen.guru_id ? String(gen.guru_id) : 'none';
                                                let h = gen.hari;
                                                let jMulai = parseInt(gen.jam_mulai || 1);
                                                let durasi = parseInt(gen.durasi || 1);
                                                let namaMapel = gen.nama_mapel || 'Mapel';

                                                let isPenjaskes = gen.is_penjaskes === true || String(namaMapel).toLowerCase().includes('penjas') || String(namaMapel).toLowerCase().includes('olahraga');

                                                if (!teacherGroupedMap[guruId]) {
                                                    teacherGroupedMap[guruId] = { guru_id: guruId, mapels: new Set(), total_beban: 0, kelas: new Set() };
                                                }
                                                teacherGroupedMap[guruId].mapels.add(namaMapel);
                                                teacherGroupedMap[guruId].total_beban += durasi;
                                                teacherGroupedMap[guruId].kelas.add(`Kelas ${kelasId}`);

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

                                        // Laporan Bentrok Guru
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

                                        // Badge Bentrok
                                        if (clashReports.length === 0) {
                                            clashBadge.className = "text-xs font-mono bg-primary-900/80 text-primary-300 px-2.5 py-1 rounded border border-primary-600 font-bold";
                                            clashBadge.innerText = "0 Bentrok (Optimal!)";
                                            clashContainer.innerHTML = `<div class="text-primary-400 font-semibold p-2">✅ Jadwal Bebas Bentrok! Semua guru & kelas memiliki slot steril.</div>`;
                                        } else {
                                            clashBadge.className = "text-xs font-mono bg-red-900/80 text-red-300 px-2.5 py-1 rounded border border-red-600 font-bold";
                                            clashBadge.innerText = `${clashReports.length} Bentrok`;
                                            clashContainer.innerHTML = '';
                                            clashReports.forEach(rep => {
                                                let item = document.createElement('div');
                                                item.className = "bg-red-950/40 p-2 rounded border border-red-900/50 text-red-300";
                                                item.innerHTML = `<strong class="text-red-400">${rep.title}</strong><br>${rep.desc}`;
                                                clashContainer.appendChild(item);
                                            });
                                        }

                                        // Render Rekap Guru
                                        for (const [gId, info] of Object.entries(teacherGroupedMap)) {
                                            let tr = document.createElement('tr');
                                            tr.className = "hover:bg-gray-800/50 border-b border-gray-700/50";
                                            tr.innerHTML = `
                                                <td class="border border-gray-700 p-2.5 font-bold text-primary-400 text-center">ID: ${gId}</td>
                                                <td class="border border-gray-700 p-2.5 text-amber-300">${Array.from(info.mapels).join(', ')}</td>
                                                <td class="border border-gray-700 p-2.5 text-center font-bold text-cyan-300">${info.total_beban} JP</td>
                                                <td class="border border-gray-700 p-2.5 text-gray-300">${Array.from(info.kelas).join(', ')}</td>
                                            `;
                                            groupedTableBody.appendChild(tr);
                                        }

                                        // Render Matriks Kelas
                                        for (const [kelasId, blocks] of Object.entries(kromosomData)) {
                                            let totalBlok = Object.keys(blocks).length;
                                            let totalJam = 0;
                                            let classSubjects = new Set();
                                            let jadwalMatrix = {};
                                            let maxJamKelas = 12;

                                            hariList.forEach(h => { jadwalMatrix[h] = {}; });

                                            for (const [blokKey, gen] of Object.entries(blocks)) {
                                                let h = gen.hari;
                                                let jMulai = parseInt(gen.jam_mulai);
                                                let durasi = parseInt(gen.durasi || 1);

                                                totalJam += durasi;
                                                if(gen.nama_mapel) classSubjects.add(gen.nama_mapel);

                                                let endJam = jMulai + durasi - 1;
                                                if(endJam > maxJamKelas) maxJamKelas = endJam;

                                                if (jadwalMatrix[h]) {
                                                    for (let d = 0; d < durasi; d++) {
                                                        let jamKe = jMulai + d;
                                                        if (!jadwalMatrix[h][jamKe]) {
                                                            jadwalMatrix[h][jamKe] = [];
                                                        }
                                                        jadwalMatrix[h][jamKe].push({
                                                            ...gen,
                                                            is_start: (d === 0)
                                                        });
                                                    }
                                                }
                                            }

                                            let kelasWrapper = document.createElement('div');
                                            kelasWrapper.className = "bg-gray-900 p-4 rounded-lg border border-gray-700 overflow-x-auto space-y-3 animate-chromosome";
                                            kelasWrapper.id = `kelas-card-${kelasId}`;

                                            let title = document.createElement('div');
                                            title.className = "flex justify-between items-center";
                                            title.innerHTML = `
                                                <h3 class="text-yellow-400 font-bold text-base">📁 Kelas ID: ${kelasId}</h3>
                                                <span class="text-xs font-mono bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1 rounded-full">
                                                    Total Blok: <strong class="text-cyan-400">${totalBlok}</strong> | Total Jam: <strong class="text-primary-400">${totalJam} JP</strong>
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

                                            for(let j = 1; j <= maxJamKelas; j++) {
                                                headerRow.innerHTML += `<th class="border border-gray-700 p-2">Jam ${j}</th>`;
                                            }
                                            thead.appendChild(headerRow);
                                            table.appendChild(thead);

                                            let tbody = document.createElement('tbody');
                                            hariList.forEach(h => {
                                                let limitHari = (h === 'Kamis' || h === 'Jumat') ? 12 : 11;
                                                let row = document.createElement('tr');
                                                row.className = "hover:bg-gray-800/50 transition duration-150";
                                                row.innerHTML = `<td class="border border-gray-700 p-2 font-bold bg-gray-800/80 text-cyan-300">${h}</td>`;

                                                for(let j = 1; j <= maxJamKelas; j++) {
                                                    let slots = jadwalMatrix[h][j];

                                                    if (!slots || slots.length === 0) {
                                                        if (j > limitHari) {
                                                            row.innerHTML += `<td class="border border-gray-700 p-2 bg-gray-950/60 text-gray-700 font-bold">-</td>`;
                                                        } else {
                                                            row.innerHTML += `<td class="border border-gray-700 p-2 text-gray-600 font-bold bg-gray-950/20">-</td>`;
                                                        }
                                                        continue;
                                                    }

                                                    let isBentrok = slots.length > 1;
                                                    let cellContent = slots.map(s => {
                                                        let col = getSubjectColor(s.nama_mapel || 'Mapel');
                                                        return `<div class="${col.bg} ${col.border} ${col.text} p-1 rounded border text-[10px] font-bold">
                                                            ${s.nama_mapel}<br><span class="text-[9px] text-gray-400">Guru ID: ${s.guru_id}</span>
                                                        </div>`;
                                                    }).join('<div class="text-red-500 font-bold my-0.5">VS</div>');

                                                    let bgCell = isBentrok ? 'bg-red-950/60 border-red-600' : '';
                                                    row.innerHTML += `<td class="border border-gray-700 p-1.5 ${bgCell}">${cellContent}</td>`;
                                                }
                                                tbody.appendChild(row);
                                            });

                                            table.appendChild(tbody);
                                            kelasWrapper.appendChild(table);
                                            matrixContainer.appendChild(kelasWrapper);
                                        }

                                        if (data.type === 'new_best') {
                                            showToastAlert(data.generation, lastFitness, currentFitness, clashReports.length);
                                            lastFitness = currentFitness;
                                            focusOnUpdate(kromosomData);
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error("JSON parse error", e);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Fetch error", error);
                statusMessage.innerText = "Terjadi kesalahan koneksi streaming.";
                statusMessage.className = "text-sm text-red-400 font-bold";
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    </script>
</body>
</html>
