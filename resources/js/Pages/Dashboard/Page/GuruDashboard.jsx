import { useState } from "react";
// Pastikan path import ini sesuai dengan struktur folder Anda
import JadwalTimeline from "../CardDashboard/JadwalTimeline";
import StatCard from "../CardDashboard/StatsCard";

export default function GuruDashboard({
    user = { name: "Budi Santoso", nip: "19880123 201001 1 001" },
    tglStr = "Senin, 26 Jan 2026",
}) {
    // Definisi warna badge untuk Pengumuman
    const jenisStyle = {
        Akademik: { color: "bg-blue-100 text-blue-700" },
        Sistem: { color: "bg-purple-100 text-purple-700" },
        Umum: { color: "bg-gray-100 text-gray-700" },
    };

    // Dummy data agar UI langsung terlihat
    const [stats] = useState([
        { label: "Total Kelas", value: "8", icon: "📚" },
        { label: "Tugas Diperiksa", value: "45", icon: "✅" },
        { label: "Menunggu Nilai", value: "12", icon: "⏳" },
        { label: "Kehadiran", value: "98%", icon: "📊" },
    ]);

    const [pengumuman] = useState([]);

    const [menuCepat] = useState([
        { href: "#", icon: "📝", label: "Input Nilai" },
        { href: "#", icon: "📅", label: "Jadwal" },
        { href: "#", icon: "👥", label: "Absensi" },
        { href: "#", icon: "📂", label: "Materi" },
        { href: "#", icon: "💬", label: "Pesan" },
        { href: "#", icon: "⚙️", label: "Setting" },
    ]);

    return (
        <div className="space-y-8 bg-slate-50 md:p-8 font-sans">
            {/* ── Hero Section ── */}
            <div className="relative bg-gradient-to-r from-green-700 to-green-900 rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
                    <div>
                        <p className="text-emerald-100 text-sm md:text-base font-medium mb-2 tracking-wide uppercase">
                            Selamat datang kembali 👋
                        </p>
                        <h1 className="text-3xl md:text-2xl font-extrabold mb-4 tracking-tight">
                            {user.name}
                        </h1>
                        <span className="inline-flex items-center px-3 py-1 text-sm text-emerald-50 bg-emerald-800/50 backdrop-blur-sm rounded-lg border border-emerald-500/30">
                            NIP: {user.nip}
                        </span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                        <div className="text-sm text-emerald-100 mb-1">
                            Tanggal Hari Ini
                        </div>
                        <div className="text-lg md:text-xl font-bold tabular-nums">
                            {tglStr}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards Grid ── */}
            {/* Asumsi StatCard sudah di-styling dengan baik. Jika belum, tambahkan shadow-sm dan hover:shadow-md di komponen tersebut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s, i) => (
                    <StatCard key={i} {...s} />
                ))}
            </div>

            {/* ── Mid Section ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Jadwal */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Jadwal Mengajar
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Timeline aktivitas Anda hari ini
                            </p>
                        </div>
                        <a
                            href="#"
                            className="text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors flex items-center gap-1 group"
                        >
                            Lihat semua
                            <span className="group-hover:translate-x-1 transition-transform">
                                →
                            </span>
                        </a>
                    </div>
                    <JadwalTimeline />
                </div>

                {/* Pengumuman */}
                <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                            Pengumuman
                        </h2>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {pengumuman.map((p) => (
                            <div
                                key={p.id}
                                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                    p.urgent
                                        ? "bg-orange-50/50 border-orange-200 hover:bg-orange-50 hover:shadow-sm"
                                        : "bg-slate-50 border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-sm"
                                }`}
                            >
                                <span
                                    className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md ${jenisStyle[p.jenis]?.color || "bg-gray-200 text-gray-700"}`}
                                >
                                    {p.jenis}
                                </span>
                                <h3 className="text-sm font-semibold text-slate-800 mt-3 leading-snug">
                                    {p.judul}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-xs text-slate-400">
                                        🕒 {p.tgl}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Menu Cepat ── */}
        </div>
    );
}
