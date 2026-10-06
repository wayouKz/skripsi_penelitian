import Modal from "@/Components/Modal";
import { useState } from "react";
import MonitoringKBM from "./modal/MonitoringKBM";
import { usePage } from "@inertiajs/react";

export default function SuperAdmin({ user, tglStr, total }) {
    const [menuCepat] = useState([
        {
            href: route("master.guru.index"),
            icon: "fa-user-tie",
            label: "Kelola Guru",
            color: "from-emerald-500 to-emerald-600",
        },
        {
            href: route("manajemen.kelola-user.index"),
            icon: "fa-users",
            label: "Kelola Pengguna",
            color: "from-purple-500 to-purple-600",
        },
        {
            href: route("master.siswa.index"),
            icon: "fa-user-graduate",
            label: "Kelola Siswa",
            color: "from-emerald-500 to-emerald-600",
        },
        {
            href: route("master.kelas.index"),
            icon: "fa-door-open",
            label: "Kelola Kelas",
            color: "from-orange-500 to-orange-600",
        },
        {
            href: route("master.mapel.index"),
            icon: "fa-book",
            label: "Mata Pelajaran",
            color: "from-pink-500 to-pink-600",
        },
        {
            href: route("master.generate-jadwal.index"),
            icon: "fa-calendar-alt",
            label: "Kelola Jadwal",
            color: "from-teal-500 to-teal-600",
        },
    ]);

    const cardsMonitoring = [
        { icon: "fa-user-tie", label: "Total Guru", total: total.Guru },
        { icon: "fa-user-graduate", label: "Total Siswa", total: total.Siswa },
        { icon: "fa-door-open", label: "Total Kelas", total: total.Kelas },
        { icon: "fa-book", label: "Mata Pelajaran", total: total.Mapel },
    ];

    const [open, setOpen] = useState(false);

    const config = usePage().props.settings_application;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* ── HEADER / BANNER UTAMA (FULL WIDTH) ── */}
                <div className="col-span-1 lg:col-span-2">
                    <div className="relative w-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-200 rounded-2xl flex items-center justify-between overflow-hidden shadow-sm px-5 py-6 md:px-8 md:py-8">
                        {/* Bagian Kiri: Konten */}
                        <div className="z-10 w-full md:w-2/3 flex flex-col gap-3">
                            {/* Baris Badges */}
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                                <div className="bg-white px-2.5 py-1 rounded text-emerald-700 text-[10px] md:text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Sistem Online
                                </div>

                                <div className="bg-white px-2.5 py-1 rounded text-slate-700 text-[10px] md:text-xs font-medium flex items-center gap-1.5 shadow-sm">
                                    <i className="fa-solid fa-user text-emerald-600"></i>
                                    {user.role.nama_roles}
                                </div>

                                <div className="text-white/90 text-[10px] md:text-xs font-medium flex items-center gap-1.5 ml-1">
                                    <i className="fa-regular fa-calendar-alt"></i>
                                    {tglStr}
                                </div>
                            </div>

                            {/* Judul & Deskripsi */}
                            <div>
                                <h1 className="text-white text-xl md:text-3xl font-bold tracking-wide drop-shadow-sm mb-2 flex items-center gap-2">
                                    Selamat Datang, {user.name.toUpperCase()}!
                                </h1>
                                <p className="text-white/90 text-xs md:text-sm max-w-xl leading-relaxed">
                                    Dashboard <strong>Sistem Akademik</strong>{" "}
                                    siap membantu memantau kegiatan belajar
                                    mengajar (KBM), statistik kehadiran siswa,
                                    dan laporan harian secara real-time.
                                </p>
                            </div>
                        </div>

                        {/* Bagian Kanan: Ilustrasi */}
                        <div className="absolute right-0 bottom-0 h-full w-1/3 md:w-1/2 flex justify-end items-end pointer-events-none">
                            <img
                                src="/storage/public/ilustrasi/ilustrasi_prof.svg"
                                alt="Ilustrasi"
                                className="h-full md:h-[120%] max-h-[160px] md:max-h-[200px] object-contain object-right-bottom pr-2 md:pr-10"
                            />
                        </div>
                    </div>
                </div>

                {/* ── CARD KONTEN BAWAH KANAN (1 KOLOM) ── */}
                <div className="col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full max-w-md font-sans">
                        {/* ── BAGIAN ATAS ── */}
                        <div className="flex items-center p-4 md:p-5 gap-4">
                            {/* Ikon Lingkaran dengan Gradien */}
                            <div className="w-14 h-14 rounded-full flex-shrink-0 bg-gradient-to-b from-emerald-400 to-emerald-300 flex items-center justify-center text-white shadow-sm">
                                {config?.logo_instansi ? (
                                    /* Tampil jika data logo ada */
                                    <img
                                        src={`/storage/public/logo/${config.logo_instansi}`}
                                        alt="Logo Instansi"
                                        className="w-[30px] h-[30px] object-cover"
                                    />
                                ) : (
                                    /* Tampil jika data logo kosong (Fallback) */
                                    <i className="fa-solid fa-school text-2xl"></i>
                                )}
                            </div>
                            {/* Teks Nama Instansi */}
                            <div className="flex-1">
                                <h2 className="text-[15px] md:text-base font-bold text-slate-800 leading-tight uppercase">
                                    {config?.nama_instansi
                                        ? config.nama_instansi
                                        : "Nama Instansi Belum Diatur"}
                                </h2>
                            </div>
                        </div>

                        {/* ── BAGIAN BAWAH (ALAMAT) ── */}
                        <div className="bg-slate-50 border-t border-slate-200 p-4 md:px-5 flex items-start gap-3">
                            {/* Ikon Map Pin Merah */}
                            <div className="pt-0.5">
                                <i className="fa-solid fa-location-dot text-red-500 text-lg"></i>
                            </div>

                            {/* Teks Alamat */}
                            <div>
                                <p className="text-[13px] md:text-sm font-medium text-slate-700 leading-snug mb-0.5">
                                    {config?.alamat_instansi
                                        ? config.alamat_instansi
                                        : "Alamat Instansi Belum Diatur"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION: MONITORING UTAMA ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Card Live KBM */}
                <div className="lg:col-span-5 relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <i className="fa-solid fa-satellite-dish text-sm text-emerald-400"></i>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-300 mb-0.5">
                                        Status KBM
                                    </p>
                                    <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                        <i className="fa-solid fa-circle-check"></i>{" "}
                                        Sedang Berlangsung
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">
                                    Live
                                </span>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                <i className="fa-solid fa-server"></i>
                                <span>Terkoneksi</span>
                            </div>
                            <button
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5"
                                onClick={() => setOpen(true)}
                            >
                                <i className="fa-solid fa-desktop"></i> Pantau
                            </button>
                        </div>
                    </div>
                </div>

                {/* Card Data Monitoring */}
                <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                            <i className="fa-solid fa-chart-pie text-emerald-600 text-xs"></i>
                        </div>
                        <h2 className="text-xs font-bold text-slate-800">
                            Ringkasan Data
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {cardsMonitoring.map((m, i) => (
                            <div
                                key={i}
                                className="group relative flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:bg-white cursor-default"
                            >
                                <div className="w-8 h-8 mb-2 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all">
                                    <i
                                        className={`fas ${m.icon} text-slate-400 group-hover:text-emerald-600 text-xs transition-colors`}
                                    ></i>
                                </div>
                                <h2 className="text-lg md:text-xl font-bold text-slate-800 tabular-nums leading-none mb-0.5">
                                    {m.total}
                                </h2>
                                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600">
                                    {m.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── SECTION: AKSES CEPAT ── */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                        <i className="fa-solid fa-bolt text-emerald-600 text-xs"></i>
                    </div>
                    <h2 className="text-xs font-bold text-slate-800">
                        Akses Cepat
                    </h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {menuCepat.map((m, i) => (
                        <a
                            key={i}
                            href={m.href}
                            className="group flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                            <div
                                className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                            >
                                <i
                                    className={`fa ${m.icon} text-white text-sm`}
                                ></i>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight group-hover:text-slate-900">
                                {m.label}
                            </span>
                        </a>
                    ))}
                </div>
            </div>

            {/* ── MODAL ── */}
            <Modal show={open} onClose={() => setOpen(false)} maxWidth="full">
                <MonitoringKBM
                    title="Monitoring KBM"
                    onClose={() => setOpen(false)}
                    open={open}
                />
            </Modal>
        </div>
    );
}
