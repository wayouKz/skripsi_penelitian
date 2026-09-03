import React, { useState } from "react";
import Select from "react-select";
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
    const [selectedMapelFilter, setSelectedMapelFilter] = useState(null);

    const daftarHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

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

    const handlePilihMapel = (mapelId) => {
        if (selectedMapelFilter === mapelId) {
            setSelectedMapelFilter(null);
        } else {
            setSelectedMapelFilter(mapelId);
        }
    };

    const displayData = listMapelGuru
        .filter((mapel) => mapel.guru && mapel.guru.length > 0)
        .filter((mapel) => {
            return selectedMapelFilter
                ? mapel.id === selectedMapelFilter
                : true;
        })
        .map((mapel) => {
            const mapGuru = new Map();
            mapel.guru.forEach((g) => {
                if (!mapGuru.has(g.guru_id)) {
                    mapGuru.set(g.guru_id, {
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
                    const existing = mapGuru.get(g.guru_id);
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

    const filteredTahunAjaranOptions = [
        // 1. Tambahkan opsi default di indeks pertama (paling atas)
        {
            value: "",
            label: "[Pilih Tahun Ajaran]",
        },
        // 2. Masukkan sisa data yang sudah di-filter
        ...tahunAjaranList.filter(
            (ta) => String(ta.value).toLowerCase() !== "all",
        ),
    ];
    console.log("filteredTahunAjaranOptions", filteredTahunAjaranOptions);
    const selectedTahunAjaranOption =
        filteredTahunAjaranOptions.find(
            (opt) => String(opt.value) === String(selectedTahunAjaran),
        ) || null;
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? "#F3F4F6" : "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E5E7EB",
            borderRadius: "0.5rem",
            padding: "0.05rem 0.1rem",
            minHeight: "32px",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            "&:hover": {
                borderColor: state.isDisabled ? "#E5E7EB" : "#10B981",
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0px 6px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "11px",
            fontWeight: "normal",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "11px",
            fontWeight: "600",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#10B981"
                : state.isFocused
                  ? "#ECFDF5"
                  : "white",
            color: state.isSelected ? "white" : "#1F2937",
            fontSize: "11px",
            fontWeight: "500",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Pemilihan Tahun Ajaran */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border border-green-100 p-4 rounded-xl shadow-sm">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-100 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between relative z-10">
                    <div>
                        <h3 className="text-xs font-bold text-gray-900 mb-0.5">
                            Tahun Ajaran & Semester
                        </h3>
                        <p className="text-[11px] text-gray-500">
                            Tentukan periode aktif untuk jadwal yang akan
                            digenerate.
                        </p>
                    </div>
                    <div className="w-full md:w-72">
                        <Select
                            value={selectedTahunAjaranOption}
                            onChange={(option) => {
                                setSelectedTahunAjaran(
                                    option ? option.value : "",
                                );
                                setSelectedNamaTahunAjaran(
                                    option ? option.label : "",
                                );
                            }}
                            options={filteredTahunAjaranOptions}
                            placeholder="-- Pilih Tahun Ajaran --"
                            isSearchable={true}
                            menuPortalTarget={document.body}
                            className="w-full text-xs"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: "#FFFFFF",
                                    borderColor: !selectedTahunAjaran
                                        ? state.isFocused
                                            ? "#16A34A"
                                            : "#FCD34D"
                                        : state.isFocused
                                          ? "#16A34A"
                                          : "#BBF7D0",
                                    borderRadius: "0.5rem",
                                    padding: "0.05rem 0.1rem",
                                    minHeight: "32px",
                                    boxShadow: state.isFocused
                                        ? "0 0 0 3px rgba(34, 197, 94, 0.15)"
                                        : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                    cursor: "pointer",
                                    "&:hover": {
                                        borderColor: "#16A34A",
                                    },
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: "0px 6px",
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: "#6B7280",
                                    fontSize: "11px",
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: !selectedTahunAjaran
                                        ? "#92400E"
                                        : "#14532D",
                                    fontWeight: "bold",
                                    fontSize: "11px",
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected
                                        ? "#16A34A"
                                        : state.isFocused
                                          ? "#F0FDF4"
                                          : "white",
                                    color: state.isSelected
                                        ? "white"
                                        : "#1F2937",
                                    fontWeight: "600",
                                    fontSize: "11px",
                                    cursor: "pointer",
                                }),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                            }}
                        />
                    </div>
                </div>
            </div>

            {selectedTahunAjaran && historyJadwal?.length > 0 && (
                <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                    <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
                        <AlertCircle size={16} className="text-amber-600" />
                    </div>
                    <p className="text-xs text-amber-800 font-medium">
                        <strong className="font-bold">Perhatian:</strong> Tahun
                        ajaran ini sudah memiliki jadwal aktif. Menggenerate
                        ulang akan menimpa jadwal sebelumnya.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-4">
                    {/* Pengaturan Sesi Waktu */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <SlotWaktu
                            daftarHari={daftarHari}
                            slotsPerHari={slotsPerHari}
                            setSlotsPerHari={setSlotsPerHari}
                        />
                    </div>
                </div>

                {/* Section Prioritas Pagi & Filter Mapel */}
                <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-amber-50 rounded-lg shrink-0">
                                <Sun size={16} className="text-amber-500" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                    Prioritas Pagi
                                </h4>
                                <p className="text-[10px] text-gray-500">
                                    Pilih mata pelajaran & kelas yang diutamakan
                                    pagi hari.
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black tracking-wider bg-green-100 text-green-700 px-2.5 py-1 rounded-lg border border-green-200 shrink-0">
                            {selectedPrioritas?.length || 0} KELAS DIPILIH
                        </span>
                    </div>

                    <div className="relative mb-3 flex-shrink-0">
                        <Search
                            className="absolute left-3 top-2.5 text-gray-400"
                            size={14}
                        />
                        <input
                            type="text"
                            placeholder="Cari Mata Pelajaran, Kelas, atau Guru..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border-gray-300 focus:ring-2 focus:ring-green-500 bg-gray-50 font-medium placeholder:text-gray-400"
                        />

                        {/* Tombol Filter Mapel (Flex Row Layout) */}
                        <div className="w-full flex items-center gap-2 mt-2">
                            <div className="flex-grow">
                                <Select
                                    value={
                                        mapelList
                                            ?.map((m) => ({
                                                value: m.id,
                                                label: m.mapel,
                                            }))
                                            .find(
                                                (opt) =>
                                                    opt.value ===
                                                    selectedMapelFilter,
                                            ) || null
                                    }
                                    onChange={(selectedOption) =>
                                        handlePilihMapel(
                                            selectedOption?.value || "",
                                        )
                                    }
                                    options={
                                        mapelList?.map((m) => ({
                                            value: m.id,
                                            label: m.mapel,
                                        })) || []
                                    }
                                    styles={customSelectStyles}
                                    placeholder="[Pilih Mata Pelajaran]"
                                    isClearable
                                />
                            </div>
                            {selectedMapelFilter && (
                                <button
                                    type="button"
                                    onClick={() => handlePilihMapel("")}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2 space-y-3 rounded-xl border border-gray-100 custom-scrollbar max-h-[320px]">
                        {displayData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                    <Search
                                        className="text-gray-300"
                                        size={20}
                                    />
                                </div>
                                <p className="text-xs font-bold text-gray-500">
                                    Data tidak ditemukan
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    Sistem belum memuat data atau pencarian
                                    tidak cocok.
                                </p>
                            </div>
                        ) : (
                            displayData.map((mapelObj) => (
                                <div
                                    key={mapelObj.id}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-3"
                                >
                                    <div className="flex items-center gap-2 bg-green-50/80 px-3 py-2 border-b border-green-100">
                                        <Library
                                            size={14}
                                            className="text-green-600"
                                        />
                                        <span className="text-[11px] font-black text-green-800 uppercase tracking-wider">
                                            {mapelObj.mapel}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {mapelObj.guru.map((guru) => (
                                            <div
                                                key={guru.nip}
                                                className="flex flex-col p-3 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex flex-col mb-2">
                                                    <span className="font-bold text-xs text-gray-800">
                                                        {guru.nama}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        NIP: {guru.nip} • Total:{" "}
                                                        {guru.total_jam} Jam
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-1.5">
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
                                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] cursor-pointer transition-all ${
                                                                        isChecked
                                                                            ? "bg-green-100 border-green-300 text-green-800 font-bold shadow-sm"
                                                                            : "bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50/30"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
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
                                                                        <span className="opacity-60 text-[10px]">
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
                    <div className="flex justify-end pt-4 border-t border-gray-100 mt-3">
                        <button
                            onClick={handleStartGA}
                            disabled={
                                listMapelGuru.length === 0 ||
                                !selectedTahunAjaran
                            }
                            className={`flex items-center gap-1.5 font-black px-4 py-2 rounded-xl transition-all duration-300 text-xs shadow-sm ${
                                listMapelGuru.length === 0 ||
                                !selectedTahunAjaran
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                    : "bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 hover:shadow-green-200 text-white cursor-pointer"
                            }`}
                        >
                            <Play size={14} fill="currentColor" />
                            MULAI PROSES ALGORITMA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
