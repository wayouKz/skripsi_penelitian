import { useEffect, useState } from "react";
// Pastikan path import ini sesuai dengan struktur folder Anda
import StatCard from "../CardDashboard/StatsCard";
import Modal from "@/Components/Modal";
import { useAlert } from "@/Components/AlertContext";
import { router } from "@inertiajs/react";
import DataTable from "@/Components/Datatables";
import { header } from "framer-motion/client";
import chartRekapKehadiranSekelas from "./partials/ChartRekapKehadiranSekelas";
import ChartRekapKehadiranSekelas from "./partials/ChartRekapKehadiranSekelas";
import ChartRekapKehadiranSiswa from "./partials/ChartRekapKehadiranSiswa";
export default function GuruDashboard({
    user = { name: "Budi Santoso", nip: "19880123 201001 1 001" },
    tglStr = "Senin, 26 Jan 2026",
    guruPengganti = [],
}) {
    const [open, setOpen] = useState(false);
    const [tampungData, setTampungData] = useState(null);
    const { showAlert } = useAlert();
    const [waliKelasInfo, setWaliKelasInfo] = useState({
        nama_kelas: "",
        total_siswa_perwalian: 0,
        rekap_kehadiran: { hadir: 0, izin: 0, sakit: 0, alpa: 0 },
        persentase_kehadiran: 0,
        list_siswa_perwalian: [],
    });
    const [openChart, setOpenChart] = useState(false);
    const [tampungSiswa, setTampungSiswa] = useState(null);
    const handleTerimaPermohonan = async (id, status) => {
        try {
            const res = await axios.post(
                route("dashboard.terima-permohonan-pergantian"),
                {
                    id: id,
                    status: status,
                },
            );
            if (res.data.success == true) {
                showAlert(res.data.message, "success");
                router.reload();
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getInfoKelas();
    }, []);

    const columns = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "NISN",
            accessor: "nisn",
        },
        {
            header: "Nama",
            accessor: "nama_siswa",
        },
        {
            header: "Jenis Kelamin",
            accessor: "jenis_kelamin",
        },
        {
            header: "#",
            render(row) {
                return (
                    <div className="flex space-x-2">
                        <button
                            className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
                            onClick={() => {
                                setOpenChart(true);
                                setTampungSiswa(row);
                            }}
                        >
                            <i className="fa fa-chart-pie mr-2"></i>
                        </button>
                    </div>
                );
            },
        },
    ];
    const getInfoKelas = async () => {
        try {
            const res = await axios.get(route("dashboard.get-info-wali-kelas"));
            // Sesuai struktur API: res.data.success dan res.data.data
            console.log(res.data);
            if (res.data.success == true) {
                setWaliKelasInfo(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat info kelas:", error);
            setWaliKelasInfo({
                nama_kelas: "-",
                total_siswa_perwalian: 0,
                rekap_kehadiran: { hadir: 0, izin: 0, sakit: 0, alpa: 0 },
                persentase_kehadiran: 0,
                list_siswa_perwalian: [],
            });
        }
    };

    // Stat card dinamis yang disesuaikan dengan key dari API JSON
    const stats = [
        {
            label: "Kelas Binaan",
            value: waliKelasInfo.nama_kelas || "-",
            icon: "🏫",
        },
        {
            label: "Total Siswa",
            value: `${waliKelasInfo.total_siswa_perwalian || 0} Siswa`,
            icon: "👥",
        },
        {
            label: "Hadir Hari Ini",
            value: `${waliKelasInfo.rekap_kehadiran?.hadir || 0} Siswa`,
            icon: "✅",
        },
        {
            label: "Izin / Sakit",
            value: `${(waliKelasInfo.rekap_kehadiran?.izin || 0) + (waliKelasInfo.rekap_kehadiran?.sakit || 0)} Siswa`,
            icon: "📝",
        },
    ];

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s, i) => (
                    <StatCard key={i} {...s} />
                ))}
            </div>

            {/* ── Mid Section ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Card Wali Kelas */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-inner">
                                    <i className="fa-solid fa-chalkboard-user text-base"></i>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                        Wali Kelas{" "}
                                        {waliKelasInfo.nama_kelas || "-"}
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium">
                                        Monitoring keaktifan dan rekapitulasi
                                        kelas binaan
                                    </p>
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                Aktif
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <span className="text-xs text-slate-400 block mb-1 font-medium">
                                    Persentase Kehadiran Kelas
                                </span>
                                <div className="text-2xl font-extrabold text-slate-800">
                                    {waliKelasInfo.persentase_kehadiran}%
                                </div>
                                <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                                    {waliKelasInfo.rekap_kehadiran?.hadir || 0}{" "}
                                    dari{" "}
                                    {waliKelasInfo.total_siswa_perwalian || 0}{" "}
                                    siswa hadir
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                        <a
                            href="#"
                            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-xs flex items-center gap-1.5 hidden"
                        >
                            <i className="fa-solid fa-users-viewfinder"></i>
                            Kelola Absensi Siswa
                        </a>
                        <a
                            href="#"
                            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-1.5 hidden"
                        >
                            <i className="fa-solid fa-file-lines"></i>
                            Rekap Nilai Rapor
                        </a>
                    </div>
                </div>

                {/* Pengumuman & Pergantian Guru */}
                <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
                                <i className="fa-solid fa-bullhorn text-base"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                    Pengumuman
                                </h2>
                                <p className="text-xs text-slate-400 font-medium">
                                    Informasi dan pemberitahuan terbaru
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                            Terbaru
                        </span>
                    </div>

                    <div className="flex-1 space-y-3.5 overflow-y-auto pr-1 custom-scrollbar">
                        {guruPengganti.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">
                                Belum ada permohonan pergantian guru.
                            </p>
                        ) : (
                            guruPengganti.map((item, index) => {
                                let statusClass = "bg-amber-100 text-amber-700";
                                let statusText = item.status;

                                if (item.status === "diterima") {
                                    statusClass =
                                        "bg-emerald-100 text-emerald-700";
                                } else if (item.status === "ditolak") {
                                    statusClass = "bg-rose-100 text-rose-700";
                                }

                                return (
                                    <div
                                        key={item.id || index}
                                        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide uppercase bg-green-100 text-green-700">
                                                Pergantian Guru
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide uppercase ${statusClass}`}
                                            >
                                                {statusText}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                                <i className="fa-regular fa-clock"></i>{" "}
                                                {item.jam_mulai?.slice(0, 5)} -{" "}
                                                {item.jam_selesai?.slice(0, 5)}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                            {item.nama_mapel} — Kelas{" "}
                                            {item.nama_kelas}
                                        </h3>

                                        <div className="mt-2 text-xs text-slate-600 space-y-1">
                                            <p className="flex items-center gap-1.5">
                                                <i className="fa-solid fa-user-tie text-slate-400 shrink-0"></i>
                                                <span>
                                                    Menggantikan:{" "}
                                                    <strong className="text-slate-700">
                                                        {item.nama_guru_asli ||
                                                            "-"}
                                                    </strong>
                                                </span>
                                            </p>
                                            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                <i className="fa-solid fa-calendar-days shrink-0"></i>
                                                <span>
                                                    Tanggal:{" "}
                                                    {item.tanggal_pergantian}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="flex justify-end mt-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOpen(true);
                                                    setTampungData(item);
                                                }}
                                                className="bg-green-200 text-green-700 py-1 px-4 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-green-300 transition-colors"
                                            >
                                                <i className="fa-solid fa-eye"></i>{" "}
                                                Detail
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Detail & Konfirmasi Pergantian */}
            <Modal
                show={open}
                closable={true}
                maxWidth="md"
                onClose={() => {
                    setOpen(false);
                }}
            >
                <div className="flex flex-col bg-white rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                                <i className="fa-solid fa-calendar-check text-sm"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 leading-tight">
                                    Terima Permohonan Pergantian Jadwal
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                    Konfirmasi persetujuan jadwal untuk{" "}
                                    {tampungData?.nama_mapel}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-all flex items-center justify-center cursor-pointer"
                            onClick={() => {
                                setOpen(false);
                            }}
                        >
                            <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Apakah Anda yakin ingin menerima permohonan
                            pergantian jadwal ini? Tindakan ini akan memperbarui
                            jadwal mengajar secara otomatis di sistem selama
                            tanggal yang ditentukan.
                        </p>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">
                                    Mata Pelajaran:
                                </span>
                                <span className="font-bold text-slate-800">
                                    {tampungData?.nama_mapel || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Kelas:</span>
                                <span className="font-bold text-slate-800">
                                    {tampungData?.nama_kelas || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">
                                    Tanggal / Jam:
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {tampungData?.tanggal_pergantian} (
                                    {tampungData?.jam_mulai?.substring(0, 5)} -{" "}
                                    {tampungData?.jam_selesai?.substring(0, 5)})
                                </span>
                            </div>
                        </div>
                    </div>

                    {tampungData?.status === "menunggu" ? (
                        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button
                                type="button"
                                className="px-4 py-2 text-xs font-semibold bg-red-100 border border-red-200 text-red-600 rounded-xl hover:bg-red-200 transition-all cursor-pointer"
                                onClick={() => {
                                    setOpen(false);
                                    handleTerimaPermohonan(
                                        tampungData.id,
                                        "ditolak",
                                    );
                                }}
                            >
                                Tolak
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                onClick={() => {
                                    setOpen(false);
                                    handleTerimaPermohonan(
                                        tampungData.id,
                                        "diterima",
                                    );
                                }}
                            >
                                <i className="fa-solid fa-check text-[10px]"></i>
                                Ya, Terima Jadwal
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <span className="px-4 py-2 text-xs font-semibold text-green-600 bg-green-100 rounded-xl shadow-xs flex items-center gap-1.5">
                                <i className="fa-solid fa-check text-[10px]"></i>
                                {tampungData?.status == "diterima"
                                    ? "Diterima"
                                    : "Ditolak"}
                            </span>
                        </div>
                    )}
                </div>
            </Modal>
            <div className="flex gap-2">
                <div className="w-1/2">
                    <ChartRekapKehadiranSekelas
                        rekapKehadiran={waliKelasInfo.rekap_kehadiran}
                    />
                </div>
                <div className="w-1/2">
                    <DataTable
                        columns={columns}
                        data={waliKelasInfo.list_siswa_perwalian}
                    />
                </div>
            </div>
            <Modal show={openChart} maxWidth="2xl">
                <div className="flex flex-col bg-white rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                                <i className="fa-solid fa-chart-pie text-sm"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 leading-tight">
                                    {tampungSiswa?.nama_siswa}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                    Nisn: {tampungSiswa?.nisn}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-all flex items-center justify-center cursor-pointer"
                            onClick={() => {
                                setOpenChart(false);
                            }}
                        >
                            <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>
                    <ChartRekapKehadiranSiswa siswa={tampungSiswa} />
                </div>
            </Modal>
        </div>
    );
}
