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
            )}
        </div>
    );
}
