import AppSelect from "@/Components/AppSelect";
import ModalPdf from "@/Components/ModalPdf";
import React, { useState, useMemo } from "react";
import Select from "react-select";

// ==========================================
// 1. EXTRAKSI STYLE & KONSTANTA
// ==========================================
const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DAFTAR_JAM = Array.from({ length: 12 }, function (_, i) {
    return i + 1;
});

const FALLBACK_STYLE = {
    bg: "bg-gray-100",
    border: "border-gray-300",
    hover: "hover:bg-gray-200",
};

const FALLBACK_KELAS_COLOR = {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
};

// Palet warna untuk Legend Mapel (mode per kelas) & Legend Guru (mode mapel)
const COLOR_PALETTE = [
    {
        bg: "bg-red-100",
        border: "border-red-400",
        hover: "hover:bg-red-200",
        text: "text-red-900",
    },
    {
        bg: "bg-primary-100",
        border: "border-primary-400",
        hover: "hover:bg-primary-200",
        text: "text-primary-900",
    },
    {
        bg: "bg-primary-100",
        border: "border-primary-400",
        hover: "hover:bg-primary-200",
        text: "text-primary-900",
    },
    {
        bg: "bg-amber-100",
        border: "border-amber-400",
        hover: "hover:bg-amber-200",
        text: "text-amber-900",
    },
    {
        bg: "bg-purple-100",
        border: "border-purple-400",
        hover: "hover:bg-purple-200",
        text: "text-purple-900",
    },
    {
        bg: "bg-pink-100",
        border: "border-pink-400",
        hover: "hover:bg-pink-200",
        text: "text-pink-900",
    },
    {
        bg: "bg-cyan-100",
        border: "border-cyan-400",
        hover: "hover:bg-cyan-200",
        text: "text-cyan-900",
    },
    {
        bg: "bg-orange-100",
        border: "border-orange-400",
        hover: "hover:bg-orange-200",
        text: "text-orange-900",
    },
    {
        bg: "bg-lime-100",
        border: "border-lime-400",
        hover: "hover:bg-lime-200",
        text: "text-lime-900",
    },
    {
        bg: "bg-indigo-100",
        border: "border-indigo-400",
        hover: "hover:bg-indigo-200",
        text: "text-indigo-900",
    },
    {
        bg: "bg-primary-100",
        border: "border-primary-400",
        hover: "hover:bg-primary-200",
        text: "text-primary-900",
    },
    {
        bg: "bg-rose-100",
        border: "border-rose-400",
        hover: "hover:bg-rose-200",
        text: "text-rose-900",
    },
];

const customSelectStyles = {
    control: function (base, state) {
        return {
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
        };
    },
    valueContainer: function (base) {
        return { ...base, padding: "0px 6px" };
    },
    placeholder: function (base) {
        return {
            ...base,
            color: "#9CA3AF",
            fontSize: "11px",
            fontWeight: "normal",
        };
    },
    singleValue: function (base) {
        return {
            ...base,
            color: "#1F2937",
            fontSize: "11px",
            fontWeight: "600",
        };
    },
    option: function (base, state) {
        return {
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
        };
    },
    menuPortal: function (base) {
        return { ...base, zIndex: 9999 };
    },
};

const cutTime = function (t) {
    return t ? t.substring(0, 5) : "";
};

const sortNatural = function (a, b) {
    return a.localeCompare(b, undefined, { numeric: true });
};

// ==========================================
// 2. KOMPONEN UTAMA
// ==========================================
export default function DaftarJadwal({
    historyJadwal,
    selectedTahunAjaran,
    selectedNamaTahunAjaran,
    dataMapel,
    listMapelGuru,
    setActiveTab,
    isLanding = false,
}) {
    // --- States ---
    const [selectedKelas, setSelectedKelas] = useState(null);
    const [selectedMapel, setSelectedMapel] = useState(null);
    const [selectedGuru, setSelectedGuru] = useState(null);
    const [openPdfModal, setOpenPdfModal] = useState(false);

    const isGuruMode = !!selectedGuru && selectedGuru.value !== "all";
    // Mode mapel: mapel dipilih & belum memilih guru tertentu -> 1 tabel gabungan
    const isMapelMode =
        !!selectedMapel && selectedMapel !== "all" && !isGuruMode;

    const groupedByKelas = useMemo(() => {
        if (!historyJadwal) return {};
        return historyJadwal.reduce(function (acc, curr) {
            if (curr && curr.nama_kelas) {
                if (!acc[curr.nama_kelas]) acc[curr.nama_kelas] = [];
                acc[curr.nama_kelas].push(curr);
            }
            return acc;
        }, {});
    }, [historyJadwal]);

    // Warna unik per kelas (HSL + golden angle, kelas berdekatan tetap beda jauh)
    const kelasColorMap = useMemo(() => {
        const map = {};
        Object.keys(groupedByKelas)
            .sort(sortNatural)
            .forEach(function (kelas, index) {
                const hue = Math.round((index * 137.508) % 360);
                map[kelas] = {
                    backgroundColor: "hsl(" + hue + ", 85%, 90%)",
                    borderColor: "hsl(" + hue + ", 60%, 55%)",
                };
            });
        return map;
    }, [groupedByKelas]);

    // Daftar mapel unik untuk legend warna
    const mapelList = useMemo(() => {
        if (!historyJadwal) return [];
        const uniqueMapel = [];
        historyJadwal.forEach(function (item) {
            if (
                item &&
                item.nama_mapel &&
                uniqueMapel.indexOf(item.nama_mapel) === -1
            ) {
                uniqueMapel.push(item.nama_mapel);
            }
        });
        return uniqueMapel;
    }, [historyJadwal]);

    // Warna konsisten untuk tiap mapel
    const mapelColorMap = useMemo(() => {
        const map = {};
        mapelList.forEach(function (mapel, index) {
            map[mapel] = COLOR_PALETTE[index % COLOR_PALETTE.length];
        });
        return map;
    }, [mapelList]);

    // Seluruh jam_mulai unik, diurutkan, jadi referensi slot jam ke-1..n
    const globalTimeSlots = useMemo(() => {
        if (!historyJadwal) return [];
        const timeSet = new Set();
        historyJadwal.forEach(function (item) {
            if (item && item.jam_mulai) {
                timeSet.add(cutTime(item.jam_mulai));
            }
        });
        return Array.from(timeSet).sort();
    }, [historyJadwal]);

    const dataGuruOptions = useMemo(() => {
        const guruMap = new Map();

        if (listMapelGuru && Array.isArray(listMapelGuru)) {
            listMapelGuru.forEach(function (mapel) {
                if (
                    selectedMapel &&
                    selectedMapel !== "all" &&
                    String(mapel.id) !== String(selectedMapel)
                ) {
                    return;
                }

                if (mapel.guru && Array.isArray(mapel.guru)) {
                    mapel.guru.forEach(function (guru) {
                        const id = String(guru.guru_id || guru.id);
                        const nama = guru.nama || guru.nama_guru;
                        if (id && nama && !guruMap.has(id)) {
                            guruMap.set(id, { value: id, label: nama });
                        }
                    });
                }
            });
        }

        return [
            { value: "all", label: "Semua Guru" },
            ...Array.from(guruMap.values()),
        ];
    }, [listMapelGuru, selectedMapel]);

    console.log(dataGuruOptions);
    const filteredKelasList = useMemo(() => {
        const baseList = [
            { value: "", label: "Semua Kelas" },
            ...Object.keys(groupedByKelas)
                .sort(sortNatural)
                .map(function (kelas) {
                    return { value: kelas, label: kelas };
                }),
        ];

        return selectedKelas
            ? baseList.filter(function (item) {
                  return item.value === selectedKelas;
              })
            : baseList.filter(function (item) {
                  return item.value !== "";
              });
    }, [groupedByKelas, selectedKelas]);

    // Matriks jadwal untuk 1 guru: hari -> jam_mulai -> [item, ...]
    const guruScheduleMap = useMemo(() => {
        if (!isGuruMode || !historyJadwal) return null;

        const map = {};
        DAFTAR_HARI.forEach(function (h) {
            map[h] = {};
        });

        historyJadwal.forEach(function (item) {
            if (!item || !item.hari || !item.jam_mulai) return;
            if (String(item.nama_guru) !== String(selectedGuru.label)) return;
            if (
                selectedMapel &&
                selectedMapel !== "all" &&
                String(item.mapel_id) !== String(selectedMapel)
            )
                return;
            if (selectedKelas && item.nama_kelas !== selectedKelas) return;
            if (!map[item.hari]) return;

            const key = cutTime(item.jam_mulai);
            if (!map[item.hari][key]) map[item.hari][key] = [];
            map[item.hari][key].push(item);
        });

        return map;
    }, [isGuruMode, historyJadwal, selectedGuru, selectedMapel, selectedKelas]);

    const totalJamGuru = useMemo(() => {
        if (!guruScheduleMap) return 0;
        let total = 0;
        Object.keys(guruScheduleMap).forEach(function (hari) {
            Object.keys(guruScheduleMap[hari]).forEach(function (slot) {
                total += guruScheduleMap[hari][slot].length;
            });
        });
        return total;
    }, [guruScheduleMap]);

    // Daftar kelas yang diajar guru terpilih (untuk legend)
    const kelasGuruList = useMemo(() => {
        if (!guruScheduleMap) return [];
        const set = new Set();
        Object.keys(guruScheduleMap).forEach(function (hari) {
            Object.keys(guruScheduleMap[hari]).forEach(function (slot) {
                guruScheduleMap[hari][slot].forEach(function (item) {
                    set.add(item.nama_kelas);
                });
            });
        });
        return Array.from(set).sort(sortNatural);
    }, [guruScheduleMap]);

    // ---------- MODE MAPEL (1 tabel gabungan semua kelas) ----------
    // Matriks: hari -> jam_mulai -> [item, ...] (semua kelas yang punya mapel ini)
    const mapelScheduleMap = useMemo(() => {
        if (!isMapelMode || !historyJadwal) return null;

        const map = {};
        DAFTAR_HARI.forEach(function (h) {
            map[h] = {};
        });

        historyJadwal.forEach(function (item) {
            if (!item || !item.hari || !item.jam_mulai) return;
            if (String(item.mapel_id) !== String(selectedMapel)) return;
            if (selectedKelas && item.nama_kelas !== selectedKelas) return;
            if (!map[item.hari]) return;

            const key = cutTime(item.jam_mulai);
            if (!map[item.hari][key]) map[item.hari][key] = [];
            map[item.hari][key].push(item);
        });

        // Urutkan kelas di dalam tiap slot supaya rapi
        Object.keys(map).forEach(function (hari) {
            Object.keys(map[hari]).forEach(function (slot) {
                map[hari][slot].sort(function (a, b) {
                    return sortNatural(a.nama_kelas, b.nama_kelas);
                });
            });
        });

        return map;
    }, [isMapelMode, historyJadwal, selectedMapel, selectedKelas]);

    const totalJamMapel = useMemo(() => {
        if (!mapelScheduleMap) return 0;
        let total = 0;
        Object.keys(mapelScheduleMap).forEach(function (hari) {
            Object.keys(mapelScheduleMap[hari]).forEach(function (slot) {
                total += mapelScheduleMap[hari][slot].length;
            });
        });
        return total;
    }, [mapelScheduleMap]);

    // Guru unik pada mapel terpilih (untuk warna & legend)
    const guruMapelList = useMemo(() => {
        if (!mapelScheduleMap) return [];
        const set = new Set();
        Object.keys(mapelScheduleMap).forEach(function (hari) {
            Object.keys(mapelScheduleMap[hari]).forEach(function (slot) {
                mapelScheduleMap[hari][slot].forEach(function (item) {
                    if (item.nama_guru) set.add(item.nama_guru);
                });
            });
        });
        return Array.from(set).sort(sortNatural);
    }, [mapelScheduleMap]);

    const guruColorMap = useMemo(() => {
        const map = {};
        guruMapelList.forEach(function (guru, index) {
            map[guru] = COLOR_PALETTE[index % COLOR_PALETTE.length];
        });
        return map;
    }, [guruMapelList]);

    const namaMapelTerpilih = useMemo(() => {
        if (!isMapelMode) return "";
        const found = (dataMapel || []).find(function (opt) {
            return String(opt.value) === String(selectedMapel);
        });
        return found ? found.label : "";
    }, [isMapelMode, dataMapel, selectedMapel]);

    // --- Handler Functions ---
    const handleMapelChange = function (option) {
        const newMapel =
            option && option.value !== "" && option.value !== "all"
                ? option.value
                : null;
        setSelectedMapel(newMapel);
        setSelectedGuru(null);
    };

    const handleGuruChange = function (option) {
        setSelectedGuru(
            option && option.value !== ""
                ? { value: option.value, label: option.label }
                : null,
        );
    };

    // --- Konfigurasi PDF ---
    const tahunAjaranId =
        historyJadwal && historyJadwal[0]
            ? historyJadwal[0].tahun_ajaran_id
            : null;
    const pdfUrl = route("pdf.jadwal", {
        tahun_ajaran_id: tahunAjaranId || "all",
        kelas_id: selectedKelas || "all",
        mapel_id: selectedMapel || "all",
        guru_id: selectedGuru ? selectedGuru.value : "all",
    });

    const titlePdf = isGuruMode
        ? "Jadwal Guru - " +
          (selectedNamaTahunAjaran || "") +
          " - " +
          selectedGuru.label
        : isMapelMode
          ? "Jadwal Mapel " +
            namaMapelTerpilih +
            " - " +
            (selectedNamaTahunAjaran || "")
          : "Jadwal Pelajaran - " +
            (selectedNamaTahunAjaran || "") +
            (selectedKelas ? " - Kelas " + selectedKelas : " - Semua Kelas");

    if (!historyJadwal || historyJadwal.length === 0) return null;

    // --- Header tabel (dipakai semua mode) ---
    const renderTableHead = function () {
        return (
            <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                    <th className="py-2.5 px-3 text-left w-28 border-r border-gray-200">
                        Hari / Jam
                    </th>
                    {DAFTAR_JAM.map(function (jamKe) {
                        const slotTime = globalTimeSlots[jamKe - 1] || "";
                        return (
                            <th
                                key={jamKe}
                                className="py-2.5 px-1 border-r border-gray-200 font-mono text-[11px]"
                            >
                                <div>Jam {jamKe}</div>
                                {slotTime && (
                                    <div className="text-[9px] font-normal text-gray-500">
                                        {slotTime}
                                    </div>
                                )}
                            </th>
                        );
                    })}
                </tr>
            </thead>
        );
    };

    const renderEmptyCell = function (jamKe) {
        return (
            <td
                key={jamKe}
                className="py-3 px-2 border-r border-gray-200 text-gray-300 font-mono text-[11px]"
            >
                -
            </td>
        );
    };

    // --- Render: MODE MAPEL (1 tabel, blok = kelas + guru berurutan, warna per guru) ---
    const renderMapelMatrix = function () {
        const totalSlot = DAFTAR_JAM.length;

        // Bentuk blok (run) per hari: slot berurutan dengan kelas + guru sama jadi 1 blok,
        // lalu blok yang bertabrakan waktu ditaruh di baris (lane) terpisah.
        const buildLanes = function (hariMap) {
            const runs = [];
            let active = {};

            for (let jamKe = 1; jamKe <= totalSlot; jamKe++) {
                const slotTime = globalTimeSlots[jamKe - 1];
                const items = slotTime ? hariMap[slotTime] || [] : [];
                const nextActive = {};

                items.forEach(function (item) {
                    const key = item.nama_kelas + "|" + item.nama_guru;
                    if (nextActive[key]) return;

                    const prev = active[key];
                    if (prev) {
                        prev.end = jamKe;
                        prev.jam_selesai = item.jam_selesai;
                        nextActive[key] = prev;
                    } else {
                        const run = {
                            item: item,
                            start: jamKe,
                            end: jamKe,
                            jam_selesai: item.jam_selesai,
                        };
                        runs.push(run);
                        nextActive[key] = run;
                    }
                });

                active = nextActive;
            }

            runs.sort(function (a, b) {
                return (
                    a.start - b.start ||
                    sortNatural(a.item.nama_kelas, b.item.nama_kelas)
                );
            });

            const lanes = [];
            runs.forEach(function (run) {
                let lane = lanes.find(function (l) {
                    return l.lastEnd < run.start;
                });
                if (!lane) {
                    lane = { lastEnd: 0, runs: [] };
                    lanes.push(lane);
                }
                lane.runs.push(run);
                lane.lastEnd = run.end;
            });

            return lanes;
        };

        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
                <div className="bg-primary-600 px-4 py-2.5 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-white tracking-wide uppercase">
                        Jadwal Mapel {namaMapelTerpilih}
                        {selectedKelas ? " - Kelas " + selectedKelas : ""}
                    </h3>
                    <span className="text-[11px] font-bold text-white bg-primary-700 px-2 py-0.5 rounded shrink-0">
                        Total {totalJamMapel} Jam
                    </span>
                </div>

                <div className="p-2 w-full overflow-x-auto bg-gray-50/30">
                    <div className="min-w-[950px] bg-white rounded-xl border border-gray-200 shadow-xs">
                        <table className="w-full border-collapse text-xs text-center">
                            {renderTableHead()}
                            <tbody>
                                {DAFTAR_HARI.map(function (hari) {
                                    const hariMap =
                                        mapelScheduleMap[hari] || {};
                                    const lanes = buildLanes(hariMap);
                                    const laneCount = Math.max(lanes.length, 1);
                                    const rows = [];

                                    for (let li = 0; li < laneCount; li++) {
                                        const lane = lanes[li];
                                        const cells = [];
                                        let jamKe = 1;

                                        while (jamKe <= totalSlot) {
                                            const run = lane
                                                ? lane.runs.find(function (r) {
                                                      return r.start === jamKe;
                                                  })
                                                : null;

                                            if (!run) {
                                                cells.push(
                                                    renderEmptyCell(jamKe),
                                                );
                                                jamKe++;
                                                continue;
                                            }

                                            const span =
                                                run.end - run.start + 1;
                                            const item = run.item;
                                            const style =
                                                guruColorMap[item.nama_guru] ||
                                                FALLBACK_STYLE;

                                            cells.push(
                                                <td
                                                    key={jamKe}
                                                    colSpan={span}
                                                    className="p-1.5 border-r border-gray-200 align-middle"
                                                >
                                                    <div
                                                        className={
                                                            "rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-2xs transition-all border " +
                                                            style.bg +
                                                            " " +
                                                            style.border +
                                                            " " +
                                                            style.hover
                                                        }
                                                    >
                                                        <span className="text-[9px] font-bold text-gray-600 mb-0.5">
                                                            {cutTime(
                                                                item.jam_mulai,
                                                            )}{" "}
                                                            -{" "}
                                                            {cutTime(
                                                                run.jam_selesai,
                                                            )}
                                                        </span>
                                                        <span className="font-black text-gray-900 text-xs mb-0.5">
                                                            {item.nama_kelas}
                                                            {span > 1 && (
                                                                <span className="ml-1 text-[9px] font-bold text-gray-700 bg-white/70 px-1.5 py-0.5 rounded">
                                                                    {span} jam
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-semibold text-gray-700 truncate max-w-full"
                                                            title={
                                                                item.nama_guru
                                                            }
                                                        >
                                                            {item.nama_guru}
                                                        </span>
                                                    </div>
                                                </td>,
                                            );

                                            jamKe += span;
                                        }

                                        rows.push(
                                            <tr
                                                key={hari + "-" + li}
                                                className={
                                                    li === laneCount - 1
                                                        ? "border-b border-gray-200"
                                                        : ""
                                                }
                                            >
                                                {li === 0 && (
                                                    <td
                                                        rowSpan={laneCount}
                                                        className="py-3 px-3 font-bold text-primary-700 text-left border-r border-gray-200 bg-gray-50 align-middle"
                                                    >
                                                        {hari}
                                                    </td>
                                                )}
                                                {cells}
                                            </tr>,
                                        );
                                    }

                                    return rows;
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // --- Render: MODE GURU (blok kelas berurutan digabung, warna per kelas) ---
    const renderGuruMatrix = function () {
        const totalSlot = DAFTAR_JAM.length;

        // Kunci pembanding blok: hanya sel dengan 1 item (tanpa bentrok) yang boleh digabung
        const blockKey = function (items) {
            if (!items || items.length !== 1) return null;
            return items[0].nama_kelas + "|" + items[0].nama_mapel;
        };

        const getItems = function (hariMap, jamKe) {
            const slotTime = globalTimeSlots[jamKe - 1];
            return slotTime ? hariMap[slotTime] || null : null;
        };

        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
                <div className="bg-primary-600 px-4 py-2.5 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-white tracking-wide uppercase">
                        Jadwal Guru {selectedGuru.label}
                    </h3>
                    <span className="text-[11px] font-bold text-white bg-primary-700 px-2 py-0.5 rounded shrink-0">
                        Total {totalJamGuru} Jam
                    </span>
                </div>

                <div className="p-2 w-full overflow-x-auto bg-gray-50/30">
                    <div className="min-w-[950px] bg-white rounded-xl border border-gray-200 shadow-xs">
                        <table className="w-full border-collapse text-xs text-center">
                            {renderTableHead()}
                            <tbody className="divide-y divide-gray-200">
                                {DAFTAR_HARI.map(function (hari) {
                                    const hariMap = guruScheduleMap[hari] || {};
                                    const cells = [];
                                    let jamKe = 1;

                                    while (jamKe <= totalSlot) {
                                        const items = getItems(hariMap, jamKe);

                                        // Sel kosong
                                        if (!items || items.length === 0) {
                                            cells.push(renderEmptyCell(jamKe));
                                            jamKe++;
                                            continue;
                                        }

                                        // Hitung berapa slot berurutan yang bisa digabung
                                        let span = 1;
                                        const key = blockKey(items);
                                        if (key) {
                                            while (
                                                jamKe + span <= totalSlot &&
                                                blockKey(
                                                    getItems(
                                                        hariMap,
                                                        jamKe + span,
                                                    ),
                                                ) === key
                                            ) {
                                                span++;
                                            }
                                        }

                                        // Jam selesai diambil dari slot terakhir dalam blok
                                        const lastItems = getItems(
                                            hariMap,
                                            jamKe + span - 1,
                                        );
                                        const jamSelesai = lastItems
                                            ? lastItems[lastItems.length - 1]
                                                  .jam_selesai
                                            : null;

                                        cells.push(
                                            <td
                                                key={jamKe}
                                                colSpan={span}
                                                className="p-1.5 border-r border-gray-200 align-middle"
                                            >
                                                {items.map(
                                                    function (item, idx) {
                                                        const kelasStyle =
                                                            kelasColorMap[
                                                                item.nama_kelas
                                                            ] ||
                                                            FALLBACK_KELAS_COLOR;
                                                        const endTime =
                                                            span > 1
                                                                ? jamSelesai
                                                                : item.jam_selesai;

                                                        return (
                                                            <div
                                                                key={idx}
                                                                style={{
                                                                    backgroundColor:
                                                                        kelasStyle.backgroundColor,
                                                                    borderColor:
                                                                        kelasStyle.borderColor,
                                                                }}
                                                                className={
                                                                    "rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-2xs transition-all border hover:brightness-95 " +
                                                                    (idx > 0
                                                                        ? "mt-1"
                                                                        : "")
                                                                }
                                                            >
                                                                <span className="text-[9px] font-bold text-gray-600 mb-0.5">
                                                                    {cutTime(
                                                                        item.jam_mulai,
                                                                    )}{" "}
                                                                    -{" "}
                                                                    {cutTime(
                                                                        endTime,
                                                                    )}
                                                                </span>
                                                                <span className="font-black text-gray-900 text-xs mb-0.5">
                                                                    {
                                                                        item.nama_kelas
                                                                    }
                                                                    {span >
                                                                        1 && (
                                                                        <span className="ml-1 text-[9px] font-bold text-gray-700 bg-white/70 px-1.5 py-0.5 rounded">
                                                                            {
                                                                                span
                                                                            }{" "}
                                                                            jam
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className="text-[10px] font-semibold text-gray-700">
                                                                    {
                                                                        item.nama_mapel
                                                                    }
                                                                </span>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </td>,
                                        );

                                        jamKe += span;
                                    }

                                    return (
                                        <tr
                                            key={hari}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="py-3 px-3 font-bold text-primary-700 text-left border-r border-gray-200 bg-gray-50">
                                                {hari}
                                            </td>
                                            {cells}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // --- Render: MODE KELAS (satu matriks per kelas, warna per mapel) ---
    const renderKelasMatrices = function () {
        return filteredKelasList.map(function (itemKelas) {
            const namaKelas = itemKelas.value;
            if (!namaKelas) return null;

            const dataKelas = groupedByKelas[namaKelas] || [];

            const scheduleMap = {};
            DAFTAR_HARI.forEach(function (h) {
                scheduleMap[h] = {};
            });

            dataKelas.forEach(function (item) {
                if (item && item.hari && item.jam_mulai) {
                    const timeKey = cutTime(item.jam_mulai);
                    if (scheduleMap[item.hari]) {
                        scheduleMap[item.hari][timeKey] = item;
                    }
                }
            });

            return (
                <div
                    key={namaKelas}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full"
                >
                    <div className="bg-primary-600 px-4 py-2.5">
                        <h3 className="text-sm font-black text-white tracking-wide uppercase">
                            Jadwal Kelas {namaKelas}
                        </h3>
                    </div>

                    <div className="p-2 w-full overflow-x-auto bg-gray-50/30">
                        <div className="min-w-[950px] bg-white rounded-xl border border-gray-200 shadow-xs">
                            <table className="w-full border-collapse text-xs text-center">
                                {renderTableHead()}
                                <tbody className="divide-y divide-gray-200">
                                    {DAFTAR_HARI.map(function (hari) {
                                        const hariMap = scheduleMap[hari] || {};

                                        return (
                                            <tr
                                                key={hari}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="py-3 px-3 font-bold text-primary-700 text-left border-r border-gray-200 bg-gray-50">
                                                    {hari}
                                                </td>
                                                {DAFTAR_JAM.map(
                                                    function (jamKe) {
                                                        const slotTime =
                                                            globalTimeSlots[
                                                                jamKe - 1
                                                            ];
                                                        const item = slotTime
                                                            ? hariMap[slotTime]
                                                            : null;

                                                        if (!item) {
                                                            return renderEmptyCell(
                                                                jamKe,
                                                            );
                                                        }

                                                        const mapelStyle =
                                                            mapelColorMap[
                                                                item.nama_mapel
                                                            ] || FALLBACK_STYLE;

                                                        return (
                                                            <td
                                                                key={jamKe}
                                                                className="p-1.5 border-r border-gray-200 align-middle"
                                                            >
                                                                <div
                                                                    className={
                                                                        "rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-2xs transition-all border " +
                                                                        mapelStyle.bg +
                                                                        " " +
                                                                        mapelStyle.border +
                                                                        " " +
                                                                        mapelStyle.hover
                                                                    }
                                                                >
                                                                    <span className="text-[9px] font-bold text-gray-500 mb-0.5">
                                                                        {cutTime(
                                                                            item.jam_mulai,
                                                                        )}{" "}
                                                                        -{" "}
                                                                        {cutTime(
                                                                            item.jam_selesai,
                                                                        )}
                                                                    </span>
                                                                    <span className="font-bold text-gray-900 text-xs mb-0.5">
                                                                        {
                                                                            item.nama_mapel
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        className="text-[10px] font-semibold text-gray-600 truncate max-w-[110px]"
                                                                        title={
                                                                            item.nama_guru
                                                                        }
                                                                    >
                                                                        {
                                                                            item.nama_guru
                                                                        }
                                                                    </span>
                                                                </div>
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
                </div>
            );
        });
    };

    // --- Render: LEGEND ---
    const renderLegend = function () {
        // Mode guru: legend kelas
        if (isGuruMode) {
            if (kelasGuruList.length === 0) return null;
            return (
                <div className="flex items-center gap-2 overflow-x-auto py-2.5 mt-2 bg-white px-3 rounded-xl border border-gray-200 w-full">
                    <span className="text-[11px] font-bold text-gray-500 shrink-0">
                        Legend Kelas:
                    </span>
                    {kelasGuruList.map(function (kelas) {
                        const c = kelasColorMap[kelas] || FALLBACK_KELAS_COLOR;
                        return (
                            <div
                                key={kelas}
                                className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200"
                            >
                                <span
                                    className="w-3 h-3 rounded-md border inline-block"
                                    style={{
                                        backgroundColor: c.backgroundColor,
                                        borderColor: c.borderColor,
                                    }}
                                ></span>
                                <span className="text-gray-800 text-[11px] font-semibold">
                                    {kelas}
                                </span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Mode mapel: legend guru
        if (isMapelMode) {
            if (guruMapelList.length === 0) return null;
            return (
                <div className="flex items-center gap-2 overflow-x-auto py-2.5 mt-2 bg-white px-3 rounded-xl border border-gray-200 w-full">
                    <span className="text-[11px] font-bold text-gray-500 shrink-0">
                        Legend Guru:
                    </span>
                    {guruMapelList.map(function (guru) {
                        const style = guruColorMap[guru] || FALLBACK_STYLE;
                        return (
                            <div
                                key={guru}
                                className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200"
                            >
                                <span
                                    className={
                                        "w-3 h-3 rounded-md border inline-block " +
                                        style.bg +
                                        " " +
                                        style.border
                                    }
                                ></span>
                                <span className="text-gray-800 text-[11px] font-semibold">
                                    {guru}
                                </span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Mode kelas: legend mapel
        if (mapelList.length === 0) return null;
        return (
            <div className="flex items-center gap-2 overflow-x-auto py-2.5 mt-2 bg-white px-3 rounded-xl border border-gray-200 w-full">
                <span className="text-[11px] font-bold text-gray-500 shrink-0">
                    Legend Mapel:
                </span>
                {mapelList.map(function (mapel) {
                    const style = mapelColorMap[mapel] || {
                        bg: "bg-white",
                        border: "border-gray-200",
                    };
                    return (
                        <div
                            key={mapel}
                            className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200"
                        >
                            <span
                                className={
                                    "w-3 h-3 rounded-md " +
                                    style.bg +
                                    " border " +
                                    style.border +
                                    " inline-block"
                                }
                            ></span>
                            <span className="text-gray-800 text-[11px] font-semibold">
                                {mapel}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- Pilih konten utama sesuai mode ---
    const renderMainContent = function () {
        if (isGuruMode) return renderGuruMatrix();
        if (isMapelMode) return renderMapelMatrix();
        return renderKelasMatrices();
    };

    // --- Render Component ---
    return (
        <div className="w-full max-w-full overflow-x-hidden">
            {/* 1. BAGIAN FILTER & CETAK */}
            <div className="w-full pb-3">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="flex gap-2 flex-wrap flex-1 min-w-[280px]">
                        <div className="min-w-[180px] flex-1">
                            <AppSelect
                                options={filteredKelasList}
                                value={
                                    filteredKelasList.find(function (opt) {
                                        return (
                                            opt.value === (selectedKelas || "")
                                        );
                                    }) || null
                                }
                                onChange={function (opt) {
                                    setSelectedKelas(
                                        opt && opt.value !== ""
                                            ? opt.value
                                            : null,
                                    );
                                }}
                                isSearchable
                                isClearable
                                placeholder="Pilih Kelas..."
                            />
                        </div>

                        <div className="min-w-[180px] flex-1">
                            <AppSelect
                                options={dataMapel || []}
                                value={
                                    dataMapel
                                        ? dataMapel.find(function (opt) {
                                              return (
                                                  opt.value ===
                                                  (selectedMapel || "")
                                              );
                                          }) || null
                                        : null
                                }
                                onChange={handleMapelChange}
                                isSearchable
                                isClearable
                                placeholder="Pilih Mapel..."
                            />
                        </div>

                        <div className="min-w-[180px] flex-1">
                            <AppSelect
                                options={dataGuruOptions}
                                value={
                                    dataGuruOptions.find(function (opt) {
                                        return (
                                            opt.value ===
                                            (selectedGuru
                                                ? selectedGuru.value
                                                : "")
                                        );
                                    }) || null
                                }
                                onChange={handleGuruChange}
                                isSearchable
                                isClearable
                                placeholder="Pilih Guru..."
                            />
                        </div>
                    </div>
                    {!isLanding && (
                        <button
                            type="button"
                            className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors cursor-pointer shrink-0"
                            onClick={function () {
                                setOpenPdfModal(true);
                            }}
                        >
                            <span className="mr-1 text-xs">Cetak PDF</span>
                            <i className="fa fa-print"></i>
                        </button>
                    )}
                </div>

                {/* LEGEND: kelas (mode guru), guru (mode mapel), mapel (mode kelas) */}
                {renderLegend()}
            </div>

            {/* 2. BAGIAN TABEL MATRIKS JADWAL */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 w-full max-w-full overflow-hidden">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto w-full">
                    {renderMainContent()}
                </div>
            </div>

            {/* MODAL PDF */}
            <ModalPdf
                isOpen={openPdfModal}
                onClose={function () {
                    setOpenPdfModal(false);
                }}
                pdfUrl={pdfUrl}
                title={titlePdf}
            />
        </div>
    );
}
