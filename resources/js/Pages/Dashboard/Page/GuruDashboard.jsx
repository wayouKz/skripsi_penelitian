import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import StatCard from "../CardDashboard/StatsCard";
import Modal from "@/Components/Modal";
import DataTable from "@/Components/Datatables";

import ChartRekapKehadiranSekelas from "./partials/ChartRekapKehadiranSekelas";
import ChartRekapKehadiranSiswa from "./partials/ChartRekapKehadiranSiswa";
import ModalPdf from "@/Components/ModalPdf";

/* ============================================================
 * DEFAULT DATA (dipakai guru mapel & wali kelas)
 * ============================================================ */

const INFO_KOSONG = {
    nama_kelas: "",
    total_siswa_perwalian: 0,
    rekap_kehadiran: { hadir: 0, izin: 0, sakit: 0, alpa: 0 },
    persentase_kehadiran: 0,
    list_siswa_perwalian: [],

    /* Data kehadiran guru */
    total_absen_guru: 0,
    total_hadir_guru: 0,
    persentase_kehadiran_guru: 0,
};

/* ============================================================
 * HELPER: hitung ringkasan kehadiran guru
 * ============================================================ */

function hitungKehadiranGuru(info) {
    const persentase = Number(info?.persentase_kehadiran_guru || 0);
    const totalAbsen = Number(info?.total_absen_guru || 0);
    const totalHadir = Number(info?.total_hadir_guru || 0);
    const totalTidakHadir = Math.max(totalAbsen - totalHadir, 0);

    return { persentase, totalAbsen, totalHadir, totalTidakHadir };
}

/* ============================================================
 * HERO SECTION
 * ============================================================ */

function HeroSection({ user, tglStr, peran }) {
    return (
        <div className="relative bg-gradient-to-r from-green-700 to-green-900 rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
                <div>
                    <p className="text-emerald-100 text-sm md:text-base font-medium mb-2 tracking-wide uppercase">
                        Selamat datang kembali 👋
                    </p>

                    <h1 className="text-3xl md:text-2xl font-extrabold mb-4 tracking-tight">
                        {user?.name || "-"}
                    </h1>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 text-sm text-emerald-50 bg-emerald-800/50 backdrop-blur-sm rounded-lg border border-emerald-500/30">
                            NIP: {user?.nip || "-"}
                        </span>

                        <span className="inline-flex items-center px-3 py-1 text-sm text-emerald-50 bg-emerald-800/50 backdrop-blur-sm rounded-lg border border-emerald-500/30">
                            {peran}
                        </span>
                    </div>
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
    );
}

/* ============================================================
 * STAT GRID (kolom menyesuaikan jumlah kartu)
 * ============================================================ */

function StatGrid({ stats }) {
    const kolom = stats.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-3";

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${kolom} gap-5`}>
            {stats.map((item, index) => (
                <StatCard key={index} {...item} />
            ))}
        </div>
    );
}

/* ============================================================
 * PANEL KEHADIRAN GURU
 * ============================================================ */

function PanelKehadiranGuru({ info }) {
    const jadwalMengajar = info?.jadwal_mengajar || [];
    const { persentase, totalAbsen, totalHadir, totalTidakHadir } =
        hitungKehadiranGuru(info);

    return (
        <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-inner">
                        <i className="fa-solid fa-user-check text-base"></i>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                            Kehadiran Guru
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Rekap kehadiran guru
                        </p>
                    </div>
                </div>

                <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    Guru
                </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 mb-1 font-medium">
                            Persentase Kehadiran
                        </p>
                        <h3 className="text-4xl font-extrabold text-slate-800">
                            {persentase.toFixed(2)}%
                        </h3>
                    </div>

                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <i className="fa-solid fa-chart-pie text-2xl"></i>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                            style={{
                                width: `${Math.min(Math.max(persentase, 0), 100)}%`,
                            }}
                        />
                    </div>
                </div>

                {/* <div className="grid grid-cols-1 gap-3 mt-4">
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] text-slate-400">Hadir</p>
                        <p className="text-lg font-bold text-emerald-600">
                            {totalHadir}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] text-slate-400">
                            Tidak Hadir
                        </p>
                        <p className="text-lg font-bold text-rose-500">
                            {totalTidakHadir}
                        </p>
                    </div>
                </div> */}

                <div className="flex justify-between mt-3">
                    <span className="text-[11px] text-slate-400">
                        Total data kehadiran
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">
                        {totalAbsen} X Absensi
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
 * DASHBOARD GURU MAPEL (guru biasa)
 * ============================================================ */

function DashboardGuruMapel({ info }) {
    const { persentase, totalHadir, totalTidakHadir } =
        hitungKehadiranGuru(info);

    const stats = [
        {
            label: "Kehadiran Guru",
            value: `${persentase.toFixed(2)}%`,
        },
        { label: "Total Hadir", value: `${totalHadir} Kali`, icon: "✅" },
        {
            label: "Tidak Hadir",
            value: `${totalTidakHadir} Kali`,
        },
    ];

    return (
        <>
            <StatGrid stats={stats} />
            <PanelKehadiranGuru info={info} />
        </>
    );
}

/* ============================================================
 * DASHBOARD WALI KELAS
 * ============================================================ */

function DashboardWaliKelas({ info }) {
    const [openChart, setOpenChart] = useState(false);
    const [siswaTerpilih, setSiswaTerpilih] = useState(null);
    const [openModalPdf, setOpenModalPdf] = useState(false);
    const [pdf, setPdf] = useState(null);
    const rekap = info?.rekap_kehadiran || {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
    };

    const { persentase: persentaseGuru } = hitungKehadiranGuru(info);

    const stats = [
        { label: "Kelas Binaan", value: info?.nama_kelas || "-", icon: "🏫" },
        {
            label: "Total Siswa",
            value: `${info?.total_siswa_perwalian || 0} Siswa`,
            icon: "👥",
        },
        {
            label: "Hadir Hari Ini",
            value: `${rekap?.hadir || 0} Siswa`,
            icon: "✅",
        },
        {
            label: "Izin / Sakit",
            value: `${(rekap?.izin || 0) + (rekap?.sakit || 0)} Siswa`,
            icon: "📝",
        },
        {
            label: "Kehadiran Guru",
            value: `${persentaseGuru.toFixed(2)}%`,
            icon: "📊",
        },
    ];

    const columns = [
        {
            header: "No",
            render: (_, index) => (
                <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                    {index + 1}
                </span>
            ),
        },
        { header: "NISN", accessor: "nisn" },
        { header: "Nama", accessor: "nama_siswa" },
        { header: "Jenis Kelamin", accessor: "jenis_kelamin" },
        {
            header: "#",
            render: (row) => (
                <div className="flex space-x-2">
                    <button
                        type="button"
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
                        onClick={() => {
                            setSiswaTerpilih(row);
                            setOpenChart(true);
                        }}
                    >
                        <i className="fa fa-chart-pie mr-2"></i>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <StatGrid stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kelas binaan */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-inner">
                                <i className="fa-solid fa-chalkboard-user text-base"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                    Wali Kelas {info?.nama_kelas || "-"}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium">
                                    Monitoring keaktifan dan rekapitulasi kelas
                                    binaan
                                </p>
                            </div>
                        </div>

                        <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                            Aktif
                        </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-xs text-slate-400 block mb-1 font-medium">
                                    Persentase Kehadiran Kelas
                                </span>
                                <div className="text-3xl font-extrabold text-slate-800">
                                    {info?.persentase_kehadiran || 0}%
                                </div>
                            </div>

                            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <i className="fa-solid fa-users text-xl"></i>
                            </div>
                        </div>

                        <p className="text-[11px] text-emerald-600 mt-3 font-medium">
                            {rekap?.hadir || 0} dari{" "}
                            {info?.total_siswa_perwalian || 0} siswa hadir
                        </p>
                    </div>
                    <div className="flex justify-end m-2">
                        <button
                            className="bg-red-600 rounded-xl p-3 border border-slate-100 text-white"
                            onClick={() => {
                                (setOpenModalPdf(true),
                                    setPdf(
                                        route("pdf.jadwal", {
                                            tahun_ajaran_id:
                                                info?.tahun_ajaran_id,
                                            kelas_id: info?.kelas_id,
                                        }),
                                    ));
                            }}
                        >
                            <p className="text-[10px]">
                                <i className="fa-solid fa-file-pdf mr-2"></i>
                                Jadwal Kelas {info?.nama_kelas} Pdf
                            </p>
                            <p className="text-lg font-bold text-emerald-600"></p>
                        </button>
                    </div>
                </div>

                {/* Kehadiran guru */}
                <PanelKehadiranGuru info={info} />
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-1/2">
                    <ChartRekapKehadiranSekelas rekapKehadiran={rekap} />
                </div>

                <div className="w-full lg:w-1/2">
                    <DataTable
                        columns={columns}
                        data={info?.list_siswa_perwalian || []}
                    />
                </div>
            </div>

            <Modal
                show={openChart}
                closable={true}
                maxWidth="2xl"
                onClose={() => setOpenChart(false)}
            >
                <div className="flex flex-col bg-white rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                                <i className="fa-solid fa-chart-pie text-sm"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 leading-tight">
                                    {siswaTerpilih?.nama_siswa || "-"}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                    NISN: {siswaTerpilih?.nisn || "-"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-all flex items-center justify-center cursor-pointer"
                            onClick={() => setOpenChart(false)}
                        >
                            <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    <ChartRekapKehadiranSiswa siswa={siswaTerpilih} />
                </div>
            </Modal>
            <ModalPdf
                isOpen={openModalPdf}
                onClose={() => setOpenModalPdf(false)}
                pdfUrl={pdf}
                title={"Jadwal Kelas " + info?.nama_kelas}
            />
        </>
    );
}

/* ============================================================
 * MAIN GURU DASHBOARD
 * ============================================================ */

export default function GuruDashboard({
    user = { name: "Budi Santoso", nip: "19880123 201001 1 001" },
    tglStr = "Senin, 26 Jan 2026",
    isWaliKelas: isWaliKelasProp,
}) {
    const [info, setInfo] = useState(INFO_KOSONG);
    const [loading, setLoading] = useState(true);

    /* Selalu ambil data: guru mapel & wali kelas sama-sama butuh
     * data kehadiran guru. */
    useEffect(() => {
        getInfoKelas();
    }, []);

    const getInfoKelas = async () => {
        try {
            const response = await axios.get(
                route("dashboard.get-info-wali-kelas"),
            );

            if (response?.data?.success === true && response?.data?.data) {
                setInfo({ ...INFO_KOSONG, ...response.data.data });
            }
        } catch (error) {
            console.error("Gagal memuat informasi dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const isWaliKelas = useMemo(() => {
        if (isWaliKelasProp !== undefined) return isWaliKelasProp;

        const namaKelas = info?.nama_kelas;
        return Boolean(namaKelas) && namaKelas !== "-";
    }, [isWaliKelasProp, info?.nama_kelas]);

    return (
        <div className="space-y-8 bg-slate-50 md:p-8 font-sans">
            <HeroSection
                user={user}
                tglStr={tglStr}
                peran={isWaliKelas ? "Guru Wali Kelas" : "Guru Mata Pelajaran"}
            />

            {loading ? (
                <div className="text-center text-xs text-slate-400 py-10">
                    Memuat data dashboard...
                </div>
            ) : isWaliKelas ? (
                <DashboardWaliKelas info={info} />
            ) : (
                <DashboardGuruMapel info={info} />
            )}
        </div>
    );
}
