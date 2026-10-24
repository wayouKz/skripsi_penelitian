import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import DynamicTiltCard from "../Partials/DynamicTiltCard";
import Reveal from "./Partials/Reveal";
import Statistics from "./Partials/Statistics";

const Icon = {
    users: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            {...p}
        >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    ),
    calendar: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            {...p}
        >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    ),
    grade: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            {...p}
        >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
    ),
};

const FEATURES = [
    {
        icon: Icon.users,
        title: "Manajemen Siswa & Guru",
        desc: "Data induk terpusat lengkap dengan riwayat kelas, mutasi, dan berkas kepegawaian — tanpa spreadsheet terpisah-pisah.",
    },
    {
        icon: Icon.calendar,
        title: "Jadwal & Presensi",
        desc: "Jadwal pelajaran tersusun otomatis, dan pengelolaan presensi siswa.",
    },
    {
        icon: Icon.grade,
        title: "Nilai",
        desc: "Input nilai per kompetensi dasar, rapor digital yang bisa langsung dicetak atau diunduh sebagai PDF resmi.",
    },
];

export default function Welcome({ auth, data }) {
    const config = usePage().props.config ?? {
        logo_instansi: "img/logo-default.png",
        nama_instansi: "Man 1 Kota Gorontalo",
    };
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <Head title={config.nama_instansi + ` Sistem Informasi Akademik`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="bg-white text-primary-800 min-h-screen"
                style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
            >
                <style>{`
                    .font-serif-display { font-family: 'Fraunces', Georgia, serif; }
                    .font-mono-ui { font-family: 'IBM Plex Mono', monospace; }
                    .eyebrow::before { content:''; width:18px; height:1px; background:currentColor; display:inline-block; }
                `}</style>

                {/* ================= NAV ================= */}
                <header
                    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                        scrolled
                            ? "py-3.5 bg-white/90 backdrop-blur-md border-b border-primary-100 shadow-sm"
                            : "py-5 border-b border-transparent"
                    }`}
                >
                    <div className="max-w-[1180px] mx-auto px-5 md:px-7 flex items-center justify-between">
                        <Link
                            href={route("welcome")}
                            className="flex items-center gap-2.5 font-serif-display text-xl font-bold text-primary-900"
                        >
                            <img
                                src={
                                    `/storage/public/logo/` +
                                    config.logo_instansi
                                }
                                alt="Logo Utama"
                                className="h-8 w-auto object-contain"
                            />
                            <span>{config.nama_instansi}</span>
                        </Link>

                        <nav className="hidden md:flex gap-1 items-center">
                            {[
                                ["Overview", "#fitur"],
                                ["Statistik", "#statistik"],
                            ].map(([label, href]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="text-sm text-primary  p-2 hover:text-primary-900 transition-colors relative group"
                                >
                                    {label}
                                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary-500 group-hover:w-full transition-all duration-300" />
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3.5">
                            {auth?.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-primary-800 border border-primary-300 hover:bg-primary-100 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route("login")}
                                    className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors"
                                >
                                    Masuk
                                </Link>
                            )}
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className="md:hidden text-primary-900 text-2xl leading-none"
                                aria-label="Buka menu"
                            >
                                ☰
                            </button>
                        </div>
                    </div>
                    {menuOpen && (
                        <div className="md:hidden border-t border-primary-100 bg-white">
                            <div className="max-w-[1180px] mx-auto px-5 py-4 flex flex-col gap-1">
                                {[
                                    ["Overview", "#fitur"],
                                    ["Statistik", "#statistik"],
                                ].map(([label, href]) => (
                                    <a
                                        key={href}
                                        href={href}
                                        onClick={() => setMenuOpen(false)}
                                        className="px-3 py-3 rounded-lg text-sm font-medium text-white hover:bg-primary-50 hover:text-primary-900 transition-colors"
                                    >
                                        {label}
                                    </a>
                                ))}

                                {auth?.user ? (
                                    <Link
                                        href={route("dashboard")}
                                        className="mt-2 inline-flex justify-center px-5 py-3 rounded-full text-sm font-semibold text-primary-800 border border-primary-300 hover:bg-primary-100 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={route("login")}
                                        className="mt-2 inline-flex justify-center px-5 py-3 rounded-full text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors"
                                    >
                                        Masuk
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <main>
                    {/* ================= HERO ================= */}
                    <section className="relative pt-[150px] md:pt-[172px] pb-20 md:pb-[120px] overflow-hidden bg-primary-200">
                        <div className="absolute inset-0 pointer-events-none" />
                        <div className="relative z-10 max-w-[1180px] mx-auto px-5 md:px-7 grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-14 md:gap-[60px] items-center">
                            <div>
                                <span className="eyebrow font-mono-ui text-xs tracking-[0.14em] uppercase text-primary-700 inline-flex items-center gap-2.5 mb-2">
                                    Sistem Informasi Akademik
                                </span>
                                <h1 className="font-serif-display font-semibold text-primary-900 leading-[1.08] text-[34px] md:text-[54px] mt-3 mb-5">
                                    {config.nama_instansi}
                                </h1>
                                <p className="text-[16px] text-primary-950/70 leading-relaxed max-w-[480px]">
                                    Platform terpadu untuk pengelolaan data
                                    akademik, pemantauan jadwal, serta
                                    rekapitulasi nilai siswa dan kinerja guru
                                    secara efisien.
                                </p>
                                {!auth?.user && (
                                    <Link
                                        href={route("login")}
                                        className="inline-flex mt-8 px-7 py-3 rounded-full text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-600/20 transition-colors"
                                    >
                                        Masuk ke sistem
                                    </Link>
                                )}
                            </div>

                            <DynamicTiltCard />
                        </div>
                    </section>

                    {/* ================= STATS ================= */}
                    <div
                        id="statistik"
                        className="bg-primary-100 border-y border-primary-200"
                    >
                        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
                            <Statistics
                                totalGuru={data.totalGuru}
                                totalSiswa={data.totalSiswa}
                                totalMapel={data.totalMapel}
                                dataSiswa={data.dataSiswa}
                                dataGuru={data.dataGuru}
                                dataJadwal={data.dataJadwal}
                                dataMapel={data.dataMapel}
                                dataGuruMapel={data.dataGuruMapel}
                            />
                        </div>
                    </div>

                    {/* ================= FITUR ================= */}
                    <section
                        id="fitur"
                        className="py-24 md:py-[120px] bg-white"
                    >
                        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
                            <Reveal className="max-w-[640px] mb-14 md:mb-16">
                                <span className="eyebrow font-mono-ui text-xs tracking-[0.14em] uppercase text-primary-700 inline-flex items-center gap-2.5 mb-2">
                                    Fitur Utama
                                </span>
                                <h2 className="font-serif-display text-[28px] md:text-4xl text-primary-900 mt-3 leading-tight">
                                    Setiap bagian administrasi, dalam satu ruang
                                    kerja.
                                </h2>
                            </Reveal>

                            <Reveal
                                as="div"
                                className="grid grid-cols-1 md:grid-cols-3 gap-px bg-primary-100 border border-primary-100 rounded-2xl overflow-hidden shadow-[0_20px_50px_-25px_rgba(5,150,105,0.35)]"
                            >
                                {FEATURES.map((f) => (
                                    <div
                                        key={f.title}
                                        className="bg-white hover:bg-primary-50 transition-colors p-8 md:p-9"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-5">
                                            <f.icon className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-lg text-primary-900 font-serif-display font-semibold mb-2.5">
                                            {f.title}
                                        </h3>
                                        <p className="text-[14.5px] text-primary-600 leading-relaxed">
                                            {f.desc}
                                        </p>
                                    </div>
                                ))}
                            </Reveal>
                        </div>
                    </section>
                </main>

                {/* ================= FOOTER ================= */}
                <footer className="pt-16 pb-8 bg-primary-50 border-t border-primary-100">
                    <div className="max-w-[1180px] mx-auto px-5 md:px-7 text-center">
                        <div className="text-primary-900/60 text-xs font-medium tracking-wide">
                            &copy; {currentYear} Aplikasi by INFORMATIKA UNG
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
