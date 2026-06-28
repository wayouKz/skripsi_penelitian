import Modal from "@/Components/Modal";
import { useState } from "react";
import MonitoringKBM from "./modal/MonitoringKBM";

export default function SuperAdmin({ user, tglStr }) {
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
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="relative bg-gradient-to-r from-green-700 to-green-900 rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div>
                        <p className="text-green-200 text-sm font-medium mb-1">
                            Selamat datang kembali 👋
                        </p>
                        <h1 className="text-2xl md:text-3xl font-bold mb-3 uppercase">
                            {user.name}
                        </h1>
                        <p className="text-sm text-green-200">{user.nip}</p>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-lg font-bold tabular-nums">
                            {tglStr}
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm">
                    <div className="relative bg-emerald-600 rounded-3xl p-6 border border-emerald-500 shadow-md ">
                        <div className="flex justify-between items-start">
                            {/* ── Area Ikon dan Angka Utama ── */}
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <i className="fa-solid fa-computer text-xl text-emerald-600"></i>
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
                            <div className="flex items-center gap-1.5 bg-emerald-700/50 px-2.5 py-1 rounded-full border border-emerald-500/50">
                                <span className="flex h-2 w-2 relative">
                                    {/* Animasi Ping dari Tailwind */}
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-50 uppercase tracking-wider">
                                    Live
                                </span>
                            </div>
                        </div>

                        {/* ── Area Informasi Tambahan & Aksi ── */}
                        <div className="mt-5 pt-4 border-t border-emerald-500/50 flex justify-between items-center">
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
                </div>
                <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm"></div>
            </div>
            <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-6">
                    Akses Cepat
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {menuCepat.map((m, i) => (
                        <a
                            key={i}
                            href={m.href}
                            className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
                                <i
                                    className={`fa ${m.icon} text-white text-base`}
                                ></i>
                            </div>
                            <span className="text-sm font-semibold text-slate-600 text-center group-hover:text-emerald-700">
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
