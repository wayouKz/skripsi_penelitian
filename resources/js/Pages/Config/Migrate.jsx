import { useState, useEffect, useRef } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import axios from "axios";
import { router } from "@inertiajs/react";
import { RefreshCw, Terminal, CheckCircle2, XCircle } from "lucide-react";

export default function Migrate() {
    const [before, setBefore] = useState(true);
    const [status, setStatus] = useState(
        "Sistem siap dipasang. Klik tombol di bawah untuk memulai.",
    );
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- STATE UNTUK TERMINAL LOG ---
    const [logs, setLogs] = useState([]);
    const logsEndRef = useRef(null);

    // Auto-scroll ke bawah saat ada log baru
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const runMigration = async () => {
        setBefore(false);
        setLoading(true);
        setError(null);
        setStatus("Menyiapkan database, mohon jangan tutup halaman ini...");
        setLogs(["[SYSTEM] Memulai proses instalasi..."]);

        // Simulasi log berjalan agar UI terasa "Syncing" dan hidup
        let step = 0;
        const simulatedSteps = [
            "Menghubungkan ke server database...",
            "Memverifikasi kredensial .env...",
            "Mempersiapkan file migrasi...",
            "Menjalankan skema tabel utama...",
            "Menyinkronkan relasi antar tabel...",
            "Memasukkan data awal (Seeding)...",
            "Menyesuaikan hak akses dan pengaturan...",
            "Proses masih berjalan, harap tunggu...",
        ];

        const logInterval = setInterval(() => {
            if (step < simulatedSteps.length) {
                setLogs((prev) => [...prev, `> ${simulatedSteps[step]}`]);
                step++;
            }
        }, 2000); // Munculkan log buatan tiap 2 detik

        try {
            // Menggunakan axios agar bisa menangkap error response (500) dengan baik
            const res = await axios.get(route("install.setup-migrate"));

            // Hentikan simulasi log
            clearInterval(logInterval);

            // Tambahkan log sukses sesungguhnya
            setLogs((prev) => [
                ...prev,
                "[OK] Semua migrasi berhasil dieksekusi.",
                "[OK] Konfigurasi sistem selesai.",
                "[SYSTEM] Mengarahkan ke halaman login...",
            ]);
            setStatus("Instalasi Selesai! Mengarahkan...");

            // Beri jeda 2 detik agar user bisa membaca log "Selesai", lalu lempar ke login
            setTimeout(() => {
                router.visit(route("install.configure")); // Sesuaikan route dengan nama route login Anda
            }, 2000);
        } catch (e) {
            clearInterval(logInterval);
            console.log(e);
            const errorMsg =
                e.response?.data?.message ||
                "Migrasi gagal. Periksa log server Laravel Anda.";

            setLogs((prev) => [
                ...prev,
                `[ERROR] Terjadi kesalahan kritis!`,
                `[ERROR] Output: ${errorMsg}`,
            ]);

            setError(errorMsg);
            setStatus("Instalasi dihentikan karena error.");
            setLoading(false);
            setBefore(true); // Izinkan user mencoba lagi
        }
    };

    return (
        <GuestLayout>
            {/* Header Section */}
            <div className="px-6 py-8 text-center bg-gray-50 border-b border-gray-100">
                {loading ? (
                    <div className="flex justify-center mb-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
                            <RefreshCw
                                size={50}
                                className="text-primary-600 animate-spin relative z-10"
                            />
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex justify-center mb-5">
                        <XCircle size={50} className="text-red-500" />
                    </div>
                ) : (
                    <div className="flex justify-center mb-5">
                        <CheckCircle2 size={50} className="text-gray-300" />
                    </div>
                )}

                <h1 className="text-2xl font-extrabold text-gray-800 mb-2">
                    Instalasi Database
                </h1>
                <p className="text-sm text-gray-500">{status}</p>
            </div>

            <div className="p-6 flex flex-col gap-6">
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
                        <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">
                            {error}
                        </span>
                    </div>
                )}

                {/* Terminal Log Window */}
                {(!before || logs.length > 0) && (
                    <div className="flex flex-col rounded-xl overflow-hidden border border-primary-700 shadow-inner bg-primary-900">
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary-800 border-b border-primary-700">
                            <Terminal size={14} className="text-primary-400" />
                            <span className="text-[11px] font-semibold tracking-wider text-primary-400 uppercase">
                                System Output
                            </span>
                        </div>

                        <div className="p-4 h-56 overflow-y-auto font-mono text-xs flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent">
                            {logs.length === 0 ? (
                                <span className="text-primary-500">
                                    Menyiapkan lingkungan kerja...
                                </span>
                            ) : (
                                logs.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className={`${
                                            log.includes("[ERROR]")
                                                ? "text-red-400 font-semibold"
                                                : log.includes("[OK]")
                                                  ? "text-primary-400"
                                                  : log.includes("[SYSTEM]")
                                                    ? "text-primary-400 font-semibold"
                                                    : "text-primary-300"
                                        }`}
                                    >
                                        {log}
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                )}

                {/* Action Button */}
                {before && !loading && (
                    <button
                        onClick={runMigration}
                        className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 hover:shadow-lg transition-all focus:ring-4 focus:ring-primary-500/30 flex items-center justify-center gap-2"
                    >
                        <Terminal size={18} />
                        Jalankan Instalasi
                    </button>
                )}

                {/* Progress Bar (Visible only when loading) */}
                {loading && (
                    <div className="flex flex-col gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                            <div className="h-full bg-primary-600 animate-pulse w-full rounded-full transition-all"></div>
                        </div>
                        <span className="text-right text-[10px] text-gray-400 font-medium animate-pulse">
                            Memproses data...
                        </span>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
