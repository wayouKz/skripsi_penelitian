import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import DynamicTiltCard from "./Partials/DynamicTiltCard";

/* ---------- ikon kecil (inline, tanpa dependency) ---------- */
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
    finance: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            {...p}
        >
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <path d="M1 10h22" />
        </svg>
    ),
    book: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            {...p}
        >
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
    ),
    family: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            {...p}
        >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
    ),
};

/* ---------- data konten ---------- */
const FEATURES = [
    {
        icon: Icon.users,
        title: "Manajemen Siswa & Guru",
        desc: "Data induk terpusat lengkap dengan riwayat kelas, mutasi, dan berkas kepegawaian — tanpa spreadsheet terpisah-pisah.",
    },
    {
        icon: Icon.calendar,
        title: "Jadwal & Presensi",
        desc: "Jadwal pelajaran tersusun otomatis, presensi via QR atau wajah, dan notifikasi ketidakhadiran langsung ke orang tua.",
    },
    {
        icon: Icon.grade,
        title: "Nilai & Rapor",
        desc: "Input nilai per kompetensi dasar, rapor digital yang bisa langsung dicetak atau diunduh sebagai PDF resmi.",
    },
    {
        icon: Icon.finance,
        title: "Keuangan & SPP",
        desc: "Tagihan terbit otomatis tiap bulan, riwayat pembayaran tercatat rapi, laporan keuangan siap audit kapan saja.",
    },
    {
        icon: Icon.book,
        title: "Perpustakaan Digital",
        desc: "Katalog buku, peminjaman otomatis, dan koleksi e-book yang bisa diakses siswa langsung dari akun mereka.",
    },
    {
        icon: Icon.family,
        title: "Portal Orang Tua & Siswa",
        desc: "Pantau nilai, jadwal, presensi, dan tagihan secara langsung lewat aplikasi — tanpa perlu bertanya ke wali kelas.",
    },
];

const STATS = [
    { value: 120, decimals: 0, suffix: "+", label: "Sekolah & Kampus" },
    { value: 85000, decimals: 0, suffix: "+", label: "Siswa Terkelola" },
    { value: 99.9, decimals: 1, suffix: "%", label: "Uptime Sistem" },
    { value: 4.8, decimals: 1, suffix: "/5", label: "Rating Pengguna" },
];

const TESTIMONIALS = [
    {
        quote: "Sejak pakai Almanak, proses rapor yang dulu makan waktu dua minggu sekarang selesai dalam dua hari.",
        name: "Ratna Dewi",
        role: "Kepala Sekolah, SMA Cendekia Nusantara",
        initials: "RD",
    },
    {
        quote: "Orang tua jadi lebih tenang karena bisa pantau nilai dan presensi anak langsung dari ponsel.",
        name: "Bagus Santoso",
        role: "Wakil Rektor, Politeknik Warna Bangsa",
        initials: "BS",
    },
];

const PLANS = [
    {
        name: "Sekolah",
        desc: "Untuk SD, SMP, dan SMA dengan satu unit sekolah.",
        price: "Rp750rb",
        unit: "/bulan",
        featured: false,
        items: [
            "Hingga 500 siswa",
            "Modul nilai, presensi, jadwal",
            "Portal orang tua",
        ],
        cta: "Pilih Paket",
    },
    {
        name: "Kampus",
        desc: "Untuk politeknik dan universitas multi-fakultas.",
        price: "Rp2,4jt",
        unit: "/bulan",
        featured: true,
        items: [
            "Hingga 5.000 mahasiswa",
            "KRS & KHS otomatis",
            "Keuangan & SPP terintegrasi",
            "Dukungan prioritas 24/7",
        ],
        cta: "Pilih Paket",
    },
    {
        name: "Enterprise",
        desc: "Untuk yayasan dengan banyak unit sekolah/kampus.",
        price: "Kustom",
        unit: "",
        featured: false,
        items: [
            "Siswa tanpa batas",
            "Integrasi API & SSO",
            "Manajer akun khusus",
        ],
        cta: "Hubungi Kami",
    },
];

const TRUST = [
    "SMA Cendekia Nusantara",
    "Politeknik Warna Bangsa",
    "Universitas Garuda Mandiri",
    "SMK Bina Karya",
    "Yayasan Pelita Ilmu",
];

/* ---------- komponen kecil ---------- */
function Reveal({ as: Tag = "div", className = "", children }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setVisible(true);
            return;
        }
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.unobserve(el);
                }
            },
            { threshold: 0.15 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
        >
            {children}
        </Tag>
    );
}

function Counter({ value, decimals = 0, suffix = "" }) {
    const ref = useRef(null);
    const [display, setDisplay] = useState(decimals > 0 ? "0.0" : "0");
    const done = useRef(false);

    useEffect(() => {
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || done.current) return;
                done.current = true;
                const duration = reduceMotion ? 0 : 1400;
                const start = performance.now();
                function tick(now) {
                    const p =
                        duration === 0
                            ? 1
                            : Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    const val = value * eased;
                    setDisplay(
                        decimals > 0
                            ? val.toFixed(decimals)
                            : Math.round(val).toLocaleString("id-ID"),
                    );
                    if (p < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                io.unobserve(el);
            },
            { threshold: 0.5 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [value, decimals]);

    return (
        <span ref={ref}>
            {display}
            {suffix}
        </span>
    );
}

/* ---------- komponen utama ---------- */
export default function Welcome({ auth }) {
    const config = usePage().props.config ?? {
        logo_instansi: "img/logo-default.png",
        nama_instansi: "Universitas Negeri Gorontalo",
    };
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [tilt, setTilt] = useState({ rx: -4, tx: 0, ty: 0 });
    const stageRef = useRef(null);

    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleMouseMove = (e) => {
        if (!stageRef.current || window.innerWidth < 901) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        const rect = stageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ rx: -4 + x * 5, tx: x * 8, ty: y * 8 });
    };
    const handleMouseLeave = () => setTilt({ rx: -4, tx: 0, ty: 0 });

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
                className="bg-[#0a2f31] text-[#9dbdba] min-h-screen"
                style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
            >
                <style>{`
                    .font-serif-display { font-family: 'Fraunces', Georgia, serif; }
                    .font-mono-ui { font-family: 'IBM Plex Mono', monospace; }
                    .eyebrow::before { content:''; width:18px; height:1px; background:#22c55e; display:inline-block; }
                    .dashed-line { background-image: linear-gradient(to right, rgba(234,250,243,0.12) 60%, transparent 0%); background-size: 14px 1px; background-repeat: repeat-x; }
                    .perforation::after { content:''; position:absolute; left:-1px; top:16px; bottom:16px; width:2px; background-image: radial-gradient(circle, #0a2f31 2px, transparent 2.2px); background-size: 2px 12px; opacity:0.12; }
                `}</style>

                {/* ================= NAV ================= */}
                <header
                    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                        scrolled
                            ? "py-3.5 bg-[#0a2f31]/90 backdrop-blur-md border-b border-white/10"
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
                                ["Fitur", "#fitur"],
                                ["Testimoni", "#testimoni"],
                                ["Tentang", "#tentang"],
                            ].map(([label, href]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="text-sm text-[#9dbdba] hover:text-[#eafaf3] transition-colors relative group"
                                >
                                    {label}
                                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#22c55e] group-hover:w-full transition-all duration-300" />
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3.5">
                            {auth?.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-[#eafaf3] border border-white/10 hover:border-[#86efac] hover:text-[#86efac] transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route("login")}
                                        className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-[#eafaf3] border border-white/10 hover:border-[#86efac] hover:text-[#86efac] transition-colors"
                                    >
                                        Masuk
                                    </Link>
                                </>
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

                    {menuOpen && (
                        <div className="md:hidden mt-4 mx-5 flex flex-col gap-5 bg-[#0a2f31] border border-white/10 rounded-xl p-6">
                            {[
                                ["Fitur", "#fitur"],
                                ["Testimoni", "#testimoni"],
                                ["Tentang", "#tentang"],
                            ].map(([label, href]) => (
                                <a
                                    key={href}
                                    href={href}
                                    onClick={() => setMenuOpen(false)}
                                    className="text-sm text-[#eafaf3]"
                                >
                                    {label}
                                </a>
                            ))}
                        </div>
                    )}
                </header>

                <main>
                    {/* ================= HERO ================= */}
                    <section className="relative pt-[150px] md:pt-[172px] pb-20 md:pb-[120px] overflow-hidden">
                        <div
                            className="absolute inset-x-0 -top-24 h-[600px] pointer-events-none"
                            style={{
                                background:
                                    "radial-gradient(ellipse 700px 400px at 18% 10%, rgba(13,148,136,0.18), transparent 70%), radial-gradient(ellipse 600px 400px at 85% 0%, rgba(34,197,94,0.14), transparent 70%)",
                            }}
                        />
                        <div className="relative z-10 max-w-[1180px] mx-auto px-5 md:px-7 grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-14 md:gap-[60px] items-center">
                            <div>
                                <span className="eyebrow font-mono-ui text-xs tracking-[0.14em] uppercase text-[#86efac] inline-flex items-center gap-2.5">
                                    Sistem Informasi Akademik
                                </span>
                                <h1 className="font-serif-display font-semibold text-[#eafaf3] leading-[1.08] text-[34px] md:text-[54px] mt-5 mb-5">
                                    Rapor, jadwal, dan presensi —{" "}
                                    <em className="italic text-[#5eead4] not-italic md:italic">
                                        beres dalam satu sistem.
                                    </em>
                                </h1>
                                <p className="text-[17px] text-[#9dbdba] max-w-[480px] mb-8">
                                    Almanak merapikan seluruh administrasi
                                    akademik sekolah dan kampus Anda: dari kartu
                                    rencana studi hingga rapor akhir semester,
                                    semua tercatat rapi dan bisa diakses kapan
                                    saja, oleh siapa saja yang berhak.
                                </p>
                            </div>

                            {/* transcript card */}
                            <DynamicTiltCard />
                        </div>
                    </section>

                    {/* ================= TRUST ================= */}
                    <div className="border-t border-b border-white/10 py-8">
                        <div className="max-w-[1180px] mx-auto px-5 md:px-7 flex items-center gap-10 flex-wrap justify-between">
                            <span className="font-mono-ui text-xs tracking-wider uppercase text-[#9dbdba] whitespace-nowrap">
                                Dipercaya 120+ sekolah &amp; kampus
                            </span>
                            <div className="flex gap-9 flex-wrap items-center">
                                {TRUST.map((name) => (
                                    <span
                                        key={name}
                                        className="font-serif-display text-base text-[#9dbdba] opacity-60 hover:opacity-100 hover:text-[#86efac] transition-opacity"
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ================= FITUR ================= */}
                    <section id="fitur" className="py-24 md:py-[120px]">
                        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
                            <Reveal className="max-w-[640px] mb-14 md:mb-16">
                                <span className="eyebrow font-mono-ui text-xs tracking-[0.14em] uppercase text-[#86efac]">
                                    Fitur
                                </span>
                                <h2 className="font-serif-display text-[28px] md:text-4xl text-[#eafaf3] mt-4 leading-tight">
                                    Setiap bagian administrasi, dalam satu ruang
                                    kerja.
                                </h2>
                                <p className="text-[#9dbdba] text-base mt-4 max-w-[540px]">
                                    Almanak dirancang mengikuti alur kerja
                                    sekolah dan kampus sehari-hari — bukan
                                    sebaliknya. Setiap modul saling terhubung,
                                    jadi data hanya perlu dimasukkan sekali.
                                </p>
                            </Reveal>

                            <Reveal
                                as="div"
                                className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden"
                            >
                                {FEATURES.map((f) => (
                                    <div
                                        key={f.title}
                                        className="bg-[#0a2f31] hover:bg-[#0f3d3f] transition-colors p-8 md:p-9"
                                    >
                                        <f.icon className="w-9 h-9 text-[#86efac] mb-5" />
                                        <h3 className="text-lg text-[#eafaf3] font-serif-display mb-2.5">
                                            {f.title}
                                        </h3>
                                        <p className="text-[14.5px] text-[#9dbdba]">
                                            {f.desc}
                                        </p>
                                    </div>
                                ))}
                            </Reveal>
                        </div>
                    </section>

                    {/* ================= STATS ================= */}
                    <div className="bg-[#0f3d3f] border-t border-b border-white/10">
                        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
                            <div className="grid grid-cols-2 md:grid-cols-4">
                                {STATS.map((s, i) => (
                                    <Reveal
                                        key={s.label}
                                        className={`py-12 md:py-14 px-5 text-center ${i !== 0 ? "border-l border-white/10" : ""} ${
                                            i === 2
                                                ? "border-l-0 md:border-l"
                                                : ""
                                        }`}
                                    >
                                        <div className="font-serif-display text-3xl md:text-[44px] text-[#86efac] font-semibold">
                                            <Counter
                                                value={s.value}
                                                decimals={s.decimals}
                                                suffix={s.suffix}
                                            />
                                        </div>
                                        <div className="font-mono-ui text-xs tracking-wider text-[#9dbdba] mt-2.5 uppercase">
                                            {s.label}
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ================= TESTIMONI ================= */}

                    {/* ================= PRICING ================= */}
                    <section id="tentang" className="py-24 md:py-[120px]">
                        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
                            <Reveal className="max-w-[640px] mb-14 md:mb-16">
                                <span className="eyebrow font-mono-ui text-xs tracking-[0.14em] uppercase text-[#86efac]">
                                    Tentang
                                </span>
                                <h2 className="font-serif-display text-[28px] md:text-4xl text-[#eafaf3] mt-4 leading-tight">
                                    Aplikasi Ini Dirancang Untuk Membantu
                                    Manajemen Akademik Dan Pemantauan Kelas
                                    Belajar Mengajar Siswa Dan Guru
                                </h2>
                            </Reveal>
                        </div>
                    </section>

                    {/* ================= CTA ================= */}
                    <section className="pb-24 md:pb-[120px]">
                        <Reveal className="relative overflow-hidden text-center rounded-3xl border border-white/10 bg-[#0f3d3f] mx-5 md:mx-7 px-8 md:px-16 py-14 md:py-[70px]">
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background:
                                        "radial-gradient(ellipse 500px 260px at 50% 0%, rgba(34,197,94,0.18), transparent 70%)",
                                }}
                            />
                            <h2 className="relative font-serif-display text-[26px] md:text-[38px] text-[#eafaf3]">
                                Siap merapikan administrasi akademik Anda?
                            </h2>
                            <p className="relative text-[#9dbdba] mt-4 mb-8 max-w-[460px] mx-auto">
                                Coba Almanak gratis selama 14 hari. Tim kami
                                akan bantu pindahkan data sekolah atau kampus
                                Anda tanpa biaya.
                            </p>
                            <div className="relative flex gap-3.5 justify-center flex-wrap">
                                <Link
                                    href={
                                        auth?.user
                                            ? route("dashboard")
                                            : route("register")
                                    }
                                    className="inline-flex items-center justify-center px-7 py-4 rounded-full text-[15px] font-semibold bg-[#22c55e] text-[#0a2f31] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-8px_rgba(34,197,94,0.5)] transition-all"
                                >
                                    Mulai Sekarang
                                </Link>
                                <a
                                    href="#"
                                    className="inline-flex items-center justify-center px-6.5 py-3.5 rounded-full text-[15px] font-semibold text-[#eafaf3] border border-white/10 hover:border-[#5eead4] hover:text-[#5eead4] transition-colors"
                                >
                                    Jadwalkan Demo
                                </a>
                            </div>
                        </Reveal>
                    </section>
                </main>

                {/* ================= FOOTER ================= */}
                <footer className="pt-20 pb-8">
                    <div className="max-w-[1180px] mx-auto px-5 md:px-7">
                        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-14">
                            <div>
                                <a
                                    href="#"
                                    className="flex items-center gap-2.5 font-serif-display text-xl font-bold text-[#eafaf3] mb-3.5"
                                ></a>
                                <p className="text-[13.5px] max-w-[260px] text-[#9dbdba]">
                                    Sistem informasi akademik untuk sekolah dan
                                    kampus di seluruh Indonesia.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-mono-ui text-[11.5px] tracking-wider uppercase text-[#eafaf3] mb-4.5">
                                    Produk
                                </h5>
                                <ul className="space-y-1.5">
                                    <li>
                                        <a
                                            href="#fitur"
                                            className="text-sm text-[#9dbdba] hover:text-[#86efac] transition-colors"
                                        >
                                            Fitur
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#tentang"
                                            className="text-sm text-[#9dbdba] hover:text-[#86efac] transition-colors"
                                        >
                                            Tentang
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-mono-ui text-[11.5px] tracking-wider uppercase text-[#eafaf3] mb-4.5">
                                    Perusahaan
                                </h5>
                                <ul className="space-y-1.5">
                                    <li>
                                        <a
                                            href="#"
                                            className="text-sm text-[#9dbdba] hover:text-[#86efac] transition-colors"
                                        >
                                            Tentang Kami
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-sm text-[#9dbdba] hover:text-[#86efac] transition-colors"
                                        >
                                            Karier
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-sm text-[#9dbdba] hover:text-[#86efac] transition-colors"
                                        >
                                            Blog
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-mono-ui text-[11.5px] tracking-wider uppercase text-[#eafaf3] mb-4.5">
                                    Bantuan
                                </h5>
                                <ul className="space-y-1.5">
                                    <li>
                                        <a
                                            href="#"
                                            className="text-sm text-[#9dbdba] hover:text-[#86efac] transition-colors"
                                        >
                                            Pusat Bantuan
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-sm text-[#9dbdba] hover:text-[#86efac] transition-colors"
                                        >
                                            Hubungi Kami
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-sm text-[#9dbdba] hover:text-[#86efac] transition-colors"
                                        >
                                            Status Sistem
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        {/* BAGIAN BAWAH: Footer Copyright */}
                        <div className="relative z-10 py-6 text-center text-green-100/80 text-xs font-medium tracking-wide">
                            &copy; {currentYear} Aplikasi SIM Akademik by
                            INFORMATIKA UNG
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
