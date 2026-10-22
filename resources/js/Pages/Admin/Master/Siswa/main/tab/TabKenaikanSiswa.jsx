import { useEffect, useState } from "react";
import axios from "axios";
import { useAlert } from "@/Components/AlertContext";
import Select from "react-select";
// --- IMPORT DRIVER.JS ---
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

function SummaryRow({ label, value, muted = false }) {
    return (
        <div
            className={`flex items-center justify-between px-3 py-1.5 ${muted ? "bg-gray-50/50" : ""}`}
        >
            <span className="text-[11px] text-gray-500">{label}</span>
            <span className="text-[11px]">{value}</span>
        </div>
    );
}

export default function TabKenaikanKelas() {
    const { showCenterAlert, showQuestion } = useAlert();
    // --- STATE MANAGEMENT ---
    const [dataTahunAjaran, setDataTahunAjaran] = useState([]);
    const [taAsal, setTaAsal] = useState("");
    const [kelasAsalId, setKelasAsalId] = useState("");
    const [siswaAsal, setSiswaAsal] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [selectedSiswa, setSelectedSiswa] = useState([]);

    const [taTujuan, setTaTujuan] = useState("");
    const [kelasTujuanId, setKelasTujuanId] = useState("");
    const [opsiKelasTujuan, setOpsiKelasTujuan] = useState([]);
    const [totalKelasTujuan, setTotalKelasTujuan] = useState(0);

    const [loading, setLoading] = useState(false);
    const [loadingSiswa, setLoadingSiswa] = useState(false);

    // --- STATE UNTUK AUTO PROSES ---
    const [isAutoProcessing, setIsAutoProcessing] = useState(false);
    const [autoProgress, setAutoProgress] = useState({
        current: 0,
        total: 0,
        kelasName: "",
    });
    const [autoLogs, setAutoLogs] = useState([]);

    // --- STYLING CUSTOM UNTUK REACT-SELECT (DIBUAT SMALL) ---
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? "#F9FAFB" : "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E5E7EB",
            borderRadius: "0.375rem",
            minHeight: "30px",
            height: "30px",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            "&:hover": {
                borderColor: state.isDisabled ? "#E5E7EB" : "#10B981",
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 6px",
            minHeight: "30px",
            height: "30px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "0.75rem",
            fontWeight: "normal",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "0.75rem",
            fontWeight: "600",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#10B981"
                : state.isFocused
                  ? "#ECFDF5"
                  : "white",
            color: state.isSelected ? "white" : "#1F2937",
            fontSize: "0.75rem",
            fontWeight: "500",
            padding: "4px 8px",
            cursor: "pointer",
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: "30px",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

    // --- LIFECYCLE / EFFECTS ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const resTa = await axios.get(
                    route("getData.get-tahun-ajaran"),
                );
                setDataTahunAjaran(resTa.data.data || []);
            } catch (error) {
                console.error("Gagal mengambil data tahun ajaran:", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!taAsal) {
            setKelasList([]);
            return;
        }
        axios
            .get(route("getData.get-kelas-siswa"), {
                params: { tahun_ajaran: taAsal },
            })
            .then((res) => setKelasList(res.data.data || []))
            .catch(() => setKelasList([]));
    }, [taAsal]);

    useEffect(() => {
        if (kelasAsalId && taAsal && taTujuan) {
            axios
                .get(
                    route("getData.get-kelas-tujuan", {
                        kelas_asal_id: kelasAsalId,
                        ta_asal: taAsal,
                        ta_tujuan: taTujuan,
                    }),
                )
                .then((res) => setOpsiKelasTujuan(res.data.data || []))
                .catch(() => setOpsiKelasTujuan([]));
        } else {
            setOpsiKelasTujuan([]);
        }
    }, [kelasAsalId, taAsal, taTujuan]);

    useEffect(() => {
        if (dataTahunAjaran?.length > 0 && !taTujuan) {
            const validOptions = dataTahunAjaran.filter((ta) => {
                if (!taAsal) return true;
                return Number(ta.id || ta.value) > Number(taAsal);
            });

            if (validOptions.length > 0) {
                const active = validOptions.find(
                    (ta) => ta.status === "active",
                );
                if (active) {
                    setTaTujuan(active.id || active.value);
                } else {
                    setTaTujuan(validOptions[0].id || validOptions[0].value);
                }
            }
        }
    }, [dataTahunAjaran, taTujuan, taAsal]);

    // --- HANDLERS ---
    const handleCheckAll = (e) => {
        setSelectedSiswa(e.target.checked ? siswaAsal.map((s) => s.value) : []);
    };

    const handleCheckSiswa = (nisn) => {
        setSelectedSiswa((prev) =>
            prev.includes(nisn)
                ? prev.filter((id) => id !== nisn)
                : [...prev, nisn],
        );
    };

    const handleGetSiswaInKelas = async (id, ta) => {
        if (!id) {
            setSiswaAsal([]);
            return;
        }
        setLoadingSiswa(true);
        try {
            setKelasAsalId(id);
            const res = await axios.get(route("getData.siswa-in-kelas"), {
                params: { kelas_id: id, Ta: ta },
            });
            setSiswaAsal(res.data.data || []);
        } catch (error) {
            setSiswaAsal([]);
        } finally {
            setLoadingSiswa(false);
        }
    };

    const handleChangeKelasTujuan = (value) => {
        setKelasTujuanId(value);
        if (!value) {
            setTotalKelasTujuan(0);
            return;
        }
        try {
            loadTotal(value);
        } catch (error) {
            setTotalKelasTujuan(0);
        }
    };

    const loadTotal = async (value) => {
        const res = await axios.get(
            route("getData.cek-kelas-tujuan", {
                kelas_asal_id: value,
                tahun_ajaran: taTujuan,
            }),
        );
        setTotalKelasTujuan(res.data?.data?.total || 0);
    };

    const submitKenaikan = async (e) => {
        e.preventDefault();
        if (!taTujuan || !kelasTujuanId) {
            showCenterAlert(
                "Pilih Tahun Ajaran dan Kelas Tujuan!",
                "error",
                2000,
            );
            return;
        }
        if (selectedSiswa.length === 0) {
            showCenterAlert("Pilih minimal 1 siswa!", "error", 2000);
            return;
        }
        if (Number(taTujuan) <= Number(taAsal)) {
            showCenterAlert(
                "Gagal! Tahun Ajaran Baru harus lebih maju dari Tahun Ajaran Lama.",
                "error",
                3000,
            );
            return;
        }

        const payload = {
            tahun_ajaran_asal_id: Number(taAsal),
            kelas_asal_id: Number(kelasAsalId),
            tahun_ajaran_tujuan_id: Number(taTujuan),
            kelas_tujuan_id:
                String(kelasTujuanId).toUpperCase() === "LULUS"
                    ? "LULUS"
                    : Number(kelasTujuanId),
            siswa_ids: selectedSiswa.map((id) => {
                const s = siswaAsal.find((item) => item.value === id);
                return {
                    id,
                    nama_siswa: s ? s.label : "",
                    nisn: s ? s.nisn : "",
                };
            }),
        };

        setLoading(true);
        try {
            const res = await axios.post(
                route("master.siswa.proses-kenaikan"),
                payload,
            );
            if (res.data.success) {
                showCenterAlert(
                    res.data.msg || "Kenaikan kelas berhasil diproses",
                    "success",
                    2000,
                );
                loadTotal(kelasTujuanId);
                setSelectedSiswa([]);
            } else {
                showCenterAlert(res.data.msg, "error", 2000);
            }
        } catch {
            showCenterAlert("Terjadi kesalahan pada server", "error", 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoProcessAll = async () => {
        if (!taAsal || !taTujuan) {
            showCenterAlert(
                "Pilih Tahun Ajaran Lama dan Baru terlebih dahulu!",
                "warning",
                2000,
            );
            return;
        }
        if (kelasList.length === 0) {
            showCenterAlert(
                "Tidak ada kelas pada Tahun Ajaran Lama!",
                "warning",
                2000,
            );
            return;
        }
        if (Number(taTujuan) <= Number(taAsal)) {
            showCenterAlert(
                "Gagal! Tahun Ajaran Tujuan tidak valid (mundur atau sama).",
                "error",
                3000,
            );
            return;
        }

        showQuestion(
            "Sistem akan memproses kenaikan seluruh kelas secara berurutan. Lanjutkan?",
            async () => {
                setIsAutoProcessing(true);
                setAutoLogs([]);
                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < kelasList.length; i++) {
                    const currentKelas = kelasList[i];
                    setAutoProgress({
                        current: i + 1,
                        total: kelasList.length,
                        kelasName: currentKelas.nama_kelas,
                    });

                    try {
                        const resSiswa = await axios.get(
                            route("getData.siswa-in-kelas"),
                            {
                                params: {
                                    kelas_id: currentKelas.id,
                                    Ta: taAsal,
                                },
                            },
                        );
                        const siswaArr = resSiswa.data.data || [];

                        if (siswaArr.length === 0) {
                            setAutoLogs((prev) => [
                                ...prev,
                                `[SKIP] !WARNING ${currentKelas.nama_kelas} - Kosong`,
                            ]);
                            continue;
                        }

                        const resTujuan = await axios.get(
                            route("getData.get-kelas-tujuan", {
                                kelas_asal_id: currentKelas.id,
                                ta_asal: taAsal,
                                ta_tujuan: taTujuan,
                            }),
                        );
                        const opsiTujuan = resTujuan.data.data || [];
                        const targetId =
                            opsiTujuan.length > 0 ? opsiTujuan[0].id : "LULUS";

                        const payload = {
                            tahun_ajaran_asal_id: Number(taAsal),
                            kelas_asal_id: Number(currentKelas.id),
                            tahun_ajaran_tujuan_id: Number(taTujuan),
                            kelas_tujuan_id:
                                targetId === "LULUS"
                                    ? "LULUS"
                                    : Number(targetId),
                            siswa_ids: siswaArr.map((s) => ({
                                nisn: s.nisn,
                                siswa_id: s.value,
                                nama_siswa: s.label,
                            })),
                        };
                        console.log(
                            "Payload untuk kelas",
                            currentKelas.nama_kelas,
                            payload,
                        );
                        const resProses = await axios.post(
                            route("master.siswa.proses-kenaikan"),
                            payload,
                        );

                        if (resProses.data.success) {
                            successCount++;
                            setAutoLogs((prev) => [
                                ...prev,
                                `[OK] SUCCESS ${currentKelas.nama_kelas} -> Berhasil`,
                            ]);
                        } else {
                            failCount++;
                            setAutoLogs((prev) => [
                                ...prev,
                                `[GAGAL] !ERROR ${currentKelas.nama_kelas} -> ${resProses.data.msg}`,
                            ]);
                        }
                    } catch (error) {
                        failCount++;
                        setAutoLogs((prev) => [
                            ...prev,
                            `[ERROR] ${currentKelas.nama_kelas} -> Gagal Fetch/Server`,
                        ]);
                    }
                }

                setTimeout(() => {
                    setIsAutoProcessing(false);
                    showCenterAlert(
                        `Selesai! Berhasil: ${successCount}, Gagal/Skip: ${failCount}`,
                        "info",
                        4000,
                    );
                    setSiswaAsal([]);
                    setSelectedSiswa([]);
                    setKelasAsalId("");
                }, 1500);
            },
            () => {
                console.log("Proses kenaikan kelas otomatis dibatalkan.");
            },
        );
    };

    // --- DRIVER.JS INITIATOR ---
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            nextBtnText: "Selanjutnya",
            prevBtnText: "Kembali",
            doneBtnText: "Selesai",
            steps: [
                {
                    element: "#tour-panel-asal",
                    popover: {
                        title: "1. Sumber Data (Kelas Asal)",
                        description:
                            "Di panel ini, Anda memilih Tahun Ajaran Lama dan Kelas yang siswanya akan dipindahkan/dinaikkan.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: "#tour-pilih-siswa",
                    popover: {
                        title: "2. Pemilihan Siswa",
                        description:
                            "Anda bisa mencentang kotak ini untuk memilih seluruh siswa, atau memilih satu persatu di daftar bawahnya. Siswa yang tidak dicentang akan otomatis tinggal kelas.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#tour-panel-tujuan",
                    popover: {
                        title: "3. Target Pemindahan",
                        description:
                            "Tentukan Tahun Ajaran Baru dan Kelas Tujuan. Sistem akan otomatis mendeteksi jika siswa harus diluluskan.",
                        side: "left",
                        align: "start",
                    },
                },
                {
                    element: "#tour-ringkasan",
                    popover: {
                        title: "4. Ringkasan Eksekusi",
                        description:
                            "Pastikan validasi di kotak ini sudah sesuai dengan yang Anda rencanakan sebelum menekan tombol proses.",
                        side: "left",
                        align: "start",
                    },
                },
                {
                    element: "#tour-btn-manual",
                    popover: {
                        title: "5. Eksekusi Kelas Terpilih",
                        description:
                            "Gunakan tombol ini jika ingin memproses kenaikan secara manual khusus untuk kelas dan siswa yang Anda pilih.",
                        side: "top",
                        align: "end",
                    },
                },
                {
                    element: "#tour-btn-auto",
                    popover: {
                        title: "6. Mode Otomatis",
                        description:
                            "Fitur super cepat untuk memproses perpindahan SELURUH kelas secara berurutan.",
                        side: "top",
                        align: "start",
                    },
                },
            ],
        });
        driverObj.drive();
    };

    // --- COMPUTED OPTIONS UNTUK REACT-SELECT ---
    const tahunAjaranAsalOptions = (dataTahunAjaran || []).map((ta) => ({
        value: ta.id || ta.value,
        label: `${ta.tahun_ajaran || ta.label} ${
            ta.status === "active" ? "(Aktif)" : "(Tidak Aktif)"
        }`,
    }));
    const selectedTaAsalOption =
        tahunAjaranAsalOptions.find(
            (opt) => String(opt.value) === String(taAsal),
        ) || null;

    const kelasAsalOptions = (kelasList || []).map((k) => ({
        value: k.id,
        label: k.nama_kelas,
    }));
    const selectedKelasAsalOption =
        kelasAsalOptions.find(
            (opt) => String(opt.value) === String(kelasAsalId),
        ) || null;

    const tahunAjaranTujuanOptions = (dataTahunAjaran || [])
        .filter((ta) => {
            if (!taAsal) return true;
            return Number(ta.id || ta.value) > Number(taAsal);
        })
        .map((ta) => ({
            value: ta.id || ta.value,
            label: `${ta.tahun_ajaran || ta.label} ${
                ta.status === "active" ? "(Aktif)" : "(Tidak Aktif)"
            }`,
        }));
    const selectedTaTujuanOption =
        tahunAjaranTujuanOptions.find(
            (opt) => String(opt.value) === String(taTujuan),
        ) || null;

    const kelasTujuanOptions = (opsiKelasTujuan || []).map((k) => ({
        value: k.id,
        label: k.nama_kelas,
    }));
    const selectedKelasTujuanOption =
        kelasTujuanOptions.find(
            (opt) => String(opt.value) === String(kelasTujuanId),
        ) || null;

    // --- COMPUTED LABELS ---
    const kelasNamaTujuan =
        String(kelasTujuanId).toUpperCase() === "LULUS"
            ? "Lulus / Alumni"
            : opsiKelasTujuan.find(
                  (k) => String(k.id) === String(kelasTujuanId),
              )?.nama_kelas ||
              kelasList?.find((k) => String(k.id) === String(kelasTujuanId))
                  ?.nama_kelas ||
              "Belum dipilih";

    const taTujuanLabel =
        dataTahunAjaran.find(
            (ta) => String(ta.id || ta.value) === String(taTujuan),
        )?.tahun_ajaran ||
        dataTahunAjaran.find(
            (ta) => String(ta.id || ta.value) === String(taTujuan),
        )?.label ||
        "Belum dipilih";

    const siswaNotMoved = siswaAsal.length - selectedSiswa.length;
    const isCheckAllIndeterminate =
        selectedSiswa.length > 0 && selectedSiswa.length < siswaAsal.length;
    const isCheckAllChecked =
        siswaAsal.length > 0 && selectedSiswa.length === siswaAsal.length;
    const progressPercentage =
        autoProgress.total > 0
            ? Math.round((autoProgress.current / autoProgress.total) * 100)
            : 0;

    return (
        <div className="relative">
            {/* ======= HEADER & TOMBOL PANDUAN ======= */}
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-bold text-gray-800">
                        Proses Kenaikan Kelas
                    </h2>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                        Pindahkan siswa ke tingkat selanjutnya atau kelulusan.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={startTour}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200 rounded-md text-[11px] font-bold transition-all shadow-sm"
                >
                    <i className="fa fa-question-circle" />
                    <span className="hidden sm:inline">Panduan Pemakaian</span>
                </button>
            </div>

            {/* ======= MODAL LOADING SYNC ======= */}
            {isAutoProcessing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-sm mx-4 flex flex-col gap-3 border border-gray-100">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                            <i className="fa fa-sync fa-spin text-primary-600 text-base" />
                            <div>
                                <h3 className="text-gray-800 font-bold text-sm">
                                    Memproses Kenaikan Otomatis
                                </h3>
                                <p className="text-gray-500 text-[10px]">
                                    Mohon tunggu, mengeksekusi kelas satu per
                                    satu...
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-primary-600">
                                    Kelas: {autoProgress.kelasName}
                                </span>
                                <span className="text-gray-600">
                                    {autoProgress.current} /{" "}
                                    {autoProgress.total}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                                <div
                                    className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <div className="text-right text-[9px] text-gray-400 font-medium">
                                {progressPercentage}% Selesai
                            </div>
                        </div>

                        <div className="bg-black rounded-lg p-2 h-24 overflow-y-auto font-mono text-[10px] text-primary-400 flex flex-col gap-1 shadow-inner border border-primary-700">
                            {autoLogs.length === 0 ? (
                                <span className="text-primary-500">
                                    Menyiapkan data...
                                </span>
                            ) : (
                                autoLogs.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className={
                                            log.includes("[ERROR]") ||
                                            log.includes("[GAGAL]")
                                                ? "text-red-400"
                                                : log.includes("[SKIP]")
                                                  ? "text-amber-400"
                                                  : "text-primary-400"
                                        }
                                    >
                                        {`> ${log}`}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submitKenaikan} className="flex flex-col gap-3">
                {/* --- GRID UTAMA LAYOUT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_40px_1fr] gap-3 items-stretch">
                    {/* ======= PANEL 1: KELAS ASAL ======= */}
                    <div
                        id="tour-panel-asal"
                        className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col transition-all duration-200"
                    >
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold">
                                    1
                                </span>
                                <span className="text-xs font-semibold text-gray-800">
                                    Asal Kelas & Siswa
                                </span>
                            </div>
                        </div>

                        <div className="p-3 flex flex-col gap-3 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        Tahun Ajaran Lama
                                    </label>
                                    <Select
                                        value={selectedTaAsalOption}
                                        onChange={(option) => {
                                            const selectedVal = option
                                                ? option.value
                                                : "";
                                            setTaAsal(selectedVal);
                                            setKelasAsalId("");
                                            setSiswaAsal([]);
                                            setSelectedSiswa([]);

                                            if (
                                                taTujuan &&
                                                Number(taTujuan) <=
                                                    Number(selectedVal)
                                            ) {
                                                setTaTujuan("");
                                            }
                                        }}
                                        options={tahunAjaranAsalOptions}
                                        placeholder="Pilih Tahun Ajaran"
                                        isSearchable={true}
                                        menuPortalTarget={document.body}
                                        className="text-xs"
                                        classNamePrefix="react-select"
                                        styles={customSelectStyles}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        Kelas Saat Ini
                                    </label>
                                    <Select
                                        value={selectedKelasAsalOption}
                                        onChange={(option) => {
                                            const val = option
                                                ? option.value
                                                : "";
                                            setSelectedSiswa([]);
                                            handleGetSiswaInKelas(val, taAsal);
                                        }}
                                        options={kelasAsalOptions}
                                        placeholder="Pilih Kelas"
                                        isSearchable={true}
                                        isDisabled={!taAsal}
                                        menuPortalTarget={document.body}
                                        className="text-xs"
                                        classNamePrefix="react-select"
                                        styles={customSelectStyles}
                                    />
                                </div>
                            </div>

                            {/* Box List Siswa */}
                            <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden flex-1 min-h-[200px] bg-white shadow-inner">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                                    <label
                                        id="tour-pilih-siswa"
                                        className="flex items-center gap-2 cursor-pointer select-none"
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded text-primary-600 focus:ring-primary-500/30 accent-primary-600 cursor-pointer"
                                            checked={isCheckAllChecked}
                                            ref={(el) => {
                                                if (el)
                                                    el.indeterminate =
                                                        isCheckAllIndeterminate;
                                            }}
                                            onChange={handleCheckAll}
                                            disabled={
                                                siswaAsal.length === 0 ||
                                                loadingSiswa
                                            }
                                        />
                                        <span className="text-[11px] font-semibold text-gray-700">
                                            Pilih Semua
                                        </span>
                                    </label>
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200/60 border border-gray-300 px-2 py-0.5 rounded-full">
                                        {selectedSiswa.length} /{" "}
                                        {siswaAsal.length}
                                    </span>
                                </div>

                                <div className="overflow-y-auto max-h-52 flex-1 p-1.5 scrollbar-thin scrollbar-thumb-gray-200">
                                    {loadingSiswa ? (
                                        <div className="flex flex-col items-center justify-center h-full py-10 gap-2 text-primary-500">
                                            <i className="fa fa-spinner animate-spin text-xl" />
                                            <span className="text-[11px] font-medium text-gray-400">
                                                Memuat daftar siswa...
                                            </span>
                                        </div>
                                    ) : siswaAsal.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-10 gap-2 text-gray-300">
                                            <i className="fa fa-users text-2xl text-gray-200" />
                                            <span className="text-[11px] font-medium text-gray-400">
                                                Belum ada data siswa
                                            </span>
                                        </div>
                                    ) : (
                                        <ul className="space-y-1">
                                            {siswaAsal.map((siswa) => {
                                                const isChecked =
                                                    selectedSiswa.includes(
                                                        siswa.value,
                                                    );
                                                return (
                                                    <li key={siswa.value}>
                                                        <label
                                                            className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-all border ${isChecked ? "bg-primary-50/70 border-primary-200" : "border-transparent hover:bg-gray-50"}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="w-3.5 h-3.5 rounded text-primary-600 accent-primary-600 flex-shrink-0"
                                                                checked={
                                                                    isChecked
                                                                }
                                                                onChange={() =>
                                                                    handleCheckSiswa(
                                                                        siswa.value,
                                                                    )
                                                                }
                                                            />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-semibold text-gray-800 truncate">
                                                                    {
                                                                        siswa.label
                                                                    }
                                                                </span>
                                                                <span className="text-[10px] font-medium text-gray-400">
                                                                    NISN:{" "}
                                                                    {
                                                                        siswa.value
                                                                    }
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ======= DIVIDER ARROW UTAMA ======= */}
                    <div className="hidden lg:flex items-center justify-center self-center flex-shrink-0">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-px h-3 bg-gray-200" />
                            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                                <svg
                                    className="w-3 h-3 text-primary-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </div>
                            <div className="w-px h-3 bg-gray-200" />
                        </div>
                    </div>

                    {/* ======= PANEL 2: KELAS TUJUAN ======= */}
                    <div
                        id="tour-panel-tujuan"
                        className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden transition-all duration-200"
                    >
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                            <span className="w-4 h-4 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                2
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 leading-none">
                                    Target Pemindahan
                                </p>
                            </div>
                        </div>

                        <div className="p-3 flex flex-col gap-3 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Tahun Ajaran Baru
                                    </label>
                                    <Select
                                        value={selectedTaTujuanOption}
                                        onChange={(option) =>
                                            setTaTujuan(
                                                option ? option.value : "",
                                            )
                                        }
                                        options={tahunAjaranTujuanOptions}
                                        placeholder="Pilih tahun ajaran..."
                                        isSearchable={true}
                                        menuPortalTarget={document.body}
                                        className="text-xs"
                                        classNamePrefix="react-select"
                                        styles={customSelectStyles}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Kelas Selanjutnya
                                    </label>
                                    <Select
                                        value={selectedKelasTujuanOption}
                                        onChange={(option) =>
                                            handleChangeKelasTujuan(
                                                option ? option.value : "",
                                            )
                                        }
                                        options={kelasTujuanOptions}
                                        placeholder="Pilih kelas target..."
                                        isSearchable={true}
                                        isDisabled={!kelasAsalId}
                                        menuPortalTarget={document.body}
                                        className="text-xs"
                                        classNamePrefix="react-select"
                                        styles={customSelectStyles}
                                    />
                                </div>
                            </div>

                            {/* Summary card */}
                            <div
                                id="tour-ringkasan"
                                className="flex-1 border border-gray-200 rounded-lg overflow-hidden"
                            >
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                                    <svg
                                        className="w-3.5 h-3.5 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2"
                                        />
                                    </svg>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Ringkasan Pemindahan
                                    </p>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    <SummaryRow
                                        label="Siswa dipilih"
                                        value={
                                            <span className="inline-flex items-center gap-1 font-semibold text-primary-600">
                                                <span className="w-1 h-1 rounded-full bg-primary-500 inline-block" />
                                                {selectedSiswa.length} siswa
                                            </span>
                                        }
                                    />
                                    <SummaryRow
                                        label="Tahun ajaran baru"
                                        value={
                                            <span
                                                className={`font-semibold ${taTujuanLabel ? "text-gray-800" : "text-gray-400"}`}
                                            >
                                                {taTujuanLabel || "—"}
                                            </span>
                                        }
                                    />
                                    {kelasAsalId && (
                                        <SummaryRow
                                            label="Kelas tujuan"
                                            value={
                                                kelasTujuanId ? (
                                                    <span className="font-semibold text-gray-800">
                                                        {kelasNamaTujuan}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-500 font-medium text-[10px]">
                                                        Belum dipilih
                                                    </span>
                                                )
                                            }
                                        />
                                    )}
                                    {kelasAsalId &&
                                        kelasTujuanId &&
                                        String(kelasTujuanId).toUpperCase() !==
                                            "LULUS" && (
                                            <SummaryRow
                                                label="Siswa di kelas target"
                                                value={
                                                    <span className="font-semibold text-gray-700">
                                                        {totalKelasTujuan} siswa
                                                    </span>
                                                }
                                                muted
                                            />
                                        )}
                                </div>
                            </div>

                            {/* Warning banner */}
                            {siswaNotMoved > 0 && siswaAsal.length > 0 ? (
                                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    <svg
                                        className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                        />
                                    </svg>
                                    <p className="text-[11px] text-amber-800 leading-tight">
                                        <span className="font-semibold">
                                            {siswaNotMoved} siswa
                                        </span>{" "}
                                        tidak dicentang dan akan tetap tinggal
                                        di kelas saat ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="hidden lg:block h-[34px]" />
                            )}
                        </div>
                    </div>
                </div>

                {/* ======= BUTTON SUBMIT & AUTO / FOOTER ======= */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-gray-100 mt-1">
                    <button
                        id="tour-btn-auto"
                        type="button"
                        onClick={handleAutoProcessAll}
                        disabled={!taAsal || !taTujuan || isAutoProcessing}
                        className="w-full sm:w-auto flex justify-center items-center gap-1.5 px-4 py-1.5 bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50 disabled:border-gray-200 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg shadow-sm transition-all duration-200"
                    >
                        <i className="fa fa-magic text-[10px]" />
                        <span>Kenaikan Otomatis Semua Kelas</span>
                    </button>

                    <button
                        id="tour-btn-manual"
                        type="submit"
                        disabled={
                            selectedSiswa.length === 0 ||
                            !taTujuan ||
                            !kelasTujuanId ||
                            loading
                        }
                        className="w-full sm:w-auto flex justify-center items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-md disabled:shadow-none hover:shadow-lg transition-all duration-200"
                    >
                        {loading ? (
                            <>
                                <i className="fa fa-spinner animate-spin text-xs" />
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <i className="fa fa-paper-plane text-[10px]" />
                                <span>Proses Kenaikan Kelas</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
