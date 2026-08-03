import React, { useState } from "react";
import {
    AlertCircle,
    CalendarDays,
    ClipboardCopy,
    ClipboardCopyIcon,
    Clock,
    Library,
    Play,
    Plus,
    Search,
    Sliders,
    Sun,
    Trash2,
} from "lucide-react";
import SlotWaktu from "./grid/SlotWaktu";

export default function Configurasi({
    tahunAjaranList,
    selectedTahunAjaran,
    setSelectedTahunAjaran,
    selectedNamaTahunAjaran,
    setSelectedNamaTahunAjaran,
    selectedPrioritas,
    setSelectedPrioritas,
    searchQuery,
    setSearchQuery,
    listMapelGuru,
    historyJadwal,
    progress,
    setProgress,
    setIsGenerating,
    isGenerating,
    setActiveTab,
    setGeneration,
    setFitness,
    setLogs,
}) {
    const [pop, setpop] = useState(100);
    const [gen, setgen] = useState(500);
    // 🌟 Konfigurasi Jam Pelajaran Dinamis 🌟

    // State baru untuk menyimpan ID mapel yang diklik sebagai filter
    const [selectedMapelFilter, setSelectedMapelFilter] = useState(null);

    const daftarHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    // Jadwal default (template)
    const defaultSlots = [];
    const [slotsPerHari, setSlotsPerHari] = useState(() => {
        const initialState = {};
        daftarHari.forEach((hari) => {
            initialState[hari] = [...defaultSlots];
        });
        return initialState;
    });
    const togglePrioritasKelas = (mapel_id, nip, kelas_id) => {
        const key = `${mapel_id}_${nip}_${kelas_id}`;

        if (selectedPrioritas.includes(key)) {
            setSelectedPrioritas(
                selectedPrioritas.filter((item) => item !== key),
            );
        } else {
            setSelectedPrioritas([...selectedPrioritas, key]);
        }
    };

    // Fungsi handlePilihMapel yang sudah diperbaiki
    const handlePilihMapel = (mapelId) => {
        // Jika mapel yang sama diklik lagi, batalkan filter (toggle off)
        if (selectedMapelFilter === mapelId) {
            setSelectedMapelFilter(null);
        } else {
            setSelectedMapelFilter(mapelId); // Set filter ke mapel yang diklik
        }
    };

    const displayData = listMapelGuru
        .filter((mapel) => mapel.guru && mapel.guru.length > 0)
        // Tambahan filter untuk tombol mapel yang diklik
        .filter((mapel) => {
            return selectedMapelFilter
                ? mapel.id === selectedMapelFilter
                : true;
        })
        .map((mapel) => {
            const mapGuru = new Map();

            // Kelompokkan kelas ke dalam setiap guru
            mapel.guru.forEach((g) => {
                if (!mapGuru.has(g.nip)) {
                    mapGuru.set(g.nip, {
                        ...g,
                        detail_kelas: g.kelas_id
                            ? [
                                  {
                                      kelas_id: g.kelas_id,
                                      nama_kelas: g.nama_kelas,
                                      beban_jam: Number(g.beban_jam) || 0,
                                  },
                              ]
                            : [],
                        total_jam: Number(g.beban_jam) || 0,
                    });
                } else {
                    const existing = mapGuru.get(g.nip);
                    if (
                        g.kelas_id &&
                        !existing.detail_kelas.find(
                            (k) => k.kelas_id === g.kelas_id,
                        )
                    ) {
                        existing.detail_kelas.push({
                            kelas_id: g.kelas_id,
                            nama_kelas: g.nama_kelas,
                            beban_jam: Number(g.beban_jam) || 0,
                        });
                    }
                    existing.total_jam += Number(g.beban_jam) || 0;
                }
            });

            const uniqueGuru = Array.from(mapGuru.values());

            // Filter Pencarian Text
            const filteredGuru = uniqueGuru.filter(
                (g) =>
                    g.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.nip?.includes(searchQuery) ||
                    g.detail_kelas.some((k) =>
                        k.nama_kelas
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                    ) ||
                    mapel.mapel
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()),
            );

            return { ...mapel, guru: filteredGuru };
        })
        .filter((mapel) => mapel.guru.length > 0);

    // List mapel untuk tombol filter di bawah kotak pencarian
    const mapelList = listMapelGuru.filter(
        (mapel) => mapel.guru && mapel.guru.length > 0,
    );
    const handleStartGA = async () => {
        if (!selectedTahunAjaran) {
            alert("Harap pilih Tahun Ajaran terlebih dahulu sebelum memulai!");
            return;
        }

        if (slotsPerHari.length === 0) {
            alert("Sesi waktu belajar tidak boleh kosong!");
            return;
        }
        const formatPrioritas = selectedPrioritas.map((item) => {
            const [mapel, nip, kelas_id] = item.split("_");

            return {
                nip: nip,
                kelas_id: Number(kelas_id),
                mapel_id: Number(mapel),
            };
        });
        const payloadData = {
            tahun_ajaran_id: Number(selectedTahunAjaran),
            prioritas_pagi: formatPrioritas,
            populasi: pop,
            generasi: gen,
            slot_waktu: slotsPerHari,
        };

        setProgress(0);
        setGeneration(0);
        setFitness(0);
        setLogs([
            "[Sistem] Menghubungkan ke server dan menginisialisasi populasi awal...",
        ]);
        setIsGenerating(true);
        setActiveTab("proses");

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");
            const response = await fetch(
                route("master.generate-jadwal.store"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "text/event-stream",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    credentials: "same-origin",
                    body: JSON.stringify(payloadData),
                },
            );

            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
            if (!response.body)
                throw new Error("ReadableStream tidak didukung browser.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let chunkBuffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                chunkBuffer += decoder.decode(value, { stream: true });
                const lines = chunkBuffer.split("\n\n");
                chunkBuffer = lines.pop();

                lines.forEach((line) => {
                    if (line.startsWith("data: ")) {
                        try {
                            const parsedData = JSON.parse(
                                line.replace("data: ", "").trim(),
                            );

                            if (parsedData.type === "progress") {
                                setProgress(
                                    Math.min(
                                        Math.round(
                                            (parsedData.generation /
                                                payloadData.generasi) *
                                                100,
                                        ),
                                        98,
                                    ),
                                );
                                setGeneration(parsedData.generation);
                                setFitness(
                                    Number(parsedData.fitness).toFixed(3),
                                );
                                setLogs((prev) =>
                                    [parsedData.message, ...prev].slice(0, 5),
                                );
                            } else if (parsedData.type === "done") {
                                setProgress(100);
                                setLogs((prev) =>
                                    [parsedData.message, ...prev].slice(0, 5),
                                );
                                setIsGenerating(false);
                                setTimeout(() => setActiveTab("hasil"), 1500);
                            } else if (parsedData.type === "error") {
                                setLogs((prev) =>
                                    [
                                        `[Error] ${parsedData.message}`,
                                        ...prev,
                                    ].slice(0, 5),
                                );
                                setIsGenerating(false);
                            }
                        } catch (e) {}
                    }
                });
            }
        } catch (err) {
            setLogs((prev) => [
                `[Error Server] Terjadi kegagalan: ${err.message}`,
                ...prev,
            ]);
            setResetButton(true);
            setIsGenerating(false);
        }
    };
    console.log(selectedNamaTahunAjaran);
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Pemilihan Tahun Ajaran */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border-2 border-green-100 p-6 sm:p-8 rounded-2xl shadow-sm">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="flex-shrink-0 w-14 h-14 bg-green-600 text-white flex items-center justify-center rounded-2xl shadow-green-200 shadow-lg">
                            <CalendarDays size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                                Tahun Ajaran & Semester
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">
                                Tentukan periode aktif untuk jadwal yang akan
                                digenerate.
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-80">
                        <select
                            value={selectedTahunAjaran || ""}
                            onChange={(e) => {
                                setSelectedTahunAjaran(e.target.value);
                                const textLabel =
                                    e.target.options[e.target.selectedIndex]
                                        .text;
                                setSelectedNamaTahunAjaran(textLabel);
                            }}
                            className={`w-full text-sm font-bold rounded-xl border-2 px-4 py-3.5 transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-500/20 ${
                                !selectedTahunAjaran
                                    ? "bg-amber-50 border-amber-300 text-amber-800 focus:border-amber-500"
                                    : "bg-white border-green-200 text-green-900 focus:border-green-600"
                            }`}
                        >
                            <option
                                value=""
                                className="font-normal text-gray-500"
                            >
                                -- Klik Untuk Memilih Tahun Ajaran --
                            </option>
                            {tahunAjaranList
                                .filter(
                                    (ta) =>
                                        String(ta.value).toLowerCase() !==
                                        "all",
                                )
                                .map((ta) => (
                                    <option
                                        key={ta.value}
                                        value={ta.value}
                                        className="font-semibold text-gray-800"
                                    >
                                        {ta.label}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedTahunAjaran && historyJadwal?.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertCircle
                            size={20}
                            className="text-amber-600 flex-shrink-0"
                        />
                    </div>
                    <p className="text-sm text-amber-800 font-medium">
                        <strong className="font-bold">Perhatian:</strong> Tahun
                        ajaran ini sudah memiliki jadwal aktif. Menggenerate
                        ulang akan menimpa jadwal sebelumnya.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    {/* Parameter Algoritma */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-5">
                            <Sliders className="text-gray-400" size={18} />
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                Parameter Algoritma
                            </h4>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                                        Jumlah Populasi
                                    </label>
                                    <input
                                        type="number"
                                        value={pop || ""}
                                        onChange={(e) => setpop(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-green-500 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                                        Jumlah Generasi
                                    </label>
                                    <input
                                        type="number"
                                        value={gen || ""}
                                        onChange={(e) => setgen(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-green-500 bg-gray-50"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                                        Crossover Rate
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue="0.8"
                                        className="w-full px-4 py-2.5 rounded-xl border-gray-300 text-center text-sm font-bold focus:ring-2 focus:ring-green-500 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                                        Mutation Rate
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue="0.1"
                                        className="w-full px-4 py-2.5 rounded-xl border-gray-300 text-center text-sm font-bold focus:ring-2 focus:ring-green-500 bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pengaturan Sesi Waktu */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <SlotWaktu
                            daftarHari={daftarHari}
                            slotsPerHari={slotsPerHari}
                            setSlotsPerHari={setSlotsPerHari}
                        />
                    </div>
                </div>

                {/* Section Prioritas Pagi & Filter Mapel */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[650px] lg:h-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Sun size={20} className="text-amber-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                    Prioritas Pagi
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Pilih mata pelajaran & kelas yang diutamakan
                                    pagi hari.
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-black tracking-wider bg-green-100 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                            {selectedPrioritas?.length || 0} KELAS DIPILIH
                        </span>
                    </div>

                    <div className="relative mb-4 flex-shrink-0">
                        <Search
                            className="absolute left-3.5 top-3 text-gray-400"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Cari Mata Pelajaran, Kelas, atau Guru..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-gray-300 focus:ring-2 focus:ring-green-500 bg-gray-50 font-medium placeholder:text-gray-400"
                        />

                        {/* Tombol Filter Mapel yang diperbaiki (Aktif State) */}
                        <div className="w-full flex flex-wrap mt-3 gap-2">
                            {mapelList.map((m) => (
                                <div
                                    key={m.id}
                                    className={`px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all border ${
                                        selectedMapelFilter === m.id
                                            ? "bg-green-600 text-white border-green-600 shadow-green-200"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50"
                                    }`}
                                    onClick={() => handlePilihMapel(m.id)}
                                >
                                    <span className="text-xs font-bold">
                                        {m.mapel}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2 space-y-4 rounded-xl border border-gray-100 custom-scrollbar max-h-[400px]">
                        {displayData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Search
                                        className="text-gray-300"
                                        size={24}
                                    />
                                </div>
                                <p className="text-sm font-bold text-gray-500">
                                    Data tidak ditemukan
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Sistem belum memuat data atau pencarian
                                    tidak cocok.
                                </p>
                            </div>
                        ) : (
                            displayData.map((mapelObj) => (
                                <div
                                    key={mapelObj.id}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4"
                                >
                                    <div className="flex items-center gap-2 bg-green-50/80 px-4 py-2.5 border-b border-green-100">
                                        <Library
                                            size={16}
                                            className="text-green-600"
                                        />
                                        <span className="text-xs font-black text-green-800 uppercase tracking-wider">
                                            {mapelObj.mapel}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {mapelObj.guru.map((guru) => (
                                            <div
                                                key={guru.nip}
                                                className="flex flex-col p-3.5 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex flex-col mb-2.5">
                                                    <span className="font-bold text-sm text-gray-800">
                                                        {guru.nama}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-gray-400">
                                                        NIP: {guru.nip} • Total:{" "}
                                                        {guru.total_jam} Jam
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {guru.detail_kelas.map(
                                                        (kelas) => {
                                                            const mapelIdentifier =
                                                                mapelObj.mapel_id ||
                                                                mapelObj.mapel;
                                                            const keyPrioritas = `${mapelIdentifier}_${guru.nip}_${kelas.kelas_id}`;

                                                            const isChecked =
                                                                selectedPrioritas?.includes(
                                                                    keyPrioritas,
                                                                );

                                                            return (
                                                                <label
                                                                    key={
                                                                        keyPrioritas
                                                                    }
                                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                                                        isChecked
                                                                            ? "bg-green-100 border-green-300 text-green-800 font-bold shadow-sm"
                                                                            : "bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50/30"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                                                        checked={
                                                                            isChecked ||
                                                                            false
                                                                        }
                                                                        onChange={() =>
                                                                            togglePrioritasKelas(
                                                                                mapelObj.mapel_id ||
                                                                                    mapelObj.mapel,
                                                                                guru.nip,
                                                                                kelas.kelas_id,
                                                                            )
                                                                        }
                                                                    />
                                                                    <span>
                                                                        Kelas{" "}
                                                                        {
                                                                            kelas.nama_kelas
                                                                        }{" "}
                                                                        <span className="opacity-60">
                                                                            (
                                                                            {
                                                                                kelas.beban_jam
                                                                            }
                                                                            j)
                                                                        </span>
                                                                    </span>
                                                                </label>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                    onClick={handleStartGA}
                    disabled={
                        listMapelGuru.length === 0 || !selectedTahunAjaran
                    }
                    className={`flex items-center gap-2 font-black px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg ${
                        listMapelGuru.length === 0 || !selectedTahunAjaran
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-green-600 hover:bg-green-700 hover:-translate-y-1 hover:shadow-green-200 text-white"
                    }`}
                >
                    <Play size={20} fill="currentColor" />
                    MULAI PROSES ALGORITMA
                </button>
            </div>
        </div>
    );
}
