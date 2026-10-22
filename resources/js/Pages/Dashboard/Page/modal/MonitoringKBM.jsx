import { useAlert } from "@/Components/AlertContext";
import DangerButton from "@/Components/DangerButton";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";

// ─── Semua nilai status yang dianggap bermasalah ───────────────────────────
const STATUS_BERMASALAH = ["Belum Absen", "Belum Absen / Kosong", "Kosong"];

const isStatusBermasalah = (status) =>
    STATUS_BERMASALAH.some((s) => status?.includes(s));

const daftarHariKerja = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
];

// ─── Helper untuk mendapatkan nama hari ini dalam bahasa Indonesia ──────────
const getHariIni = () => {
    const daftarHari = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ];
    return daftarHari[new Date().getDay()];
};

// ─── Helper untuk mencari tanggal (YYYY-MM-DD) berdasarkan nama hari dalam minggu berjalan ───
const getTanggalByHariInThisWeek = (namaHariTarget) => {
    const curr = new Date();
    const dayIndex = curr.getDay(); // 0 (Minggu) sampai 6 (Sabtu)

    // Sesuaikan hitungan agar Senin dihitung sebagai awal minggu (index 1)
    // Jika Minggu (0), kita anggap sebagai hari ke-7 dalam siklus Senin-Minggu
    const currentDayNumber = dayIndex === 0 ? 7 : dayIndex;

    const targetDayNumber = daftarHariKerja.indexOf(namaHariTarget) + 1; // Senin = 1, Minggu = 7

    // Hitung selisih hari dari hari ini ke target hari dalam minggu yang sama
    const diff = targetDayNumber - currentDayNumber;

    const targetDate = new Date(curr);
    targetDate.setDate(curr.getDate() + diff);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// ─── Helper untuk cek apakah jam sesi saat ini sudah masuk / lewat ──────────
const isJamAktif = (jamSesi) => {
    if (!jamSesi) return true;

    const parts = jamSesi.split("-");
    if (parts.length < 2) return true;

    const currentTime = new Date();
    const currentHours = String(currentTime.getHours()).padStart(2, "0");
    const currentMinutes = String(currentTime.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const jamMulai = parts[0].trim();

    return currentTimeStr >= jamMulai;
};

// ─── Sub-Komponen: Kartu Kandidat Guru AI ──────────────────────────────────
const KandidatCard = ({ guru, onAssign }) => (
    <div className="bg-white border border-indigo-100 rounded-xl p-3 shadow-sm relative overflow-hidden group hover:border-indigo-300 hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-bl-xl">
            Match: {guru.matchScore}
        </div>
        <h5 className="font-bold text-primary-800 text-xs pr-14">
            {guru.nama}
        </h5>
        <p className="text-[10px] text-primary-600 mt-1.5 bg-primary-50 p-2 rounded-lg border border-primary-100 flex items-start gap-1.5">
            <i className="fa-solid fa-circle-check text-primary-500 mt-0.5 shrink-0"></i>
            <span>{guru.alasan}</span>
        </p>
        <button
            onClick={() => onAssign?.(guru)}
            className="w-full mt-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-[10px] font-bold py-1.5 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs"
        >
            <i className="fa-solid fa-paper-plane text-[9px]"></i>
            Tugaskan
        </button>
    </div>
);

// ─── Skeleton card untuk loading state AI (Kanan) ─────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white border border-indigo-100 rounded-lg p-3 animate-pulse shadow-xs">
            <div className="h-2.5 bg-primary-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-primary-100 rounded w-full mb-1"></div>
            <div className="h-2 bg-primary-100 rounded w-4/5 mb-2.5"></div>
            <div className="h-7 bg-indigo-50 rounded-md w-full"></div>
        </div>
    );
}

// ─── Skeleton card untuk loading state Daftar Kelas (Kiri) ────────────────
function SkeletonKelasCard() {
    return (
        <div className="bg-white border border-primary-200 rounded-lg p-3.5 animate-pulse shadow-sm">
            <div className="h-3.5 bg-primary-200 rounded w-1/2 mb-3"></div>
            <div className="border border-primary-100 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                    <div className="h-3 bg-primary-200 rounded w-1/3"></div>
                    <div className="h-4 bg-primary-200 rounded w-12"></div>
                </div>
                <div className="h-2 bg-primary-100 rounded w-3/4"></div>
                <div className="h-2 bg-primary-100 rounded w-1/4"></div>
            </div>
        </div>
    );
}

export default function MonitoringKBM({ title, onClose, open }) {
    const { showAlert, showQuestion } = useAlert();

    const [kelasAktif, setKelasAktif] = useState({});
    const [selectedHari, setSelectedHari] = useState(getHariIni());
    // Tanggal langsung diset mengikuti tanggal hari ini secara default
    const [selectedTanggal, setSelectedTanggal] = useState(
        getTanggalByHariInThisWeek(getHariIni()),
    );
    const [anomaliList, setAnomaliList] = useState([]);
    const [selectedAnomali, setSelectedAnomali] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [rekomendasiAI, setRekomendasiAI] = useState(null);

    // ── Polling: ambil data kelas aktif setiap 5 detik ──
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            getKelasAktif(selectedHari, selectedTanggal);
            const timer = setInterval(
                () => getKelasAktif(selectedHari, selectedTanggal),
                5000,
            );
            return () => clearInterval(timer);
        }
    }, [open, selectedHari, selectedTanggal]);

    // ── Deteksi anomali khusus untuk hari yang dipilih (selectedHari) ─────────
    useEffect(() => {
        const anomali = [];
        Object.entries(kelasAktif).forEach(([namaKelas, hariObj]) => {
            if (typeof hariObj === "object" && hariObj !== null) {
                if (
                    hariObj[selectedHari] &&
                    Array.isArray(hariObj[selectedHari])
                ) {
                    hariObj[selectedHari].forEach((kls) => {
                        const dataAnomali = {
                            ...kls,
                            nama_kelas: namaKelas,
                            hari: selectedHari,
                        };

                        const isHariIni = selectedHari === getHariIni();
                        const cekJam = isHariIni
                            ? isJamAktif(dataAnomali.jam_sesi)
                            : true;

                        if (
                            isStatusBermasalah(dataAnomali.status_kbm) &&
                            cekJam
                        ) {
                            anomali.push(dataAnomali);
                        }
                    });
                }
            }
        });

        setAnomaliList(anomali);

        if (selectedAnomali) {
            const masihBermasalah = anomali.some(
                (a) =>
                    a.nama_kelas === selectedAnomali.nama_kelas &&
                    a.hari === selectedAnomali.hari &&
                    a.nama_mapel === selectedAnomali.nama_mapel,
            );

            if (!masihBermasalah) {
                setSelectedAnomali(null);
                setRekomendasiAI(null);
                setIsAnalyzing(false);
            }
        }
    }, [kelasAktif, selectedHari]);

    const handleAssignGuru = async (guru) => {
        showQuestion(
            `Apakah anda yakin ingin menugaskan guru ${guru.nama} untuk mengajar ${selectedAnomali.nama_mapel} di kelas ${selectedAnomali.nama_kelas}?`,
            async () => {
                try {
                    const response = await axios.post(
                        route("dashboard.monitoring-kbm.assign-guru-pengganti"),
                        guru,
                    );

                    if (response.data.success === true) {
                        showAlert(response.data.message, "success");
                    } else if (response.data.success === false) {
                        showAlert(response.data.message, "error");
                    }
                } catch (error) {
                    console.error("Gagal mengambil data mapel", error);
                }
            },
        );
    };
    // ── Ambil data kelas aktif dari backend dengan mengirim parameter hari & tanggal ──
    const getKelasAktif = async (
        hari = selectedHari,
        tanggal = selectedTanggal,
    ) => {
        try {
            const response = await axios.get(route("getData.get-kelas-aktif"), {
                params: {
                    hari: hari,
                    tanggal: tanggal,
                },
            });
            setKelasAktif(response.data.data || {});
        } catch (error) {
            const msg =
                error.response?.data?.message ??
                "Terjadi kesalahan pada server. Silakan coba lagi.";
            showAlert(msg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Kirim data anomali ke backend ────────────────────────────────────────
    const analyzeWithAI = async (anomali, semuaAnomali = []) => {
        setIsAnalyzing(true);
        setRekomendasiAI(null);

        try {
            const response = await axios.post(
                route("manajemen.generative-ai.recomendation-guru"),
                {
                    fokus: anomali,
                    semua_kosong: semuaAnomali,
                    tanggal: selectedTanggal,
                },
            );

            setRekomendasiAI(response.data);
        } catch (error) {
            console.error("Error AI:", error);
            const msg =
                error.response?.data?.message ||
                "AI tidak dapat memberikan rekomendasi saat ini.";
            showAlert(msg, "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSelectAnomali = (anomali) => {
        if (
            anomali.nama_kelas === selectedAnomali?.nama_kelas &&
            anomali.hari === selectedAnomali?.hari &&
            anomali.nama_mapel === selectedAnomali?.nama_mapel &&
            rekomendasiAI
        ) {
            return;
        }
        console.log(anomali);
        setSelectedAnomali(anomali);
        analyzeWithAI(anomali, anomaliList);
    };

    const isKelasEmpty = useMemo(() => {
        return Object.keys(kelasAktif).length === 0;
    }, [kelasAktif]);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b px-4 py-2.5 bg-white shrink-0 z-10">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <i className="fa fa-computer text-primary-600"></i> {title}
                </h2>
                <DangerButton
                    type="button"
                    onClick={onClose}
                    className="px-2 py-1 text-xs"
                >
                    ✕
                </DangerButton>
            </div>

            {/* ── Konten utama ── */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* ════════════════════════════════════════════
                    KIRI — Status Kelas & Filter Hari
                ════════════════════════════════════════════ */}
                <div className="flex-1 overflow-y-auto p-4 bg-primary-50 custom-scrollbar flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 bg-white p-2.5 rounded-lg border border-primary-200 shadow-xs">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-primary-800 uppercase tracking-wider">
                                Filter Hari:
                            </h3>
                            {selectedHari === getHariIni() && (
                                <span className="flex items-center gap-1 bg-primary-100 text-primary-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                                    Hari Ini ({selectedTanggal})
                                </span>
                            )}
                        </div>

                        {/* Select / Tab Pilihan Hari & Kalkulasi Otomatis Tanggal Mingguan */}
                        <div className="flex flex-wrap gap-1">
                            {daftarHariKerja.map((hari) => {
                                // Hitung tanggal spesifik untuk hari tersebut di minggu ini
                                const tanggalHariIniPekan =
                                    getTanggalByHariInThisWeek(hari);
                                const isSelected = selectedHari === hari;

                                return (
                                    <button
                                        key={hari}
                                        onClick={() => {
                                            setSelectedHari(hari);
                                            setSelectedTanggal(
                                                tanggalHariIniPekan,
                                            ); // Otomatis set tanggal mingguan
                                            setSelectedAnomali(null);
                                            setRekomendasiAI(null);
                                            setIsLoading(true);
                                            getKelasAktif(
                                                hari,
                                                tanggalHariIniPekan,
                                            );
                                        }}
                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all flex flex-col items-center ${
                                            isSelected
                                                ? "bg-primary-600 text-white shadow-sm"
                                                : "bg-primary-100 text-primary-600 hover:bg-primary-200"
                                        }`}
                                    >
                                        <span>{hari}</span>
                                        <span
                                            className={`text-[8px] font-normal ${isSelected ? "text-primary-100" : "text-primary-400"}`}
                                        >
                                            {tanggalHariIniPekan.slice(5)}{" "}
                                            {/* Menampilkan format MM-DD agar rapi di tombol */}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {isLoading ? (
                            <>
                                <SkeletonKelasCard />
                                <SkeletonKelasCard />
                            </>
                        ) : isKelasEmpty ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-6 text-center bg-white border border-dashed border-primary-300 rounded-xl my-2">
                                <div className="w-12 h-12 bg-primary-100 text-primary-400 rounded-full flex items-center justify-center mb-3 text-xl shadow-sm">
                                    <i className="fa-solid fa-calendar-xmark"></i>
                                </div>
                                <h4 className="text-sm font-bold text-primary-700">
                                    Tidak Ada Kegiatan KBM
                                </h4>
                                <p className="text-xs text-primary-500 max-w-sm mt-1 leading-relaxed">
                                    Saat ini tidak ada jadwal kegiatan belajar
                                    mengajar yang terdeteksi untuk hari{" "}
                                    {selectedHari} ({selectedTanggal}).
                                </p>
                            </div>
                        ) : (
                            Object.entries(kelasAktif).map(
                                ([namaKelas, hariObj]) => {
                                    const jadwalHariIni =
                                        hariObj?.[selectedHari] || [];

                                    if (jadwalHariIni.length === 0) return null;

                                    return (
                                        <div
                                            key={namaKelas}
                                            className="mb-1 bg-white border border-primary-200 p-3 rounded-lg shadow-sm flex flex-col"
                                        >
                                            <h4 className="text-xs font-extrabold text-primary-800 mb-2 border-b border-primary-100 pb-1.5 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <i className="fa-solid fa-door-open text-primary-600"></i>
                                                    Ruang Kelas {namaKelas}
                                                </span>
                                                <span className="text-[9px] font-semibold text-primary-400 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                                                    {selectedHari} (
                                                    {selectedTanggal})
                                                </span>
                                            </h4>

                                            <div className="space-y-2 flex-1">
                                                {jadwalHariIni.map(
                                                    (kls, index) => {
                                                        const isHariIni =
                                                            selectedHari ===
                                                            getHariIni();
                                                        const cekJam = isHariIni
                                                            ? isJamAktif(
                                                                  kls.jam_sesi,
                                                              )
                                                            : true;

                                                        // Dianggap anomali jika belum absen DAN jamnya sudah aktif/lewat
                                                        const bermasalah =
                                                            isStatusBermasalah(
                                                                kls.status_kbm,
                                                            ) && cekJam;

                                                        const isSelected =
                                                            selectedAnomali?.nama_kelas ===
                                                                namaKelas &&
                                                            selectedAnomali?.hari ===
                                                                selectedHari &&
                                                            selectedAnomali?.nama_mapel ===
                                                                kls.nama_mapel;

                                                        return (
                                                            <div
                                                                key={`${kls.kode_jadwal ?? namaKelas}-${index}`}
                                                                role="button"
                                                                // onClick={() =>
                                                                //     bermasalah &&
                                                                //     handleSelectAnomali(
                                                                //         {
                                                                //             ...kls,
                                                                //             nama_kelas:
                                                                //                 namaKelas,
                                                                //             hari: selectedHari,
                                                                //         },
                                                                //     )
                                                                // }
                                                                className={[
                                                                    "p-2.5 rounded-lg border transition-all duration-200",
                                                                    bermasalah
                                                                        ? "bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100  hover:ring-indigo-300"
                                                                        : "bg-white border-primary-200 hover:border-primary-300",
                                                                    isSelected
                                                                        ? "ring-1 ring-indigo-400 border-indigo-300"
                                                                        : "",
                                                                ].join(" ")}
                                                            >
                                                                <div className="flex justify-between items-start mb-1.5">
                                                                    <span className="font-bold text-primary-800 text-xs">
                                                                        {
                                                                            kls.nama_mapel
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${kls.warna_badge}`}
                                                                    >
                                                                        {
                                                                            kls.status_kbm
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <div className="text-[10px] text-primary-600 space-y-1">
                                                                    {/* Info Nama Guru & Label Pengganti */}
                                                                    <div className="flex items-start gap-1.5">
                                                                        <i className="fa-solid fa-user-tie mt-0.5 text-primary-400 shrink-0"></i>
                                                                        <div className="flex flex-col">
                                                                            <span
                                                                                className={
                                                                                    bermasalah
                                                                                        ? "text-red-600 font-semibold"
                                                                                        : ""
                                                                                }
                                                                            >
                                                                                {
                                                                                    kls.nama_guru
                                                                                }
                                                                            </span>

                                                                            {/* Tampilkan info tambahan jika ada pengajuan guru pengganti */}
                                                                            {kls.nama_guru_pengganti && (
                                                                                <span className="text-[9px] text-amber-600 font-medium">
                                                                                    Pengganti:{" "}
                                                                                    {
                                                                                        kls.nama_guru_pengganti
                                                                                    }
                                                                                    <span className="italic text-primary-400">
                                                                                        {" "}
                                                                                        (
                                                                                        {
                                                                                            kls.status_pergantian
                                                                                        }

                                                                                        )
                                                                                    </span>
                                                                                    {kls.status_pergantian ===
                                                                                    "selesai" ? (
                                                                                        <i className="fa-solid fa-check ml-1 text-primary-600"></i>
                                                                                    ) : (
                                                                                        <i className="fa-solid fa-clock-rotate-left ml-1 animate-spin"></i>
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {kls.jam_sesi && (
                                                                        <p className="flex items-center gap-1.5 text-primary-400">
                                                                            <i className="fa-solid fa-clock shrink-0"></i>
                                                                            {
                                                                                kls.jam_sesi
                                                                            }
                                                                        </p>
                                                                    )}

                                                                    {bermasalah && (
                                                                        <p className="text-[9px] text-primary-500 font-medium mt-1 flex items-center gap-1 hidden">
                                                                            Klik
                                                                            untuk
                                                                            analisis
                                                                            AI{" "}
                                                                            <i className="fa-solid fa-arrow-right animate-pulse"></i>
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    );
                                },
                            )
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════
                    KANAN — AI Agent Panel
                ════════════════════════════════════════════ */}
                <div className="w-full lg:w-80 bg-white border-l border-primary-200 flex flex-col shrink-0 hidden">
                    <div className="p-3 bg-gradient-to-br from-primary-900 to-primary-700 text-white shadow-inner">
                        <div className="flex items-center gap-2 mb-1">
                            <i
                                className={`fa-solid fa-robot text-lg text-indigo-300 ${isAnalyzing ? "fa-spin" : "animate-pulse"}`}
                            ></i>
                            <h3 className="font-bold text-sm">
                                AI Scheduling Agent
                            </h3>
                        </div>
                        <p className="text-[10px] text-indigo-200">
                            {isAnalyzing
                                ? "Menganalisis jadwal & ketersediaan guru..."
                                : `Memantau anomali (${selectedHari} - ${selectedTanggal})...`}
                        </p>
                    </div>

                    <div className="p-3 flex-1 overflow-y-auto bg-primary-50/50 space-y-3">
                        {anomaliList.length === 0 &&
                            !isAnalyzing &&
                            !isLoading && (
                                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-check text-primary-500 text-base shrink-0"></i>
                                    <div>
                                        <h4 className="text-xs font-bold text-primary-800">
                                            Tidak Ada Anomali
                                        </h4>
                                        <p className="text-[10px] text-primary-700 mt-0.5">
                                            Semua kelas pada hari {selectedHari}{" "}
                                            ({selectedTanggal}) terpantau
                                            normal.
                                        </p>
                                    </div>
                                </div>
                            )}

                        {anomaliList.length > 0 && !isLoading && (
                            <div className="bg-white border border-red-100 rounded-xl p-3 shadow-2xs space-y-3">
                                <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center justify-between border-b border-red-50 pb-1.5">
                                    <span>
                                        ⚠️ Anomali per Kelas (
                                        {anomaliList.length})
                                    </span>
                                </h4>

                                {/* Container list yang dikelompokkan berdasarkan kelas */}
                                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {Object.entries(
                                        anomaliList.reduce((acc, curr) => {
                                            if (!acc[curr.nama_kelas]) {
                                                acc[curr.nama_kelas] = [];
                                            }
                                            acc[curr.nama_kelas].push(curr);
                                            return acc;
                                        }, {}),
                                    ).map(([namaKelas, itemsMapel]) => (
                                        <div
                                            key={namaKelas}
                                            className="bg-primary-50 border border-primary-200/80 rounded-lg p-2.5"
                                        >
                                            {/* Header Nama Kelas */}
                                            <div className="text-[10px] font-extrabold text-primary-700 mb-1.5 flex items-center justify-between">
                                                <span className="bg-primary-200 text-primary-800 px-1.5 py-0.5 rounded">
                                                    Kelas {namaKelas}
                                                </span>
                                                <span className="text-[9px] text-primary-500 font-normal">
                                                    {itemsMapel.length} Mapel
                                                    Kosong
                                                </span>
                                            </div>

                                            {/* Badge Mata Pelajaran di dalam Kelas Tersebut */}
                                            <div className="flex flex-wrap gap-1">
                                                {itemsMapel.map((a, i) => {
                                                    const active =
                                                        selectedAnomali?.nama_kelas ===
                                                            a.nama_kelas &&
                                                        selectedAnomali?.hari ===
                                                            a.hari &&
                                                        selectedAnomali?.nama_mapel ===
                                                            a.nama_mapel;

                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() =>
                                                                handleSelectAnomali(
                                                                    a,
                                                                )
                                                            }
                                                            className={`text-[9px] px-2 py-1 rounded-md border font-semibold transition-all ${
                                                                active
                                                                    ? "bg-red-600 text-white border-red-600 shadow-2xs"
                                                                    : "bg-white text-red-700 border-red-200 hover:bg-red-50"
                                                            }`}
                                                        >
                                                            {a.nama_mapel}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedAnomali && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-xs">
                                <div className="flex gap-2">
                                    <i className="fa-solid fa-triangle-exclamation text-orange-500 mt-0.5 text-sm shrink-0"></i>
                                    <div>
                                        <h4 className="text-xs font-bold text-orange-800">
                                            Anomaly Detected!
                                        </h4>
                                        <p className="text-[10px] text-orange-700 mt-1 leading-relaxed">
                                            Kelas{" "}
                                            <strong>
                                                {selectedAnomali.nama_kelas}
                                            </strong>{" "}
                                            ({selectedAnomali.hari} -{" "}
                                            {selectedTanggal}) —{" "}
                                            <strong>
                                                {selectedAnomali.nama_mapel}
                                            </strong>
                                            <br />
                                            Guru:{" "}
                                            <strong>
                                                {selectedAnomali.nama_guru}
                                            </strong>{" "}
                                            belum absen
                                            {selectedAnomali.jam_sesi && (
                                                <>
                                                    {" "}
                                                    pada jam{" "}
                                                    <strong>
                                                        {
                                                            selectedAnomali.jam_sesi
                                                        }
                                                    </strong>
                                                </>
                                            )}
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Kotak Rekomendasi AI ── */}
                        <div className="mt-4 pt-3 border-t border-primary-200">
                            {isAnalyzing && (
                                <div className="space-y-2.5">
                                    <h4 className="text-[10px] font-bold text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>✨ Rekomendasi Pengganti</span>
                                        <i className="fa-solid fa-spinner animate-spin text-indigo-500"></i>
                                    </h4>
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            )}

                            {!isAnalyzing &&
                                rekomendasiAI?.kandidat?.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                                            <span>
                                                ✨ Rekomendasi Guru Pengganti
                                            </span>
                                        </h4>
                                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                            {rekomendasiAI.kandidat.map(
                                                (guru, idx) => (
                                                    <KandidatCard
                                                        key={guru.id || idx}
                                                        guru={guru}
                                                        onAssign={
                                                            handleAssignGuru
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {!isAnalyzing &&
                                rekomendasiAI &&
                                rekomendasiAI.kandidat?.length === 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2.5 shadow-xs">
                                        <i className="fa-solid fa-face-sad-tear text-amber-500 text-base shrink-0"></i>
                                        <span className="font-medium">
                                            Tidak ada guru pengganti yang
                                            tersedia untuk sesi ini.
                                        </span>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
