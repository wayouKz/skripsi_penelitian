import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
    Settings,
    Cpu,
    Calendar,
    CheckCircle2,
    Play,
    Sliders,
    Search,
    Sun,
    History,
    AlertCircle,
    CalendarDays,
    BookOpen,
    Library,
    Clock,
    Plus,
    Trash2,
} from "lucide-react";
import axios from "axios";

export default function GenerateJadwal() {
    // 1. State Data Master
    const [listMapelGuru, setListMapelGuru] = useState([]);

    // 2. State Tahun Ajaran & History
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);
    const [historyJadwal, setHistoryJadwal] = useState([]);

    // 3. State UI & GA
    const [activeTab, setActiveTab] = useState("konfigurasi");
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generation, setGeneration] = useState(0);
    const [fitness, setFitness] = useState(0);
    const [logs, setLogs] = useState([]);
    const [pop, setpop] = useState(100);
    const [gen, setgen] = useState(500);

    // 4. State Kustomisasi Guru & Prioritas Kelas
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPrioritas, setSelectedPrioritas] = useState([]); // Menyimpan NIP_KelasID

    const daftarHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    // 🌟 Konfigurasi Jam Pelajaran Dinamis 🌟
    const [slotWaktu, setSlotWaktu] = useState([
        { id: 1, mulai: "07:00", selesai: "07:45" },
        { id: 2, mulai: "07:45", selesai: "08:30" },
        { id: 3, mulai: "08:30", selesai: "09:15" },

        // JEDA ISTIRAHAT 1: 09:15 - 09:30 (15 Menit)

        // --- BLOK SIANG ---
        { id: 4, mulai: "09:30", selesai: "10:15" },
        { id: 5, mulai: "10:15", selesai: "11:00" },
        { id: 6, mulai: "11:00", selesai: "11:45" },

        // JEDA ISTIRAHAT 2 (ISHOMA): 11:45 - 12:30 (45 Menit)

        // --- BLOK SORE ---
        { id: 7, mulai: "12:30", selesai: "13:15" },
        { id: 8, mulai: "13:15", selesai: "14:00" },
        { id: 9, mulai: "14:00", selesai: "14:45" },
        { id: 10, mulai: "14:45", selesai: "15:30" },
    ]);

    // 5. Fetch Data API Awal
    const fetchDataAwal = async () => {
        try {
            const [dataGuru, DataTA, DataJadwal] = await Promise.all([
                axios.get(route("getData.get-mapel-guru"), {
                    params: { tahun_ajaran_id: selectedTahunAjaran },
                }),
                axios.get(route("getData.get-tahun-ajaran")),
                axios.get(route("getData.get-history-jadwal"), {
                    params: { tahun_ajaran_id: selectedTahunAjaran },
                }),
            ]);

            setTahunAjaranList(DataTA.data.data);
            setListMapelGuru(dataGuru.data.data);
            setHistoryJadwal(DataJadwal.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data inisial:", error);
        }
    };

    useEffect(() => {
        fetchDataAwal();
    }, [selectedTahunAjaran, activeTab]);

    // Data Mapping & Grouping (Berdasarkan NIP, lalu mengumpulkan Kelas)
    const displayData = listMapelGuru
        .filter((mapel) => mapel.guru && mapel.guru.length > 0)
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

            // Filter Pencarian
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

    const togglePrioritasKelas = (nip, kelas_id) => {
        const key = `${nip}_${kelas_id}`;
        if (selectedPrioritas.includes(key)) {
            setSelectedPrioritas(
                selectedPrioritas.filter((item) => item !== key),
            );
        } else {
            setSelectedPrioritas([...selectedPrioritas, key]);
        }
    };

    // FUNGSI MANIPULASI JAM PELAJARAN
    const handleAddSlot = () => {
        const newId =
            slotWaktu.length > 0
                ? Math.max(...slotWaktu.map((s) => s.id)) + 1
                : 1;
        setSlotWaktu([
            ...slotWaktu,
            { id: newId, mulai: "00:00", selesai: "00:00" },
        ]);
    };

    const handleRemoveSlot = (id) => {
        setSlotWaktu(slotWaktu.filter((slot) => slot.id !== id));
    };

    const handleSlotChange = (id, field, value) => {
        setSlotWaktu(
            slotWaktu.map((slot) =>
                slot.id === id ? { ...slot, [field]: value } : slot,
            ),
        );
    };

    // 6. Fungsi Handle Start GA
    const handleStartGA = async () => {
        if (!selectedTahunAjaran) {
            alert("Harap pilih Tahun Ajaran terlebih dahulu sebelum memulai!");
            return;
        }

        if (slotWaktu.length === 0) {
            alert("Sesi waktu belajar tidak boleh kosong!");
            return;
        }

        // Format array string ("nip_kelasid") menjadi array of objects untuk backend
        const formatPrioritas = selectedPrioritas.map((item) => {
            const [nip, kelas_id] = item.split("_");
            return {
                nip: nip,
                kelas_id: Number(kelas_id),
            };
        });

        const payloadData = {
            tahun_ajaran_id: Number(selectedTahunAjaran),
            prioritas_pagi: formatPrioritas, // 🌟 Format Object yang disesuaikan
            populasi: pop,
            generasi: gen,
            slot_waktu: slotWaktu,
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
            const response = await fetch(
                route("master.generate-jadwal.store"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "text/event-stream",
                        "X-CSRF-TOKEN":
                            document.head.querySelector(
                                'meta[name="csrf-token"]',
                            )?.content || "",
                    },
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
            setIsGenerating(false);
        }
    };

    // Fungsi Render Matriks Jadwal History
    const renderTabelJadwal = () => {
        if (!historyJadwal || historyJadwal.length === 0) return null;

        const groupedByKelas = historyJadwal.reduce((acc, curr) => {
            if (!acc[curr.nama_kelas]) acc[curr.nama_kelas] = [];
            acc[curr.nama_kelas].push(curr);
            return acc;
        }, {});

        const jamUnik = Array.from(
            new Set(
                historyJadwal.map(
                    (item) => `${item.jam_mulai} - ${item.jam_selesai}`,
                ),
            ),
        ).sort();

        return (
            <div className="space-y-12">
                {Object.keys(groupedByKelas)
                    .sort()
                    .map((kelas) => {
                        const dataKelas = groupedByKelas[kelas];

                        return (
                            <div
                                key={kelas}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500"
                            >
                                <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
                                    <h3 className="text-lg font-black text-white tracking-wide">
                                        JADWAL KELAS {kelas}
                                    </h3>
                                    <span className="bg-green-800 text-green-100 text-xs font-bold px-3 py-1 rounded-full">
                                        Tahun Ajaran Aktif
                                    </span>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-green-50 border-b border-green-100 text-green-900">
                                            <tr>
                                                <th className="px-4 py-3 text-center w-32 border-r border-green-100 font-extrabold uppercase text-xs">
                                                    Waktu
                                                </th>
                                                {daftarHari.map((hari) => (
                                                    <th
                                                        key={hari}
                                                        className="px-4 py-3 text-center border-r border-green-100 font-extrabold uppercase text-xs min-w-[200px]"
                                                    >
                                                        {hari}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {jamUnik.map((waktu, rowIndex) => {
                                                const [mulai, selesai] =
                                                    waktu.split(" - ");
                                                const jamTampil = `${mulai.slice(0, 5)} - ${selesai.slice(0, 5)}`;

                                                return (
                                                    <tr
                                                        key={rowIndex}
                                                        className="hover:bg-gray-50/50 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 text-center font-bold text-gray-600 bg-gray-50 border-r border-gray-100 whitespace-nowrap">
                                                            {jamTampil}
                                                        </td>

                                                        {daftarHari.map(
                                                            (hari) => {
                                                                const mapelDitemukan =
                                                                    dataKelas.find(
                                                                        (j) =>
                                                                            j.hari ===
                                                                                hari &&
                                                                            j.jam_mulai ===
                                                                                mulai &&
                                                                            j.jam_selesai ===
                                                                                selesai,
                                                                    );

                                                                return (
                                                                    <td
                                                                        key={`${hari}-${waktu}`}
                                                                        className="px-4 py-3 border-r border-gray-100 relative group"
                                                                    >
                                                                        {mapelDitemukan ? (
                                                                            <div className="flex flex-col h-full bg-white border border-green-100 rounded-lg p-3 shadow-sm group-hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                                                                                <span className="font-bold text-gray-800 leading-tight mb-1">
                                                                                    {
                                                                                        mapelDitemukan.nama_mapel
                                                                                    }
                                                                                </span>
                                                                                <span className="text-xs font-semibold text-green-600 mt-auto flex items-center gap-1.5">
                                                                                    <i className="fa fa-user-circle text-green-400"></i>
                                                                                    {
                                                                                        mapelDitemukan.nama_guru
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-center h-full min-h-[60px]">
                                                                                <span className="text-gray-300 font-medium text-xs uppercase tracking-widest">
                                                                                    -
                                                                                    Kosong
                                                                                    -
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            },
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
            </div>
        );
    };

    return (
        <AuthenticatedLayout header="Generate Jadwal Mengajar (Algoritma Genetika)">
            <Head title="Generate Jadwal" />

            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-gray-200/60 rounded-2xl">
                    <button
                        onClick={() =>
                            !isGenerating && setActiveTab("konfigurasi")
                        }
                        className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === "konfigurasi"
                                ? "bg-white text-green-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/80"
                        } ${isGenerating ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                        <Settings size={18} />
                        <span className="hidden sm:inline">1. Konfigurasi</span>
                    </button>
                    <button
                        className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === "proses"
                                ? "bg-white text-green-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                : "text-gray-500"
                        } cursor-default`}
                    >
                        <Cpu size={18} />
                        <span className="hidden sm:inline">
                            2. Proses Algoritma
                        </span>
                    </button>
                    <button
                        onClick={() =>
                            !isGenerating &&
                            progress === 100 &&
                            setActiveTab("hasil")
                        }
                        className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === "hasil"
                                ? "bg-white text-green-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                : "text-gray-500"
                        } ${progress < 100 ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                        <Calendar size={18} />
                        <span className="hidden sm:inline">
                            3. Hasil Jadwal
                        </span>
                    </button>
                    <button
                        onClick={() => !isGenerating && setActiveTab("history")}
                        className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === "history"
                                ? "bg-white text-green-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/80"
                        } ${isGenerating ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                        <History size={18} />
                        <span className="hidden sm:inline">4. History</span>
                    </button>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-8 min-h-[500px]">
                    {activeTab === "konfigurasi" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* HERO SECTION */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border-2 border-green-100 p-6 sm:p-8 rounded-2xl shadow-sm">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="flex-shrink-0 w-14 h-14 bg-green-600 text-white flex items-center justify-center rounded-2xl shadow-green-200 shadow-lg">
                                            <CalendarDays
                                                size={28}
                                                strokeWidth={2.5}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                                                Tahun Ajaran & Semester
                                            </h3>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Tentukan periode aktif untuk
                                                jadwal yang akan digenerate.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-80">
                                        <select
                                            value={selectedTahunAjaran || ""}
                                            onChange={(e) =>
                                                setSelectedTahunAjaran(
                                                    e.target.value,
                                                )
                                            }
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
                                                -- Klik Untuk Memilih Tahun
                                                Ajaran --
                                            </option>
                                            {tahunAjaranList
                                                .filter(
                                                    (ta) =>
                                                        String(
                                                            ta.value,
                                                        ).toLowerCase() !==
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

                            {selectedTahunAjaran &&
                                historyJadwal.length > 0 && (
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <AlertCircle
                                                size={20}
                                                className="text-amber-600 flex-shrink-0"
                                            />
                                        </div>
                                        <p className="text-sm text-amber-800 font-medium">
                                            <strong className="font-bold">
                                                Perhatian:
                                            </strong>{" "}
                                            Tahun ajaran ini sudah memiliki
                                            jadwal aktif. Menggenerate ulang
                                            akan menimpa jadwal sebelumnya.
                                        </p>
                                    </div>
                                )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* KIRI: Parameter & Waktu */}
                                <div className="space-y-6">
                                    {/* Parameter GA */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-5">
                                            <Sliders
                                                className="text-gray-400"
                                                size={18}
                                            />
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
                                                        defaultValue={pop}
                                                        onChange={(e) =>
                                                            setpop(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full px-4 py-2.5 rounded-xl border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-green-500 bg-gray-50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                                                        Jumlah Generasi
                                                    </label>
                                                    <input
                                                        type="number"
                                                        defaultValue={gen}
                                                        onChange={(e) =>
                                                            setgen(
                                                                e.target.value,
                                                            )
                                                        }
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

                                    {/* KONFIGURASI JAM PELAJARAN */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock
                                                    className="text-gray-400"
                                                    size={18}
                                                />
                                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                                    Waktu Pelajaran
                                                </h4>
                                            </div>
                                            <button
                                                onClick={handleAddSlot}
                                                type="button"
                                                className="text-[11px] text-green-600 font-bold bg-green-50 px-2 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1 transition-colors"
                                            >
                                                <Plus size={14} /> Tambah
                                            </button>
                                        </div>
                                        <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                                            {slotWaktu.map((slot, index) => (
                                                <div
                                                    key={slot.id}
                                                    className="flex items-center gap-2 group"
                                                >
                                                    <span className="text-xs font-black text-gray-300 w-4 text-right">
                                                        {index + 1}.
                                                    </span>
                                                    <input
                                                        type="time"
                                                        value={slot.mulai}
                                                        onChange={(e) =>
                                                            handleSlotChange(
                                                                slot.id,
                                                                "mulai",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="text-xs font-medium px-2.5 py-2 border-gray-300 rounded-lg w-full focus:ring-green-500 focus:border-green-500"
                                                    />
                                                    <span className="text-gray-300">
                                                        -
                                                    </span>
                                                    <input
                                                        type="time"
                                                        value={slot.selesai}
                                                        onChange={(e) =>
                                                            handleSlotChange(
                                                                slot.id,
                                                                "selesai",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="text-xs font-medium px-2.5 py-2 border-gray-300 rounded-lg w-full focus:ring-green-500 focus:border-green-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveSlot(
                                                                slot.id,
                                                            )
                                                        }
                                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        title="Hapus Sesi"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {slotWaktu.length === 0 && (
                                                <p className="text-xs text-center text-gray-400 py-4 font-medium">
                                                    Belum ada sesi waktu diatur.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* KANAN: Prioritas Pagi */}
                                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[650px] lg:h-auto">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-50 rounded-lg">
                                                <Sun
                                                    size={20}
                                                    className="text-amber-500"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                                    Prioritas Pagi
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    Pilih mata pelajaran & kelas
                                                    yang diutamakan pagi hari.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black tracking-wider bg-green-100 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                                            {selectedPrioritas.length} KELAS
                                            DIPILIH
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
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-gray-300 focus:ring-2 focus:ring-green-500 bg-gray-50 font-medium placeholder:text-gray-400"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2 space-y-4 rounded-xl border border-gray-100 custom-scrollbar">
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
                                                    Sistem belum memuat data
                                                    atau pencarian tidak cocok.
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
                                                        {mapelObj.guru.map(
                                                            (guru) => (
                                                                <div
                                                                    key={
                                                                        guru.nip
                                                                    }
                                                                    className="flex flex-col p-3.5 hover:bg-gray-50 transition-colors"
                                                                >
                                                                    {/* Info Guru */}
                                                                    <div className="flex flex-col mb-2.5">
                                                                        <span className="font-bold text-sm text-gray-800">
                                                                            {
                                                                                guru.nama
                                                                            }
                                                                        </span>
                                                                        <span className="text-[11px] font-medium text-gray-400">
                                                                            NIP:{" "}
                                                                            {
                                                                                guru.nip
                                                                            }{" "}
                                                                            •
                                                                            Total:{" "}
                                                                            {
                                                                                guru.total_jam
                                                                            }{" "}
                                                                            Jam
                                                                        </span>
                                                                    </div>

                                                                    {/* Opsi Checklist Kelas */}
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {guru.detail_kelas.map(
                                                                            (
                                                                                kelas,
                                                                            ) => {
                                                                                const keyPrioritas = `${guru.nip}_${kelas.kelas_id}`;
                                                                                const isChecked =
                                                                                    selectedPrioritas.includes(
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
                                                                                                isChecked
                                                                                            }
                                                                                            onChange={() =>
                                                                                                togglePrioritasKelas(
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
                                                            ),
                                                        )}
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
                                        listMapelGuru.length === 0 ||
                                        !selectedTahunAjaran
                                    }
                                    className={`flex items-center gap-2 font-black px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg ${
                                        listMapelGuru.length === 0 ||
                                        !selectedTahunAjaran
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                            : "bg-green-600 hover:bg-green-700 hover:-translate-y-1 hover:shadow-green-200 text-white"
                                    }`}
                                >
                                    <Play size={20} fill="currentColor" />
                                    MULAI PROSES ALGORITMA
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "proses" && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-10 max-w-3xl mx-auto animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-purple-600 relative z-10">
                                    Mesin Algoritma Sedang Bekerja...
                                </h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 w-full">
                                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                                        Progress
                                    </p>
                                    <p className="text-3xl font-black text-green-600">
                                        {progress}%
                                    </p>
                                </div>
                                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                                        Generasi
                                    </p>
                                    <p className="text-3xl font-black text-purple-600">
                                        {generation}
                                    </p>
                                </div>
                                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                                        Fitness
                                    </p>
                                    <p className="text-3xl font-black text-emerald-500">
                                        {fitness}
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-green-500 via-purple-500 to-green-500 h-full rounded-full transition-all duration-300 relative"
                                    style={{
                                        width: `${progress}%`,
                                        backgroundSize: "200% 100%",
                                        animation:
                                            "gradient 2s linear infinite",
                                    }}
                                ></div>
                            </div>
                            <div className="w-full bg-gray-900 rounded-2xl p-5 font-mono text-sm text-emerald-400 shadow-2xl h-40 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-gray-900 to-transparent z-10"></div>
                                <div className="space-y-1.5 relative z-0">
                                    {logs.map((log, i) => (
                                        <p
                                            key={i}
                                            className={`${i === 0 ? "text-white font-bold" : "text-emerald-400/60"}`}
                                        >
                                            <span className="text-gray-500 mr-2">
                                                {">"}
                                            </span>
                                            {log}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "hasil" && (
                        <div className="space-y-6 text-center py-20 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                                <CheckCircle2
                                    className="text-emerald-500"
                                    size={56}
                                    strokeWidth={2.5}
                                />
                            </div>
                            <h3 className="text-3xl font-black text-gray-800 mb-2">
                                Yeay! Jadwal Berhasil Dikunci
                            </h3>
                            <p className="text-gray-500 font-medium max-w-md mx-auto">
                                Algoritma Genetika telah menemukan kombinasi
                                terbaik. Silakan cek tab History untuk melihat
                                detailnya.
                            </p>
                        </div>
                    )}
                    {activeTab === "history" && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="border-b border-gray-100 pb-5">
                                <h3 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                                    <History
                                        className="text-green-600"
                                        size={24}
                                    />{" "}
                                    Riwayat Jadwal Aktif
                                </h3>
                            </div>
                            {!selectedTahunAjaran ? (
                                <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                    <CalendarDays
                                        className="mx-auto text-gray-300 mb-4"
                                        size={48}
                                    />
                                    <p className="text-gray-500 font-semibold">
                                        Silakan pilih Tahun Ajaran di Tab
                                        Konfigurasi terlebih dahulu.
                                    </p>
                                </div>
                            ) : historyJadwal.length === 0 ? (
                                <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                    <p className="text-gray-500 font-semibold">
                                        Belum ada jadwal yang tersimpan untuk
                                        tahun ajaran ini.
                                    </p>
                                </div>
                            ) : (
                                renderTabelJadwal()
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
