import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Panel({ url, user }) {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true,
    );
    const [localStorageData, setLocalStorageData] = useState({});

    // State untuk Console Log, Loading, List Tahun Ajaran, dan Pilihan ID
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState("");
    const consoleEndRef = useRef(null);

    const getTahunAjaran = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                route("master.tahun-ajaran.getTahunAjaran"),
            );
            if (res.data.status === false || !res.data.data) {
                setTahunAjaranList([]);
            } else {
                const data = res.data.data;
                setTahunAjaranList(data);
                // Pilih otomatis data pertama jika ada
                if (data.length > 0) {
                    setSelectedTahunAjaranId(data[0].id);
                }
            }
        } catch (error) {
            console.error("Gagal mengambil data tahun ajaran:", error);
            addLog("Gagal memuat daftar tahun ajaran.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getTahunAjaran();
    }, []);

    // Auto scroll ke bawah saat ada log baru
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Update ukuran window & status online
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        const handleOnline = () => {
            setIsOnline(true);
            addLog("System: Jaringan terhubung (Online)", "success");
        };
        const handleOffline = () => {
            setIsOnline(false);
            addLog("System: Kehilangan koneksi internet (Offline)", "error");
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Ambil data localStorage saat komponen dimount
        try {
            const storage = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                storage[key] = localStorage.getItem(key);
            }
            setLocalStorageData(storage);
            addLog(
                `System: Berhasil memuat ${Object.keys(storage).length} item dari LocalStorage.`,
                "info",
            );
        } catch (e) {
            addLog("Gagal membaca LocalStorage: " + e.message, "error");
        }

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Fungsi penambah log interaktif
    const addLog = (message, type = "info") => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev, { timestamp, message, type }]);
    };

    const handleClearConsole = () => {
        setLogs([]);
    };

    const handleClearStorage = () => {
        localStorage.clear();
        setLocalStorageData({});
        addLog("LocalStorage berhasil dibersihkan!", "warning");
        alert("LocalStorage berhasil dibersihkan!");
    };

    const handleReload = () => {
        addLog("Memuat ulang halaman...", "info");
        window.location.reload();
    };

    // Fungsi Cek Bentrok Jadwal via API dengan Filter Tahun Ajaran
    const onCheckConflict = async () => {
        if (!selectedTahunAjaranId) {
            addLog("Pilih Tahun Ajaran terlebih dahulu!", "warning");
            return;
        }
        setLoading(true);
        addLog(
            `Executing: GET /developer/cek-bentrok-jadwal?tahun_ajaran_id=${selectedTahunAjaranId}...`,
            "info",
        );
        try {
            const response = await axios.get(route("dev.cek-bentrok-jadwal"), {
                params: { tahun_ajaran_id: selectedTahunAjaranId },
            });

            if (response.data.success === true) {
                const data = response.data.data;
                if (data.length > 0) {
                    addLog(
                        `⚠️ Ditemukan ${data.length} kasus bentrok jadwal (Tahun Ajaran ID: ${selectedTahunAjaranId})!`,
                        "error",
                    );
                    data.forEach((item, idx) => {
                        addLog(
                            `[#${idx + 1}] Kelas ${item.nama_kelas} (${item.hari}): Mapel ${item.mapel_pertama} (${item.guru_pertama}) jam ${item.mulai_1.substring(0, 5)}-${item.selesai_1.substring(0, 5)} bentrok dengan ${item.mapel_kedua} (${item.guru_kedua})`,
                            "error",
                        );
                    });
                } else {
                    addLog(
                        `✔ Aman: Tidak ada bentrok jadwal pada Tahun Ajaran ID: ${selectedTahunAjaranId}.`,
                        "success",
                    );
                }
            } else {
                addLog("Gagal mengambil data bentrok jadwal.", "error");
            }
        } catch (error) {
            console.error("Gagal melakukan cek bentrok jadwal:", error);
            addLog("Error API: Gagal melakukan cek bentrok jadwal.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Fungsi Cek Kapasitas Kelas via API dengan Filter Tahun Ajaran
    const onCheckKapasitasKelas = async () => {
        if (!selectedTahunAjaranId) {
            addLog("Pilih Tahun Ajaran terlebih dahulu!", "warning");
            return;
        }
        setLoading(true);
        addLog(
            `Executing: GET /developer/cek-beban-jam-mengajar-per-kelas?tahun_ajaran_id=${selectedTahunAjaranId}...`,
            "info",
        );
        try {
            const response = await axios.get(
                route("dev.cek-beban-jam-mengajar-per-kelas"),
                {
                    params: { tahun_ajaran_id: selectedTahunAjaranId },
                },
            );

            if (response.data.success === true) {
                const data = response.data.data;
                addLog(
                    `✔ Kapasitas ditarik untuk ${data.length} kelas (Tahun Ajaran ID: ${selectedTahunAjaranId}).`,
                    "success",
                );
                data.forEach((item) => {
                    const statusType =
                        item.total_jam_terjadwal === 57 ? "success" : "warning";
                    addLog(
                        `   • Kelas ${item.nama_kelas}: ${item.total_jam_terjadwal} Jam [${item.status_kapasitas}]`,
                        statusType,
                    );
                });
            } else {
                addLog("Gagal mengambil data kapasitas kelas.", "error");
            }
        } catch (error) {
            console.error("Gagal cek kapasitas kelas:", error);
            addLog("Error API: Gagal cek kapasitas kelas.", "error");
        } finally {
            setLoading(false);
        }
    };
    const onCheckGuruMengajar = async () => {
        if (!selectedTahunAjaranId) {
            addLog("Pilih Tahun Ajaran terlebih dahulu!", "warning");
            return;
        }
        setLoading(true);
        addLog(
            `Executing: GET /developer/cek-guru-mengajar?tahun_ajaran_id=${selectedTahunAjaranId}...`,
            "info",
        );
        try {
            const response = await axios.get(route("dev.cek-guru-mengajar"), {
                params: { tahun_ajaran_id: selectedTahunAjaranId },
            });

            if (response.data.success === true) {
                const data = response.data.data;

                if (data.length === 0) {
                    addLog(
                        "✔ Tidak ada bentrok jadwal guru yang ditemukan.",
                        "success",
                    );
                } else {
                    addLog(
                        `⚠ Ditemukan ${data.length} potensi bentrok jadwal guru!`,
                        "warning",
                    );
                    data.forEach((item) => {
                        addLog(
                            `   • Guru **${item.nama_guru}** bentrok pada hari **${item.hari}** (Jam ${item.jam_mulai} - ${item.jam_selesai}): Mengajar di kelas **${item.kelas_pertama}** (${item.mapel_di_kelas_pertama}) & **${item.kelas_kedua}** (${item.mapel_di_kelas_kedua})`,
                            "error",
                        );
                    });
                }
            } else {
                addLog("Gagal memeriksa jadwal mengajar guru.", "error");
            }
        } catch (error) {
            console.error("Gagal cek guru mengajar:", error);
            addLog("Error API: Gagal memeriksa jadwal guru.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 p-4 shadow-sm text-left">
            {/* Header / Judul Panel */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>
                        <i className="fa fa-desktop"></i>
                    </span>{" "}
                    Dev Console & Inspector
                </h3>
                <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        isOnline
                            ? "bg-primary-100 text-primary-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
                    {isOnline ? "Online" : "Offline"}
                </span>
            </div>

            {/* Konten Utama (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {/* 1. Informasi Sesi */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                        Informasi Sesi
                    </h4>
                    <p className="text-gray-600">
                        <span className="font-semibold">User:</span>{" "}
                        {user?.name || "Guest"}
                    </p>
                    <p className="text-gray-600 truncate">
                        <span className="font-semibold">URL:</span>{" "}
                        {url || window.location.href}
                    </p>
                </div>

                {/* 2. Informasi Viewport / Layar */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                        Viewport Screen
                    </h4>
                    <p className="text-gray-600">
                        Width:{" "}
                        <span className="font-mono font-bold">
                            {windowSize.width}px
                        </span>
                    </p>
                    <p className="text-gray-600">
                        Height:{" "}
                        <span className="font-mono font-bold">
                            {windowSize.height}px
                        </span>
                    </p>
                </div>

                {/* 3. Developer Console Screen (Terminal View) */}
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 space-y-2 text-white">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                        <h4 className="font-bold text-primary-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <span>
                                <i className="fa fa-terminal"></i>
                            </span>{" "}
                            Dev Terminal Output
                        </h4>
                        <button
                            onClick={handleClearConsole}
                            className="text-[10px] text-gray-400 hover:text-white bg-gray-800 px-1.5 py-0.5 rounded transition-colors"
                        >
                            Clear
                        </button>
                    </div>

                    {/* SELECT TAHUN AJARAN */}
                    <div className="flex items-center justify-between gap-2 bg-gray-800 p-2 rounded text-[11px]">
                        <span className="text-gray-300 font-semibold">
                            Tahun Ajaran:
                        </span>
                        <select
                            value={selectedTahunAjaranId}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setSelectedTahunAjaranId(val);
                                addLog(
                                    `System: Tahun Ajaran diubah ke ID [${val}]`,
                                    "info",
                                );
                            }}
                            className="bg-black text-primary-400 border border-gray-700 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-primary-500 font-mono w-36"
                        >
                            {tahunAjaranList.length === 0 ? (
                                <option value="" disabled>
                                    Memuat...
                                </option>
                            ) : (
                                tahunAjaranList.map((tahunAjaran) => (
                                    <option
                                        key={tahunAjaran.id}
                                        value={tahunAjaran.id}
                                    >
                                        {tahunAjaran.tahun_ajaran} /{" "}
                                        {tahunAjaran.semester}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Terminal Window */}
                    <div className="h-36 overflow-y-auto font-mono text-[10px] bg-black p-2.5 rounded border border-gray-800 space-y-1">
                        {logs.length === 0 ? (
                            <span className="text-gray-500 italic">
                                // Ready. Pilih tahun ajaran dan jalankan tes di
                                bawah...
                            </span>
                        ) : (
                            logs.map((log, index) => {
                                let textColor = "text-gray-300";
                                if (log.type === "success")
                                    textColor = "text-primary-400";
                                if (log.type === "error")
                                    textColor = "text-red-400";
                                if (log.type === "warning")
                                    textColor = "text-yellow-400";
                                if (log.type === "info")
                                    textColor = "text-primary-400";

                                return (
                                    <div key={index} className="leading-tight">
                                        <span className="text-gray-600">
                                            [{log.timestamp}]
                                        </span>{" "}
                                        <span className={textColor}>
                                            {log.message}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={consoleEndRef} />
                    </div>

                    {/* Tombol Eksekusi Perintah Console */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onCheckConflict}
                            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-[11px] font-semibold py-1.5 px-2 rounded transition-colors shadow-sm flex items-center justify-center gap-1"
                        >
                            <span>
                                <i className="fa fa-search"></i>
                            </span>{" "}
                            Cek Bentrok Jadwal
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onCheckKapasitasKelas}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-semibold py-1.5 px-2 rounded transition-colors shadow-sm flex items-center justify-center gap-1"
                        >
                            <span>
                                <i className="fa fa-search"></i>
                            </span>{" "}
                            Cek Beban Mengajar Guru
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onCheckGuruMengajar}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-semibold py-1.5 px-2 rounded transition-colors shadow-sm flex items-center justify-center gap-1"
                        >
                            <span>
                                <i className="fa fa-search"></i>
                            </span>{" "}
                            Cek Mengajar Guru
                        </button>
                        <a
                            href={route("dev.monitor-dev")}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-semibold py-1.5 px-2 rounded transition-colors shadow-sm flex items-center justify-center gap-1"
                        >
                            <span>
                                <i className="fa fa-search"></i>
                            </span>{" "}
                            Monitor Jadwal Real Time
                        </a>
                    </div>
                </div>

                {/* 4. LocalStorage Inspector */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                        Local Storage ({Object.keys(localStorageData).length}{" "}
                        items)
                    </h4>
                    {Object.keys(localStorageData).length === 0 ? (
                        <p className="text-gray-400 italic text-[11px]">
                            Storage kosong
                        </p>
                    ) : (
                        <div className="max-h-24 overflow-y-auto font-mono text-[10px] bg-white p-2 rounded border border-gray-200">
                            {Object.entries(localStorageData).map(
                                ([key, value]) => (
                                    <div key={key} className="truncate">
                                        <span className="text-primary-600">
                                            {key}:
                                        </span>{" "}
                                        {value}
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>

                {/* 5. Tombol Aksi Debug */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        Quick Actions
                    </h4>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReload}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-2 rounded font-medium text-[11px] transition-colors"
                        >
                            Reload Page
                        </button>
                        <button
                            onClick={handleClearStorage}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 px-2 rounded font-medium text-[11px] transition-colors"
                        >
                            Clear Storage
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Panel */}
            <div className="border-t border-gray-100 pt-3 mt-3 text-center">
                <span className="text-[10px] text-gray-400 font-medium">
                    Dev Console v2.1.0 - Interactive Mode
                </span>
            </div>
        </div>
    );
}
