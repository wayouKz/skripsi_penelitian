import { useAlert } from "@/Components/AlertContext";
import DangerButton from "@/Components/DangerButton";
import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";

// ─── Semua nilai status yang dianggap bermasalah ───────────────────────────
const STATUS_BERMASALAH = ["Belum Absen", "Belum Absen / Kosong", "Kosong"];

const isStatusBermasalah = (status) =>
    STATUS_BERMASALAH.some((s) => status?.includes(s));

// ─── Helper untuk cek apakah jam sesi saat ini sudah masuk / lewat ──────────
const isJamAktif = (jamSesi) => {
    if (!jamSesi) return true; // Jika tidak ada info jam, anggap periksa langsung

    // Format jamSesi umumnya "07:30 - 08:15"
    const parts = jamSesi.split("-");
    if (parts.length < 2) return true;

    const currentTime = new Date();
    const currentHours = String(currentTime.getHours()).padStart(2, "0");
    const currentMinutes = String(currentTime.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const jamMulai = parts[0].trim();

    // Anomali aktif hanya jika waktu sekarang sudah melewati atau sama dengan jam mulai pelajaran
    return currentTimeStr >= jamMulai;
};

// ─── Skeleton card untuk loading state AI (Kanan) ─────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white border border-indigo-100 rounded-lg p-3 animate-pulse">
            <div className="h-2 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-1.5 bg-slate-100 rounded w-full mb-1"></div>
            <div className="h-1.5 bg-slate-100 rounded w-4/5 mb-2"></div>
            <div className="h-6 bg-indigo-50 rounded-md w-full"></div>
        </div>
    );
}

// ─── Skeleton card untuk loading state Daftar Kelas (Kiri) ────────────────
function SkeletonKelasCard() {
    return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 animate-pulse shadow-sm">
            {/* Header Kelas */}
            <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
            {/* Manifes Item Jadwal */}
            <div className="border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                </div>
                <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                <div className="h-2 bg-slate-100 rounded w-1/4"></div>
            </div>
        </div>
    );
}

export default function MonitoringKBM({ title, onClose, open }) {
    const { showAlert } = useAlert();

    const [kelasAktif, setKelasAktif] = useState({});
    const [anomaliList, setAnomaliList] = useState([]);
    const [selectedAnomali, setSelectedAnomali] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [rekomendasiAI, setRekomendasiAI] = useState(null);

    // ── Polling: ambil data kelas aktif setiap 5 detik ──────────────────────
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            getKelasAktif();
            const timer = setInterval(getKelasAktif, 5000);
            return () => clearInterval(timer);
        }
    }, [open]);

    // ── Deteksi anomali berdasarkan status bermasalah & jam aktif ───────────
    useEffect(() => {
        const anomali = [];
        Object.entries(kelasAktif).forEach(([, jadwalArray]) => {
            jadwalArray.forEach((kls) => {
                if (
                    isStatusBermasalah(kls.status_kbm) &&
                    isJamAktif(kls.jam_sesi)
                ) {
                    anomali.push(kls);
                }
            });
        });

        setAnomaliList(anomali);

        if (selectedAnomali) {
            const masihBermasalah = anomali.some(
                (a) =>
                    a.nama_kelas === selectedAnomali.nama_kelas &&
                    a.nama_mapel === selectedAnomali.nama_mapel,
            );

            if (!masihBermasalah) {
                setSelectedAnomali(null);
                setRekomendasiAI(null);
                setIsAnalyzing(false);
            }
        }
    }, [kelasAktif]);

    // ── Ambil data kelas aktif dari backend ─────────────────────────────────
    const getKelasAktif = async () => {
        try {
            const response = await axios.get(route("getData.get-kelas-aktif"));
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

    // ── Kirim data anomali ke backend → backend panggil Gemini/Anthropic ───
    const analyzeWithAI = async (anomali, semuaAnomali = []) => {
        setIsAnalyzing(true);
        setRekomendasiAI(null);

        try {
            const response = await axios.post(
                route("manajemen.generative-ai.recomendation-guru"),
                {
                    fokus: anomali,
                    semua_kosong: semuaAnomali,
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
            anomali.nama_mapel === selectedAnomali?.nama_mapel &&
            rekomendasiAI
        ) {
            return;
        }

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
                    <i className="fa fa-computer text-emerald-600"></i> {title}
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
                    KIRI — Status Kelas KBM
                ════════════════════════════════════════════ */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 custom-scrollbar">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Status Ruangan Saat Ini
                        </h3>
                        {!isLoading && !isKelasEmpty && (
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[9px] font-semibold text-slate-500 uppercase">
                                    Live
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {isLoading ? (
                            <>
                                <SkeletonKelasCard />
                                <SkeletonKelasCard />
                                <SkeletonKelasCard />
                                <SkeletonKelasCard />
                            </>
                        ) : isKelasEmpty ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-6 text-center bg-white border border-dashed border-slate-300 rounded-xl my-2">
                                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 text-xl shadow-sm">
                                    <i className="fa-solid fa-calendar-xmark"></i>
                                </div>
                                <h4 className="text-sm font-bold text-slate-700">
                                    Tidak Ada Kegiatan KBM
                                </h4>
                                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                                    Saat ini tidak ada jadwal kegiatan belajar
                                    mengajar yang terdeteksi.
                                </p>
                            </div>
                        ) : (
                            Object.entries(kelasAktif).map(
                                ([namaKelas, jadwalArray]) => (
                                    <div
                                        key={namaKelas}
                                        className="mb-1 bg-white border border-slate-200 p-3 rounded-lg shadow-sm"
                                    >
                                        {/* Label kelas */}
                                        <h4 className="text-xs font-extrabold text-slate-800 mb-2 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                            <i className="fa-solid fa-door-open text-emerald-600"></i>
                                            Ruang Kelas {namaKelas}
                                        </h4>

                                        <div className="space-y-2">
                                            {jadwalArray.map((kls, index) => {
                                                const bermasalah =
                                                    isStatusBermasalah(
                                                        kls.status_kbm,
                                                    ) &&
                                                    isJamAktif(kls.jam_sesi);
                                                const isSelected =
                                                    selectedAnomali?.nama_kelas ===
                                                        kls.nama_kelas &&
                                                    selectedAnomali?.nama_mapel ===
                                                        kls.nama_mapel;

                                                return (
                                                    <div
                                                        key={`${kls.kode_jadwal ?? namaKelas}-${index}`}
                                                        role="button"
                                                        disabled={isAnalyzing}
                                                        onClick={() =>
                                                            bermasalah &&
                                                            handleSelectAnomali(
                                                                kls,
                                                            )
                                                        }
                                                        className={[
                                                            "p-2.5 rounded-lg border transition-all duration-200",
                                                            bermasalah
                                                                ? "bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100 cursor-pointer hover:ring-indigo-300"
                                                                : "bg-white border-slate-200 hover:border-emerald-300",
                                                            isSelected
                                                                ? "ring-1 ring-indigo-400 border-indigo-300"
                                                                : "",
                                                        ].join(" ")}
                                                    >
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <span className="font-bold text-slate-800 text-xs">
                                                                {kls.nama_mapel}
                                                            </span>
                                                            <span
                                                                className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${kls.warna_badge}`}
                                                            >
                                                                {kls.status_kbm}
                                                            </span>
                                                        </div>

                                                        <div className="text-[10px] text-slate-600 space-y-0.5">
                                                            <p
                                                                className={`flex items-start gap-1.5 ${bermasalah ? "text-red-600 font-semibold" : ""}`}
                                                            >
                                                                <i className="fa-solid fa-user-tie mt-0.5 text-slate-400 shrink-0"></i>
                                                                <span>
                                                                    {
                                                                        kls.nama_guru
                                                                    }
                                                                </span>
                                                            </p>

                                                            {kls.jam_sesi && (
                                                                <p className="flex items-center gap-1.5 text-slate-400">
                                                                    <i className="fa-solid fa-clock shrink-0"></i>
                                                                    {
                                                                        kls.jam_sesi
                                                                    }
                                                                </p>
                                                            )}

                                                            {bermasalah && (
                                                                <p className="text-[9px] text-indigo-500 font-medium mt-1 flex items-center gap-1">
                                                                    Klik untuk
                                                                    analisis AI{" "}
                                                                    <i className="fa-solid fa-arrow-right animate-pulse"></i>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ),
                            )
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════
                    KANAN — AI Agent Panel
                ════════════════════════════════════════════ */}
                <div className="w-full lg:w-72 bg-white border-l border-slate-200 flex flex-col shrink-0">
                    {/* AI Header */}
                    <div className="p-3 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-inner">
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
                                : "Memantau kondisi KBM real-time..."}
                        </p>
                    </div>

                    {/* AI Body */}
                    <div className="p-3 flex-1 overflow-y-auto bg-slate-50/50 space-y-3">
                        {/* Semua kelas normal */}
                        {anomaliList.length === 0 &&
                            !isAnalyzing &&
                            !isLoading && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-check text-emerald-500 text-base shrink-0"></i>
                                    <div>
                                        <h4 className="text-xs font-bold text-emerald-800">
                                            Semua Kelas Normal
                                        </h4>
                                        <p className="text-[10px] text-emerald-700 mt-0.5">
                                            Tidak ada anomali yang terdeteksi
                                            saat ini.
                                        </p>
                                    </div>
                                </div>
                            )}

                        {/* Tab anomali */}
                        {anomaliList.length > 0 && !isLoading && (
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    ⚠️ Anomali Terdeteksi ({anomaliList.length})
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {anomaliList.map((a, i) => {
                                        const active =
                                            selectedAnomali?.nama_kelas ===
                                                a.nama_kelas &&
                                            selectedAnomali?.nama_mapel ===
                                                a.nama_mapel;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() =>
                                                    handleSelectAnomali(a)
                                                }
                                                className={`text-[10px] px-2 py-1 rounded-md border font-semibold transition-all ${
                                                    active
                                                        ? "bg-red-500 text-white border-red-500 shadow"
                                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                                }`}
                                            >
                                                {a.nama_kelas} · {a.nama_mapel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Alert detail anomali terpilih */}
                        {selectedAnomali && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-sm">
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
                                            —{" "}
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

                        {/* Skeleton loading AI */}
                        {isAnalyzing && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    ✨ Rekomendasi Pengganti{" "}
                                    <i className="fa-solid fa-spinner animate-spin"></i>
                                </h4>
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        )}

                        {/* Rekomendasi AI */}
                        {!isAnalyzing &&
                            rekomendasiAI?.kandidat?.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        ✨ Rekomendasi Guru Pengganti
                                    </h4>
                                    <div className="space-y-2.5">
                                        {rekomendasiAI.kandidat.map(
                                            (guru, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-white border border-indigo-100 rounded-lg p-3 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors"
                                                >
                                                    <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                                        Match: {guru.matchScore}
                                                    </div>
                                                    <h5 className="font-bold text-slate-800 text-xs pr-12">
                                                        {guru.nama}
                                                    </h5>
                                                    <p className="text-[10px] text-slate-500 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                                                        <i className="fa-solid fa-circle-check text-emerald-500 mr-1"></i>
                                                        {guru.alasan}
                                                    </p>
                                                    <button
                                                        className="w-full mt-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-[10px] font-bold py-1.5 rounded-md transition-all duration-300 flex items-center justify-center gap-1.5"
                                                        onClick={() => {
                                                            handleAssignGuru(
                                                                guru,
                                                            );
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-paper-plane"></i>
                                                        Tugaskan
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Tidak ada kandidat AI */}
                        {!isAnalyzing &&
                            rekomendasiAI &&
                            rekomendasiAI.kandidat?.length === 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-[10px] text-yellow-800 flex items-center gap-2">
                                    <i className="fa-solid fa-face-sad-tear text-yellow-500 text-sm shrink-0"></i>
                                    <span>
                                        Tidak ada guru pengganti yang tersedia
                                        untuk sesi ini.
                                    </span>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
}
