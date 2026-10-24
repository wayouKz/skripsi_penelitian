// ======================================================================
// Komponen Sub (Memoized) agar update log tidak me-render ulang matriks

import React, { useEffect, useMemo, useState, useRef } from "react";
import Modal from "@/Components/Modal";
// ======================================================================
const LiveLogViewer = React.memo(({ logs = [] }) => {
    const logEndRef = useRef(null);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [logs]);

    const visibleLogs = logs.slice(-100);

    return (
        <div className="px-6 py-3 bg-primary-50 border-b border-gray-200 shrink-0">
            <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="animate-pulse h-1.5 w-1.5 bg-red-500 rounded-full inline-block"></span>
                    Live Activity Log
                </h3>
                <span className="text-[10px] font-mono bg-primary-100 text-primary-700 px-2 py-0.5 rounded border border-primary-200 font-bold">
                    {logs.length} Events Terpantau
                </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-2 h-32 overflow-y-auto text-[10px] font-mono shadow-inner">
                {visibleLogs?.length === 0 ? (
                    <div className="text-gray-400 italic text-center py-4">
                        Menunggu log mutasi & relokasi mapel...
                    </div>
                ) : (
                    visibleLogs?.map((log, idx) => {
                        let badgeClass =
                            "bg-gray-100 text-gray-600 border-gray-200";
                        if (log.tahap === "TUKAR_MAPEL")
                            badgeClass =
                                "bg-primary-50 text-primary-600 border-primary-200";
                        else if (log.tahap === "RELOKASI_MAPEL")
                            badgeClass =
                                "bg-orange-50 text-orange-600 border-orange-200";
                        else if (log.tahap === "STAGNASI")
                            badgeClass =
                                "bg-red-50 text-red-600 border-red-200";
                        else if (log.tahap === "NEW_BEST")
                            badgeClass =
                                "bg-primary-50 text-primary-600 border-primary-200";

                        const timeOnly = log.waktu
                            ? log.waktu.includes(" ")
                                ? log.waktu.split(" ")[1]
                                : log.waktu
                            : "";

                        return (
                            <div
                                key={idx}
                                className="border-b border-gray-100 pb-1.5 mb-1.5 last:border-0 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-1.5">
                                    <span className="text-gray-400 shrink-0">
                                        [{timeOnly}]
                                    </span>
                                    <span
                                        className={`px-1 rounded border font-bold shrink-0 ${badgeClass}`}
                                    >
                                        {log.tahap}
                                    </span>
                                    <span className="text-gray-700 font-sans leading-tight">
                                        {log.pesan}
                                    </span>
                                </div>

                                {log.data &&
                                    Object.keys(log.data).length > 0 && (
                                        <div className="mt-1 pl-2 border-l-2 border-gray-200 text-gray-500 ml-1">
                                            {Object.entries(log.data).map(
                                                ([k, v]) => {
                                                    // 1. Jika data berupa Array
                                                    if (Array.isArray(v)) {
                                                        return (
                                                            <div
                                                                key={k}
                                                                className="mt-1"
                                                            >
                                                                <span className="text-gray-400 capitalize font-semibold block">
                                                                    {k.replace(
                                                                        "_",
                                                                        " ",
                                                                    )}
                                                                    :
                                                                </span>
                                                                <ul className="list-disc list-inside pl-1 space-y-0.5">
                                                                    {v.map(
                                                                        (
                                                                            item,
                                                                            i,
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    i
                                                                                }
                                                                                className="text-gray-600"
                                                                            >
                                                                                {typeof item ===
                                                                                    "object" &&
                                                                                item !==
                                                                                    null ? (
                                                                                    item.pesan ? (
                                                                                        <span>
                                                                                            {
                                                                                                item.pesan
                                                                                            }
                                                                                        </span>
                                                                                    ) : item.status ? (
                                                                                        <span>
                                                                                            {
                                                                                                item.status
                                                                                            }
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span>
                                                                                            {JSON.stringify(
                                                                                                item,
                                                                                            )}
                                                                                        </span>
                                                                                    )
                                                                                ) : (
                                                                                    String(
                                                                                        item,
                                                                                    )
                                                                                )}
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        );
                                                    }

                                                    // 2. Jika data berupa Objek (mencegah error React child object)
                                                    if (
                                                        v !== null &&
                                                        typeof v === "object"
                                                    ) {
                                                        return (
                                                            <div
                                                                key={k}
                                                                className="mt-1"
                                                            >
                                                                <span className="text-gray-400 capitalize font-semibold">
                                                                    {k.replace(
                                                                        "_",
                                                                        " ",
                                                                    )}
                                                                    :
                                                                </span>
                                                                <div className="pl-2 text-gray-600">
                                                                    {Object.entries(
                                                                        v,
                                                                    ).map(
                                                                        ([
                                                                            subK,
                                                                            subV,
                                                                        ]) => (
                                                                            <div
                                                                                key={
                                                                                    subK
                                                                                }
                                                                            >
                                                                                <span className="font-semibold">
                                                                                    {
                                                                                        subK
                                                                                    }

                                                                                    :
                                                                                </span>{" "}
                                                                                {String(
                                                                                    subV,
                                                                                )}
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // 3. Jika data berupa nilai biasa (string / number)
                                                    return (
                                                        <span
                                                            key={k}
                                                            className="mr-3 inline-block"
                                                        >
                                                            <span className="text-gray-400 capitalize">
                                                                {k.replace(
                                                                    "_",
                                                                    " ",
                                                                )}
                                                                :
                                                            </span>{" "}
                                                            <span className="text-gray-600 font-semibold">
                                                                {String(v)}
                                                            </span>
                                                        </span>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                            </div>
                        );
                    })
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
});

// ======================================================================
// Komponen Utama
// ======================================================================
export default function ProsesViewJadwal({
    newKromosom,
    openView,
    setOpenView,
    progress,
    setActiveTab,
    liveLogs = [], // <--- Tambahkan props liveLogs disini
}) {
    console.log(newKromosom);
    const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    const slotWaktuArrayData = {
        Senin: [
            { id: 1, mulai: "07:00", selesai: "07:35" },
            { id: 2, mulai: "07:35", selesai: "08:10" },
            { id: 3, mulai: "08:10", selesai: "08:45" },
            { id: 4, mulai: "08:45", selesai: "09:20" },
            { id: 5, mulai: "09:20", selesai: "09:55" },
            { id: 6, mulai: "09:55", selesai: "10:30" },
            { id: 7, mulai: "10:30", selesai: "11:05" },
            { id: 8, mulai: "11:05", selesai: "11:40" },
            { id: 9, mulai: "11:40", selesai: "12:15" },
            { id: 10, mulai: "12:15", selesai: "12:50" },
            { id: 11, mulai: "12:50", selesai: "13:25" },
            { id: 12, mulai: "13:25", selesai: "14:00" },
        ],
        Selasa: [
            { id: 1, mulai: "07:00", selesai: "07:35" },
            { id: 2, mulai: "07:35", selesai: "08:10" },
            { id: 3, mulai: "08:10", selesai: "08:45" },
            { id: 4, mulai: "08:45", selesai: "09:20" },
            { id: 5, mulai: "09:20", selesai: "09:55" },
            { id: 6, mulai: "09:55", selesai: "10:30" },
            { id: 7, mulai: "10:30", selesai: "11:05" },
            { id: 8, mulai: "11:05", selesai: "11:40" },
            { id: 9, mulai: "11:40", selesai: "12:15" },
            { id: 10, mulai: "12:15", selesai: "12:50" },
            { id: 11, mulai: "12:50", selesai: "13:25" },
            { id: 12, mulai: "13:25", selesai: "14:00" },
        ],
        Rabu: [
            { id: 1, mulai: "07:00", selesai: "07:35" },
            { id: 2, mulai: "07:35", selesai: "08:10" },
            { id: 3, mulai: "08:10", selesai: "08:45" },
            { id: 4, mulai: "08:45", selesai: "09:20" },
            { id: 5, mulai: "09:20", selesai: "09:55" },
            { id: 6, mulai: "09:55", selesai: "10:30" },
            { id: 7, mulai: "10:30", selesai: "11:05" },
            { id: 8, mulai: "11:05", selesai: "11:40" },
            { id: 9, mulai: "11:40", selesai: "12:15" },
            { id: 10, mulai: "12:15", selesai: "12:50" },
            { id: 11, mulai: "12:50", selesai: "13:25" },
            { id: 12, mulai: "13:25", selesai: "14:00" },
        ],
        Kamis: [
            { id: 1, mulai: "07:00", selesai: "07:35" },
            { id: 2, mulai: "07:35", selesai: "08:10" },
            { id: 3, mulai: "08:10", selesai: "08:45" },
            { id: 4, mulai: "08:45", selesai: "09:20" },
            { id: 5, mulai: "09:20", selesai: "09:55" },
            { id: 6, mulai: "09:55", selesai: "10:30" },
            { id: 7, mulai: "10:30", selesai: "11:05" },
            { id: 8, mulai: "11:05", selesai: "11:40" },
            { id: 9, mulai: "11:40", selesai: "12:15" },
            { id: 10, mulai: "12:15", selesai: "12:50" },
            { id: 11, mulai: "12:50", selesai: "13:25" },
            { id: 12, mulai: "13:25", selesai: "14:00" },
        ],
        Jumat: [
            { id: 1, mulai: "07:00", selesai: "07:35" },
            { id: 2, mulai: "07:35", selesai: "08:10" },
            { id: 3, mulai: "08:10", selesai: "08:45" },
            { id: 4, mulai: "08:45", selesai: "09:20" },
            { id: 5, mulai: "09:20", selesai: "09:55" },
            { id: 6, mulai: "09:55", selesai: "10:30" },
            { id: 7, mulai: "10:30", selesai: "11:05" },
            { id: 8, mulai: "11:05", selesai: "11:40" },
            { id: 9, mulai: "11:40", selesai: "12:15" },
            { id: 10, mulai: "12:15", selesai: "12:50" },
            { id: 11, mulai: "12:50", selesai: "13:25" },
            { id: 12, mulai: "13:25", selesai: "14:00" },
        ],
    };

    const colorPalette = [
        {
            bg: "bg-primary-100",
            border: "border-primary-400",
            text: "text-primary-900",
            title: "text-primary-700",
        },
        {
            bg: "bg-primary-100",
            border: "border-primary-400",
            text: "text-primary-900",
            title: "text-primary-700",
        },
        {
            bg: "bg-purple-100",
            border: "border-purple-400",
            text: "text-purple-900",
            title: "text-purple-700",
        },
        {
            bg: "bg-amber-100",
            border: "border-amber-400",
            text: "text-amber-900",
            title: "text-amber-700",
        },
        {
            bg: "bg-rose-100",
            border: "border-rose-400",
            text: "text-rose-900",
            title: "text-rose-700",
        },
        {
            bg: "bg-cyan-100",
            border: "border-cyan-400",
            text: "text-cyan-900",
            title: "text-cyan-700",
        },
        {
            bg: "bg-indigo-100",
            border: "border-indigo-400",
            text: "text-indigo-900",
            title: "text-indigo-700",
        },
        {
            bg: "bg-primary-100",
            border: "border-primary-400",
            text: "text-primary-900",
            title: "text-primary-700",
        },
        {
            bg: "bg-orange-100",
            border: "border-orange-400",
            text: "text-orange-900",
            title: "text-orange-700",
        },
        {
            bg: "bg-pink-100",
            border: "border-pink-400",
            text: "text-pink-900",
            title: "text-pink-700",
        },
    ];

    function getSubjectColor(mapelName) {
        if (!mapelName) return colorPalette[0];
        let hash = 0;
        for (let i = 0; i < mapelName.length; i++) {
            hash = mapelName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colorPalette[Math.abs(hash) % colorPalette.length];
    }

    const kelasIds = useMemo(() => {
        if (!newKromosom || typeof newKromosom !== "object") return [];
        return Object.keys(newKromosom);
    }, [newKromosom]);

    const [activeKelas, setActiveKelas] = useState(null);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const tableRef = useRef(null);

    const startTimeRef = useRef(null);
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] =
        useState("Menghitung...");

    useEffect(() => {
        if (progress !== undefined) {
            if (progress <= 1 || !startTimeRef.current) {
                startTimeRef.current = Date.now();
            }

            if (progress > 0 && progress < 100) {
                const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
                const totalEstimatedTime = elapsedTime / (progress / 100);
                const remainingSeconds = Math.max(
                    0,
                    Math.round(totalEstimatedTime - elapsedTime),
                );

                if (remainingSeconds < 60) {
                    setEstimatedTimeRemaining(`${remainingSeconds} detik lagi`);
                } else {
                    const mins = Math.floor(remainingSeconds / 60);
                    const secs = remainingSeconds % 60;
                    setEstimatedTimeRemaining(`${mins} m ${secs} d lagi`);
                }
            } else if (progress >= 100) {
                setEstimatedTimeRemaining("Selesai");
            }
        }
    }, [progress]);

    useEffect(() => {
        if (
            kelasIds.length > 0 &&
            (!activeKelas || !kelasIds.includes(activeKelas))
        ) {
            setActiveKelas(kelasIds[0]);
        }
    }, [kelasIds, activeKelas]);

    useEffect(() => {
        if (!newKromosom || Object.keys(newKromosom).length === 0) return;

        if (kelasIds.length > 0) {
            const randomKelas =
                kelasIds[Math.floor(Math.random() * kelasIds.length)];
            setActiveKelas(randomKelas);
        }

        setIsHighlighted(true);
        if (tableRef.current) {
            tableRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }

        const timer = setTimeout(() => {
            setIsHighlighted(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [newKromosom]);

    const currentClassData = useMemo(() => {
        if (!newKromosom || !activeKelas || !newKromosom[activeKelas])
            return [];
        return Object.values(newKromosom[activeKelas]);
    }, [newKromosom, activeKelas]);

    const namaKelasAktif = useMemo(() => {
        if (currentClassData.length > 0 && currentClassData[0]?.nama_kelas) {
            return currentClassData[0].nama_kelas;
        }
        return activeKelas;
    }, [currentClassData, activeKelas]);

    const mapelList = useMemo(() => {
        if (!newKromosom || typeof newKromosom !== "object") return [];
        const uniqueMapel = new Set();
        Object.values(newKromosom).forEach((classMap) => {
            if (classMap && typeof classMap === "object") {
                Object.values(classMap).forEach((item) => {
                    if (item && item.nama_mapel) {
                        uniqueMapel.add(item.nama_mapel);
                    }
                });
            }
        });
        return Array.from(uniqueMapel);
    }, [newKromosom]);

    const maxJamKelas = useMemo(() => {
        let max = 12;
        currentClassData.forEach((gen) => {
            if (gen && gen.jam_mulai !== undefined) {
                let end =
                    parseInt(gen.jam_mulai, 10) +
                    parseInt(gen.durasi || 1, 10) -
                    1;
                if (end > max) max = end;
            }
        });
        return max;
    }, [currentClassData]);

    const daftarJamDinamis = useMemo(() => {
        return Array.from({ length: maxJamKelas }, (_, i) => i + 1);
    }, [maxJamKelas]);

    const conflictingSlots = useMemo(() => {
        if (!newKromosom || typeof newKromosom !== "object") return {};
        const teacherSlots = {};

        Object.entries(newKromosom).forEach(([kelasId, blocks]) => {
            if (!blocks || typeof blocks !== "object") return;
            Object.values(blocks).forEach((gen) => {
                let guruId = gen.guru_id ? String(gen.guru_id) : "none";
                let h = gen.hari;
                let jMulai = parseInt(gen.jam_mulai || 1, 10);
                let durasi = parseInt(gen.durasi || 1, 10);
                let namaMapel = gen.nama_mapel || "Mapel";

                let isPenjaskes =
                    gen.is_penjaskes === true ||
                    String(namaMapel).toLowerCase().includes("penjas") ||
                    String(namaMapel).toLowerCase().includes("olahraga");

                if (
                    guruId &&
                    guruId !== "none" &&
                    guruId !== "0" &&
                    !isPenjaskes
                ) {
                    if (!teacherSlots[guruId]) teacherSlots[guruId] = {};
                    if (!teacherSlots[guruId][h]) teacherSlots[guruId][h] = {};

                    for (let d = 0; d < durasi; d++) {
                        let jamKe = jMulai + d;
                        if (!teacherSlots[guruId][h][jamKe]) {
                            teacherSlots[guruId][h][jamKe] = [];
                        }
                        let exists = teacherSlots[guruId][h][jamKe].find(
                            (x) => x.kelas_id === String(kelasId),
                        );
                        if (!exists) {
                            teacherSlots[guruId][h][jamKe].push({
                                kelas_id: String(kelasId),
                                mapel: namaMapel,
                            });
                        }
                    }
                }
            });
        });

        const conflicts = {};
        Object.entries(teacherSlots).forEach(([gId, hariData]) => {
            Object.entries(hariData).forEach(([h, jamData]) => {
                Object.entries(jamData).forEach(([j, jadwalList]) => {
                    if (jadwalList.length > 1) {
                        jadwalList.forEach((x) => {
                            if (x.kelas_id === String(activeKelas)) {
                                conflicts[`${h}-${j}`] = true;
                            }
                        });
                    }
                });
            });
        });

        return conflicts;
    }, [newKromosom, activeKelas]);

    const jadwalMatrix = useMemo(() => {
        const matrix = {};
        hariList.forEach((h) => {
            matrix[h] = {};
        });

        const rawByDay = {};
        hariList.forEach((h) => {
            rawByDay[h] = [];
        });

        currentClassData.forEach((gen) => {
            if (!gen || !gen.hari || gen.jam_mulai === undefined) return;
            if (rawByDay[gen.hari]) {
                rawByDay[gen.hari].push({ ...gen });
            }
        });

        hariList.forEach((h) => {
            let items = rawByDay[h];
            if (!items || items.length === 0) return;

            items.sort(
                (a, b) => parseInt(a.jam_mulai, 10) - parseInt(b.jam_mulai, 10),
            );

            const mergedItems = [];
            let current = null;

            items.forEach((item) => {
                let start = parseInt(item.jam_mulai, 10);
                let dur = parseInt(item.durasi || 1, 10);

                if (!current) {
                    current = { ...item, jam_mulai: start, durasi: dur };
                } else {
                    let currentEnd =
                        parseInt(current.jam_mulai, 10) +
                        parseInt(current.durasi, 10);
                    if (
                        start === currentEnd &&
                        current.nama_mapel === item.nama_mapel &&
                        String(current.guru_id) === String(item.guru_id)
                    ) {
                        current.durasi += dur;
                    } else {
                        mergedItems.push(current);
                        current = { ...item, jam_mulai: start, durasi: dur };
                    }
                }
            });
            if (current) mergedItems.push(current);

            mergedItems.forEach((item) => {
                let start = parseInt(item.jam_mulai, 10);
                let dur = parseInt(item.durasi, 10);

                for (let d = 0; d < dur; d++) {
                    let jamKe = start + d;
                    if (!matrix[h][jamKe]) {
                        matrix[h][jamKe] = [];
                    }
                    matrix[h][jamKe].push({
                        ...item,
                        durasi: dur,
                        is_start: d === 0,
                    });
                }
            });
        });

        return matrix;
    }, [currentClassData, hariList]);

    return (
        <Modal onOpenChange={setOpenView} show={openView}>
            <div className="flex flex-col h-[90vh] max-h-[850px] text-gray-800 rounded-2xl overflow-hidden bg-white">
                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white shrink-0">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                            Live Monitor Jadwal - Matrix Kelas{" "}
                            {namaKelasAktif ? `(${namaKelasAktif})` : ""}
                        </h2>
                        <p className="text-[11px] text-gray-500">
                            Visualisasi matriks alokasi waktu per hari dan jam
                            pelajaran secara real-time.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setOpenView(false);
                            setActiveTab("proses");
                        }}
                        className="text-gray-400 hover:text-gray-600 transition text-xs font-bold p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Bar Progress & Estimasi Waktu */}
                {progress !== undefined && (
                    <div className="px-6 py-2 bg-white border-b border-gray-200 shrink-0">
                        <div className="flex justify-between items-center mb-1 text-[11px] font-semibold text-gray-600">
                            <div className="flex items-center gap-2">
                                <span>Progress Algoritma</span>
                                <span className="text-primary-400 font-mono text-[10px] bg-primary-100 px-2 py-0.5 rounded-full border border-primary-200">
                                    <i className="fa fa-clock"></i> Estimasi:{" "}
                                    <strong className="text-primary-700">
                                        {estimatedTimeRemaining}
                                    </strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>{Math.round(progress)}%</span>
                                <i className="fa fa-spinner fa-spin text-gray-400 text-[12px]"></i>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full p-1 border border-gray-200/80 shadow-inner">
                            <div
                                className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 h-3 rounded-full transition-all duration-500 ease-out shadow-sm shadow-primary-500/40 relative"
                                style={{
                                    width: `${Math.min(Math.max(progress, 0), 100)}%`,
                                }}
                            >
                                <div className="absolute top-0 bottom-0 right-0 w-2 bg-white/30 rounded-full blur-[1px]"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======================= INSERT LIVE LOG VIEWER ======================= */}
                <LiveLogViewer logs={liveLogs} />
                {/* ====================================================================== */}

                {/* Legend & Tab Selector Kelas */}
                <div className="flex flex-col bg-gray-50 border-b border-gray-200 shrink-0">
                    <div className="flex flex-col gap-2 px-6 py-2.5 border-b border-gray-200/60 text-xs bg-white">
                        <span className="font-semibold text-gray-500 text-[11px]">
                            Legend Warna Mata Pelajaran:
                        </span>
                        {mapelList.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {mapelList.map((mapel) => {
                                    const style = getSubjectColor(mapel);
                                    return (
                                        <div
                                            key={mapel}
                                            className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs"
                                        >
                                            <span
                                                className={`w-3 h-3 rounded-md ${style.bg} border ${style.border} inline-block`}
                                            ></span>
                                            <span className="text-gray-800 text-[11px] font-semibold">
                                                {mapel}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {kelasIds.length > 0 && (
                        <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto">
                            <span className="text-xs font-semibold text-gray-600 mr-2 shrink-0">
                                Pilih Kelas:
                            </span>
                            {kelasIds.map((kId) => {
                                const sampleItem = newKromosom[kId]
                                    ? Object.values(newKromosom[kId])[0]
                                    : null;
                                const labelKelas = sampleItem?.nama_kelas
                                    ? `${sampleItem.nama_kelas}`
                                    : `ID: ${kId}`;

                                return (
                                    <button
                                        key={kId}
                                        onClick={() => setActiveKelas(kId)}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                            activeKelas === kId
                                                ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        {labelKelas}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Body / Matriks Tabel Jadwal */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    {kelasIds.length > 0 && activeKelas ? (
                        <div
                            ref={tableRef}
                            className={`min-w-[1200px] bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${
                                isHighlighted
                                    ? "border-primary-500 ring-4 ring-primary-100"
                                    : "border-gray-200"
                            }`}
                        >
                            <table className="w-full border-collapse text-xs text-center font-mono">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                        <th className="py-3 px-4 text-left w-28 border-r border-gray-200">
                                            Hari / Jam
                                        </th>
                                        {daftarJamDinamis.map((j) => (
                                            <th
                                                key={j}
                                                className="py-3 px-1 border-r border-gray-200 text-[11px]"
                                            >
                                                Jam {j}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {hariList.map((hari) => {
                                        let skipCount = 0;
                                        return (
                                            <tr
                                                key={hari}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="py-4 px-4 font-bold text-primary-700 text-left border-r border-gray-200 bg-gray-50 font-sans">
                                                    {hari}
                                                </td>
                                                {daftarJamDinamis.map((j) => {
                                                    if (skipCount > 0) {
                                                        skipCount--;
                                                        return null;
                                                    }

                                                    const slots =
                                                        jadwalMatrix[hari]?.[j];
                                                    const slotWaktuInfo =
                                                        slotWaktuArrayData[
                                                            hari
                                                        ]?.[j - 1];

                                                    if (
                                                        !slots ||
                                                        slots.length === 0
                                                    ) {
                                                        return (
                                                            <td
                                                                key={j}
                                                                className="py-4 px-1 border-r border-gray-200 text-gray-300 text-[11px]"
                                                            >
                                                                -
                                                            </td>
                                                        );
                                                    }

                                                    const primarySlot =
                                                        slots[0];
                                                    const durasi = parseInt(
                                                        primarySlot.durasi || 1,
                                                        10,
                                                    );
                                                    if (durasi > 1) {
                                                        skipCount = durasi - 1;
                                                    }

                                                    const isBentrok =
                                                        slots.length > 1;
                                                    const cellConflictKey = `${hari}-${j}`;
                                                    const isGlobalConflict =
                                                        conflictingSlots[
                                                            cellConflictKey
                                                        ];

                                                    return (
                                                        <td
                                                            key={j}
                                                            colSpan={durasi}
                                                            className={`p-1.5 border-r border-gray-200 align-middle ${
                                                                isBentrok ||
                                                                isGlobalConflict
                                                                    ? "bg-red-50"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                {slots.map(
                                                                    (
                                                                        s,
                                                                        idx,
                                                                    ) => {
                                                                        const col =
                                                                            getSubjectColor(
                                                                                s.nama_mapel ||
                                                                                    "Mapel",
                                                                            );
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className={`rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-xs transition-all border relative ${col.bg} ${col.border}`}
                                                                            >
                                                                                {slotWaktuInfo && (
                                                                                    <span className="text-[9px] font-bold text-gray-500 mb-0.5">
                                                                                        {
                                                                                            slotWaktuInfo.mulai
                                                                                        }{" "}
                                                                                        -{" "}
                                                                                        {
                                                                                            slotWaktuInfo.selesai
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                                <span
                                                                                    className={`font-bold tracking-wide text-xs mb-0.5 ${col.title}`}
                                                                                >
                                                                                    {s.nama_mapel ||
                                                                                        "Mata Pelajaran"}
                                                                                </span>
                                                                                <span
                                                                                    className="text-[10px] font-semibold text-gray-600 truncate max-w-[110px]"
                                                                                    title={
                                                                                        s.nama_guru
                                                                                    }
                                                                                >
                                                                                    {s.nama_guru ||
                                                                                        `ID: ${s.guru_id}`}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400 italic">
                            Sedang menunggu data jadwal dari server...
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
