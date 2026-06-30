import Modal from "@/Components/Modal";
import { useState } from "react";
import MonitoringKBM from "./modal/MonitoringKBM";

export default function SuperAdmin({ user, tglStr, total }) {
    const [menuCepat] = useState([
        {
            href: route("master.guru.index"),
            icon: "fa-user-tie",
            label: "Kelola Guru",
        },
        {
            href: route("manajemen.kelola-user.index"),
            icon: "fa-users",
            label: "Kelola Pengguna",
        },
        {
            href: route("master.siswa.index"),
            icon: "fa-user-graduate",
            label: "Kelola Siswa",
        },
        {
            href: route("master.kelas.index"),
            icon: "fa-door-open",
            label: "Kelola Kelas",
        },
        {
            href: route("master.mapel.index"),
            icon: "fa-book",
            label: "Kelola Mata Pelajaran",
        },
        {
            href: route("master.generate-jadwal.index"),
            icon: "fa-calendar",
            label: "Kelola Jadwal",
        },
    ]);

    const cardsMonitoring = [
        {
            icon: "fa-user-tie",
            label: "Guru",
            total: total.Guru,
        },
        {
            icon: "fa-user-graduate",
            label: "Siswa",
            total: total.Siswa,
        },
        {
            icon: "fa-door-open",
            label: "Kelas",
            total: total.Kelas,
        },
        {
            icon: "fa-book",
            label: "Mata Pelajaran",
            total: total.Mapel,
        },
    ];
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-800 rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-2xl">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
                <div className="relative flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div>
                        <p className="text-emerald-300 text-xs font-semibold tracking-widest uppercase mb-3">
                            Selamat datang kembali 👋
                        </p>
                        <h1 className="text-3xl md:text-4xl font-black mb-3 uppercase tracking-tight">
                            {user.name}
                        </h1>
                        <p className="text-sm text-green-300 font-medium">
                            {user.nip}
                        </p>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-sm font-semibold tabular-nums bg-white/10 px-5 py-3 rounded-2xl border border-white/20">
                            {tglStr}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 border border-emerald-400/30 shadow-lg">
                    <div className="flex justify-between items-start">
                        {/* ── Area Ikon dan Angka Utama ── */}
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <i className="fa-solid fa-computer text-xl text-white"></i>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-emerald-100 mb-1">
                                    Kelas Yang Sedang Berlangsung
                                </p>

                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-white tabular-nums leading-none"></p>
                                    <span className="text-xs text-emerald-200 font-medium">
                                        <i className="fa-solid fa-eye"></i>{" "}
                                        Pantau Kelas yang Sedang KBM
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── Indikator "Live / Real-time" ── */}
                        <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full border border-white/10">
                            <span className="flex h-2 w-2 relative">
                                {/* Animasi Ping dari Tailwind */}
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                Live
                            </span>
                        </div>
                    </div>

                    {/* ── Area Informasi Tambahan & Aksi ── */}
                    <div className="mt-5 pt-4 border-t border-white/20 flex justify-between items-center">
                        <div className="text-sm text-emerald-100 flex items-center gap-2">
                            <i className="fa-solid fa-network-wired text-xs opacity-70"></i>
                            <span>Terkoneksi ke Server</span>
                        </div>
                        <button
                            className="text-xs font-bold text-white hover:text-emerald-200 transition-colors flex items-center gap-1 group"
                            onClick={() => setOpen(true)}
                        >
                            Detail
                            <span className="group-hover:translate-x-1 transition-transform">
                                →
                            </span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex mb-2">
                        <div className="ml-4">
                            <span className="text-xs text-slate-400 font-medium">
                                <i className="fa-solid fa-chart-line"></i> Data
                                Monitoring
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* ── Kartu Monitoring ── */}

                        {cardsMonitoring.map((m, i) => (
                            <div
                                key={i}
                                className="group flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white hover:border-green-200 cursor-pointer"
                            >
                                {/* Ikon dengan efek glow */}
                                <div className="w-14 h-14 mb-4 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-600 transition-colors duration-300">
                                    <i
                                        className={`fas ${m.icon} text-green-600 text-xl group-hover:text-white transition-colors duration-300`}
                                    ></i>
                                </div>

                                {/* Angka Total */}
                                <h2 className="text-3xl font-black text-slate-800 tabular-nums">
                                    {m.total}
                                </h2>

                                {/* Label */}
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-green-600 transition-colors duration-300">
                                    {m.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-6">
                    Akses Cepat
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {menuCepat.map((m, i) => (
                        <a
                            key={i}
                            href={m.href}
                            className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300"
                        >
                            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-green-600 group-hover:bg-emerald-700 flex items-center justify-center shadow-sm transition-colors duration-300">
                                <i
                                    className={`fa ${m.icon} text-white text-sm`}
                                ></i>
                            </div>
                            <span className="text-sm font-semibold text-slate-500 text-center group-hover:text-emerald-700 transition-colors duration-300">
                                {m.label}
                            </span>
                        </a>
                    ))}
                </div>
            </div>

            <Modal show={open} onClose={() => setOpen(false)}>
                <MonitoringKBM
                    title="Monitoring KBM"
                    onClose={() => setOpen(false)}
                    open={open}
                />
            </Modal>
        </>
    );
}
