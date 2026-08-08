<<<<<<< HEAD
export default function Proses({
    progress,
    setProgress,
    resetButton,
    generation,
    fitness,
    logs,
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 space-y-10 max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-purple-600 relative z-10">
                    <span className="text-green-600">Memproses </span>
                    Jadwal....
                </h3>
            </div>
            <strong className=" text-xs text-red-400 font-mono">
                * Proses ini membutuhkan waktu,harap bersabar
            </strong>
            <div className="grid grid-cols-1 gap-4 w-full">
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Progress
                    </p>
                    <p className="text-3xl font-black text-green-600">
                        {progress}%
                    </p>
                </div>
                {/* <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
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
                </div> */}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                    className="bg-gradient-to-r from-green-500 via-purple-500 to-green-500 h-full rounded-full transition-all duration-300 relative"
                    style={{
                        width: `${progress}%`,
                        backgroundSize: "200% 100%",
                        animation: "gradient 2s linear infinite",
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
                            <span className="text-gray-500 mr-2">{">"}</span>
                            {log}
                        </p>
                    ))}
                </div>
            </div>
            {resetButton && (
                <button
                    onClick={handleStartGA}
                    className="font-black px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg bg-red-600 hover:bg-red-700 hover:-translate-y-1 hover:shadow-red-200 text-white"
                >
                    RESET
                </button>
=======
import React, { useEffect, useRef } from "react";

export default function Proses({ progress, resetButton, logs = [], onReset }) {
    const logEndRef = useRef(null);

    // Filter log untuk mendeteksi apakah ada error atau peringatan
    const errorLogs = logs.filter(
        (log) =>
            typeof log === "string" &&
            (log.toLowerCase().includes("error") ||
                log.toLowerCase().includes("gagal") ||
                log.toLowerCase().includes("bentrok")),
    );

    // Auto-scroll ke log error terbaru
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const isComplete = progress >= 100;

    return (
        <div className="max-w-xl mx-auto h-full flex flex-col justify-center space-y-6 p-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        {isComplete ? (
                            <svg
                                className="w-5 h-5 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-5 h-5 text-emerald-600 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800">
                            {isComplete
                                ? "Penjadwalan Selesai"
                                : "Memproses Penjadwalan"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isComplete
                                ? "Alokasi waktu dan pengajar berhasil dioptimalkan."
                                : "Sistem sedang mengoptimalkan alokasi waktu dan pengajar."}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                        {progress}%
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                    {isComplete
                        ? "Proses telah berhasil diselesaikan."
                        : "Mohon tunggu sebentar, proses ini berjalan otomatis di latar belakang."}
                </p>
            </div>

            {/* Error Log Container (Hanya tampil jika ada error/bentrok) */}
            {errorLogs.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
                        <i className="fa fa-exclamation-circle text-sm"></i>
                        <span>Terjadi Kesalahan / Peringatan Sistem</span>
                    </div>
                    <div className="space-y-1 font-mono text-xs text-rose-600 max-h-32 overflow-y-auto">
                        {errorLogs.map((log, i) => (
                            <p key={i}>• {log}</p>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            )}

            {/* Tombol Reset / Coba Lagi */}
            {resetButton && (
                <div className="pt-2 flex justify-end">
                    <button
                        onClick={onReset}
                        type="button"
                        className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                    >
                        <i className="fa fa-redo text-xs"></i>
                        Reset / Coba Lagi
                    </button>
                </div>
>>>>>>> main
            )}
        </div>
    );
}
