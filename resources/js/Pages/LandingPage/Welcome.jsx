import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import DynamicTiltCard from "../Partials/DynamicTiltCard";
import Reveal from "./Partials/Reveal";
import Statistics from "./Partials/Statistics";

const Icon = {
    check: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            {...p}
        >
            <path d="M20 6L9 17l-5-5" />
        </svg>
    ),
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

export default function Welcome({
    auth,
    totalGuru = 0,
    totalSiswa = 0,
    totalMapel = 0,
}) {
    const config = usePage().props.config ?? {
        logo_instansi: "img/logo-default.png",
        nama_instansi: "Man 1 Kota Gorontalo",
    };
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
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
                className="bg-[#0c4a4c] text-[#9dbdba] min-h-screen"
                style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
            >
                <style>{`
                    .font-serif-display { font-family: 'Fraunces', Georgia, serif; }
                    .font-mono-ui { font-family: 'IBM Plex Mono', monospace; }
                    .eyebrow::before { content:''; width:18px; height:1px; background:#10b981; display:inline-block; }
                `}</style>

                {/* ================= NAV ================= */}
                <header
                    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                        scrolled
                            ? "py-3.5 bg-[#0c4a4c]/95 backdrop-blur-md border-b border-white/10 shadow-lg"
                            : "py-5 border-b border-transparent"
                    }`}
                >
                    <div className="max-w-[1180px] mx-auto px-5 md:px-7 flex items-center justify-between">
                        <a
                            href="#"
                            className="flex items-center gap-2.5 font-serif-display text-xl font-bold text-[#eafaf3]"
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
                        </a>

                        <nav className="hidden md:flex gap-9 items-center">
                            {[
                                ["Overview", "#fitur"],
                                ["Statistik", "#statistik"],
                            ].map(([label, href]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="text-sm text-[#9dbdba] hover:text-[#eafaf3] transition-colors relative group"
                                >
                                    {label}
                                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#10b981] group-hover:w-full transition-all duration-300" />
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3.5">
                            {auth?.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-[#eafaf3] border border-white/20 hover:border-[#34d399] hover:text-[#34d399] transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route("login")}
                                    className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-[#eafaf3] bg-[#10b981] hover:bg-[#059669] shadow-sm transition-all"
                                >
                                    Masuk
                                </Link>
                            )}
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className="md:hidden text-[#eafaf3] text-2xl leading-none"
                                aria-label="Buka menu"
                            >
                                ☰
                            </button>
                        </div>
                    </div>
                </header>

                <main>
                    {/* ================= HERO ================= */}
                    <section className="relative pt-[150px] md:pt-[172px] pb-20 md:pb-[120px] overflow-hidden">
                        <div
                            className="absolute inset-x-0 -top-24 h-[600px] pointer-events-none"
                            style={{
                                background:
                                    "radial-gradient(ellipse 700px 400px at 18% 10%, rgba(13,148,136,0.22), transparent 70%), radial-gradient(ellipse 600px 400px at 85% 0%, rgba(16,185,129,0.18), transparent 70%)",
                            }}
                        />
                        <div className="relative z-10 max-w-[1180px] mx-auto px-5 md:px-7 grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-14 md:gap-[60px] items-center">
                            <div>
                                <span className="eyebrow font-mono-ui text-xs tracking-[0.14em] uppercase text-[#34d399] inline-flex items-center gap-2.5 mb-2">
                                    Sistem Informasi Akademik
                                </span>
                                <h1 className="font-serif-display font-semibold text-[#eafaf3] leading-[1.08] text-[34px] md:text-[54px] mt-3 mb-5">
                                    {config.nama_instansi}
                                </h1>
                                <p className="text-[16px] text-[#9dbdba] leading-relaxed max-w-[480px]">
                                    Platform terpadu untuk pengelolaan data
                                    akademik, pemantauan jadwal, serta
                                    rekapitulasi nilai siswa dan kinerja guru
                                    secara efisien.
                                </p>
                            </div>

                            <DynamicTiltCard />
                        </div>
                    </section>

                    {/* ================= STATS ================= */}
                    <div
                        id="statistik"
                        className="bg-[#083537] border-t border-b border-white/10 shadow-inner"
                    >
                        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
                            <Statistics
                                totalGuru={totalGuru}
                                totalSiswa={totalSiswa}
                                totalMapel={totalMapel}
                            />
                        </div>
                    </div>

                    {/* ================= FITUR ================= */}
                    <section id="fitur" className="py-24 md:py-[120px]">
                        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
                            <Reveal className="max-w-[640px] mb-14 md:mb-16">
                                <span className="eyebrow font-mono-ui text-xs tracking-[0.14em] uppercase text-[#34d399] mb-2">
                                    Fitur Utama
                                </span>
                                <h2 className="font-serif-display text-[28px] md:text-4xl text-[#eafaf3] mt-3 leading-tight">
                                    Setiap bagian administrasi, dalam satu ruang
                                    kerja.
                                </h2>
                            </Reveal>

                            <Reveal
                                as="div"
                                className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-xl"
                            >
                                {FEATURES.map((f) => (
                                    <div
                                        key={f.title}
                                        className="bg-[#0c4a4c] hover:bg-[#0f595b] transition-colors p-8 md:p-9"
                                    >
                                        <f.icon className="w-9 h-9 text-[#34d399] mb-5" />
                                        <h3 className="text-lg text-[#eafaf3] font-serif-display mb-2.5">
                                            {f.title}
                                        </h3>
                                        <p className="text-[14.5px] text-[#9dbdba] leading-relaxed">
                                            {f.desc}
                                        </p>
                                    </div>
                                ))}
                            </Reveal>
                        </div>
                    </section>
                </main>

                {/* ================= FOOTER ================= */}
                <footer className="pt-16 pb-8 border-t border-white/10 bg-[#083537]">
                    <div className="max-w-[1180px] mx-auto px-5 md:px-7 text-center">
                        <div className="text-emerald-100/70 text-xs font-medium tracking-wide">
                            &copy; {currentYear} Aplikasi by INFORMATIKA UNG
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
