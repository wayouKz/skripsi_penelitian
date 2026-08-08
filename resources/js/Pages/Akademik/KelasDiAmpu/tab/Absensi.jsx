import Modal from "@/Components/Modal";
import { useEffect, useState } from "react";
import HistoryAbsensi from "./modal/HistoryAbsensi";
import { useAlert } from "@/Components/AlertContext";
import axios from "axios";
import Offcanvas from "@/Components/Offcanvas";
import Select from "react-select";

export default function Absensi({ dataKelas }) {
    const [open, setOpen] = useState(false);
    const [tanggal, setTanggal] = useState(
        new Date().toISOString().split("T")[0],
    );

    const [tidakAdaJadwal, setTidakAdaJadwal] = useState(false);
    const [loading, setLoading] = useState(false);

    // State baru untuk loading tabel siswa
    const [isLoadingSiswa, setIsLoadingSiswa] = useState(false);

    const { showAlert, showQuestion } = useAlert();
    const [selectedMapel, setSelectedMapel] = useState("");
    const [namaMapel, setNamaMapel] = useState("");
    const [waktu, setWaktu] = useState(new Date());
    const [dataMapel, setDataMapel] = useState([]);

    const [msg, setMsg] = useState("");
    const [pertemuan, setPertemuan] = useState(0);

<<<<<<< HEAD
=======
    // Styling custom untuk React Select (Mata Pelajaran)
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E2E8F0",
            borderRadius: "0.5rem",
            minHeight: "38px",
            padding: "0 2px",
            boxShadow: state.isFocused
                ? "0 0 0 2px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: "pointer",
            "&:hover": {
                borderColor: "#10B981",
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 6px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "0.875rem",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#334155",
            fontSize: "0.875rem",
            fontWeight: "500",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#10B981"
                : state.isFocused
                  ? "#ECFDF5"
                  : "white",
            color: state.isSelected ? "white" : "#334155",
            fontSize: "0.875rem",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

>>>>>>> main
    useEffect(() => {
        // Membuat jam berjalan otomatis setiap 1 detik (1000 milidetik)
        const timer = setInterval(() => {
            setWaktu(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Memformat jam dan menit agar selalu 2 digit (contoh: 09:05)
    const jam = String(waktu.getHours()).padStart(2, "0");
    const menit = String(waktu.getMinutes()).padStart(2, "0");
    const detik = String(waktu.getSeconds()).padStart(2, "0");
    const [siswa, setSiswa] = useState([]);

    const getSiswa = async () => {
        setIsLoadingSiswa(true); // Mulai loading skeleton
        setTidakAdaJadwal(false); // Reset state jadwal

        try {
            const res = await axios.get(
                route("getData.getSiswaPerKelas", {
                    kelas_id: dataKelas.kelas_id,
                    tahun_ajaran_id: dataKelas.tahun_ajaran_id,
                    kode_jadwal: selectedMapel,
                }),
            );
            if (res.data.success === false) {
                setSiswa([]);
                setTidakAdaJadwal(true);
                setMsg(res.data.msg);
            } else {
                // Suntikkan status_kehadiran default "hadir" ke setiap siswa
                const siswaWithDefaultStatus = res.data.data.map((s) => ({
                    ...s,
                    status_kehadiran: "hadir",
                }));

                setSiswa(siswaWithDefaultStatus);
                setTidakAdaJadwal(false);
                setMsg("");
                setPertemuan(res.data.pertemuan); // Set pertemuan dari response
            }
        } catch (e) {
            // Tangkap pesan error dari HTTP 400 (Jadwal tidak aktif)
            if (e.response && e.response.data && e.response.data.msg) {
                showAlert(e.response.data.msg, "error");
            } else {
                showAlert(e.message, "error");
            }
            setSiswa([]);
            setTidakAdaJadwal(true);
            setMsg("");
        } finally {
            setIsLoadingSiswa(false); // Matikan loading skeleton setelah selesai
        }
    };

    const handleStatusChange = (identifier, statusBaru) => {
        setSiswa(
            siswa.map((s) =>
                // Membandingkan berdasarkan id (jika ada) ATAU nisn
                (s.id || s.nisn) === identifier
                    ? { ...s, status_kehadiran: statusBaru }
                    : s,
            ),
        );
    };

    const getMapel = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                route("getData.get-mapel-guru-kelas", {
                    kelas_id: dataKelas.kelas_id,
                    tahun_ajaran_id: dataKelas.tahun_ajaran_id,
                }),
            );
            if (res.data.success === false) {
                setDataMapel([]);
            } else {
                setDataMapel(res.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil data mapel", error);
        }
        setLoading(false);
    };

    // Handle submit form absensi
    const submitAbsensi = async (e) => {
        e.preventDefault();

        // Validasi pencegahan error
        if (!selectedMapel) {
            showAlert(
                "Mohon pilih Mata Pelajaran terlebih dahulu sebelum menyimpan absensi.",
                "error",
            );
            return;
        }

        if (siswa.length === 0) {
            showAlert("Data siswa masih kosong.", "error");
            return;
        }

        const payload = {
            tanggal: tanggal,
            kode_jadwal: selectedMapel,
            data_absensi: siswa.map((s) => ({
                id_siswa: s.id,
                nisn: s.nisn,
                status_kehadiran: s.status_kehadiran,
                pertemuan: pertemuan,
            })),
            tahun_ajaran_id: dataKelas.tahun_ajaran_id,
            kelas_id: dataKelas.kelas_id,
        };
        showQuestion(
            `Apakah Anda yakin ingin menyimpan absensi untuk Mata Pelajaran ${namaMapel} pada pertemuan ke ${pertemuan}`,
            async () => {
                try {
                    const res = await axios.post(
                        route("akademik.absensi.store"),
                        payload,
                    );

                    if (res.data.success === true) {
                        showAlert("Absensi berhasil disimpan", "success");
                    } else {
                        showAlert(res.data.message, "info", 5000);
                    }
                } catch (error) {
                    console.error("Terjadi kesalahan HTTP:", error);
                    if (
                        error.response &&
                        error.response.data &&
                        error.response.data.message
                    ) {
                        showAlert(error.response.data.message, "error");
                    } else {
                        showAlert(
                            "Terjadi kesalahan pada server. Silakan coba lagi.",
                            "error",
                        );
                    }
                }
            },
        );
    };

    // Mapping opsi untuk React Select Mata Pelajaran
    const mapelOptions = (dataMapel || []).map((mapel) => ({
        value: mapel.kode_jadwal,
        label: mapel.nama_mapel,
    }));

    const selectedMapelOption =
        mapelOptions.find(
            (opt) => String(opt.value) === String(selectedMapel),
        ) || null;

    const handleSelectMapelChange = (option) => {
        if (option) {
            setSelectedMapel(option.value);
            setNamaMapel(option.label);
        } else {
            setSelectedMapel("");
            setNamaMapel("");
            setSiswa([]);
        }
    };

    // Gunakan useEffect untuk memanggil getSiswa saat selectedMapel berubah
    useEffect(() => {
        if (selectedMapel) {
            getSiswa();
        }
    }, [selectedMapel]);

    useEffect(() => {
        getMapel();
    }, []);

    /* ─────────────────────────────────────────────
        STATUS BUTTON CONFIG  (pure UI helper)
    ───────────────────────────────────────────── */
    const STATUS_OPTIONS = [
        {
            value: "hadir",
            short: "H",
            active: "bg-emerald-100 text-emerald-700 border-emerald-500 shadow-sm",
            dot: "bg-emerald-500",
        },
        {
            value: "sakit",
            short: "S",
            active: "bg-yellow-100 text-yellow-700 border-yellow-500 shadow-sm",
            dot: "bg-yellow-500",
        },
        {
            value: "izin",
            short: "I",
            active: "bg-blue-100 text-blue-700 border-blue-500 shadow-sm",
            dot: "bg-blue-500",
        },
        {
            value: "alpha",
            short: "A",
            active: "bg-red-100 text-red-700 border-red-500 shadow-sm",
            dot: "bg-red-500",
        },
    ];

    return (
        <>
            {/* ── HEADER ─────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-6 pb-5 border-b border-slate-100">
                {/* Title block */}
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
                        <i className="fa fa-user-check text-white text-base"></i>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 leading-tight m-0">
                            Catat Absensi Siswa
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Catat kehadiran siswa untuk pelajaran hari ini
                        </p>
                    </div>
                </div>

                {/* Filter controls */}
                <div className="flex flex-col sm:flex-row gap-2 items-end w-full md:w-auto">
                    {/* Tanggal */}
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Tanggal
                        </label>
                        <input
                            type="date"
                            readOnly
                            className="block w-full sm:w-[148px] bg-slate-100 border border-slate-200 text-slate-400 py-2 px-3 rounded-lg text-sm cursor-not-allowed select-none"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                        />
                    </div>

                    {/* Mata Pelajaran (React Select) */}
                    <div className="flex flex-col gap-1 w-full sm:w-[260px]">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Mata Pelajaran
                        </label>
                        <Select
                            value={selectedMapelOption}
                            onChange={handleSelectMapelChange}
                            options={mapelOptions}
                            placeholder="[ Pilih Mata Pelajaran ]"
                            isSearchable={true}
                            menuPortalTarget={document.body}
                            className="text-sm"
                            classNamePrefix="react-select"
                            styles={customSelectStyles}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <button
                            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 font-semibold py-2 px-4 rounded-lg text-xs transition-all shadow-sm h-[38px]"
                            type="button"
                            title="Lihat Riwayat Absensi"
                            onClick={() => {
                                if (!selectedMapel) {
                                    showAlert(
                                        "Mohon pilih Mata Pelajaran terlebih dahulu.",
                                    );
                                    return;
                                }
                                setOpen(true);
                            }}
                        >
                            <i className="fa fa-history text-slate-400"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── KONDISI 1 : Belum pilih mapel ─────────── */}
            {!selectedMapel && (
                <div className="flex flex-col items-center justify-center py-16 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                        <i className="fa fa-book-open text-xl text-slate-300"></i>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">
                        Pilih mata pelajaran terlebih dahulu
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Daftar siswa akan muncul setelah Anda memilih pelajaran
                        dari dropdown di atas.
                    </p>
                </div>
            )}

            {/* ── KONDISI 2 : Loading skeleton ──────────── */}
            {selectedMapel && isLoadingSiswa && (
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {[
                                    "No",
                                    "NISN",
                                    "Nama Lengkap",
                                    "Status Kehadiran",
                                ].map((h, i) => (
                                    <th
                                        key={h}
                                        className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 ${
                                            i === 0 ? "w-12 text-center" : ""
                                        } ${i === 1 ? "w-36" : ""} ${
                                            i === 3
                                                ? "text-center min-w-[320px]"
                                                : ""
                                        }`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {[...Array(5)].map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-4 py-4 text-center">
                                        <div className="h-3.5 bg-slate-100 rounded w-4 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="h-3.5 bg-slate-100 rounded w-24"></div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="h-3.5 bg-slate-100 rounded w-48"></div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center gap-2">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-8 w-16 bg-slate-100 rounded-lg"
                                                ></div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── KONDISI 3 : Tidak ada jadwal ──────────── */}
            {selectedMapel && !isLoadingSiswa && tidakAdaJadwal === true && (
                <div className="flex items-start gap-3.5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center mt-0.5">
                        <i className="fa fa-calendar-times text-yellow-500 text-sm"></i>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-yellow-700">
                            Jadwal Tidak Aktif
                        </p>
                        <p className="text-xs text-yellow-500 mt-0.5 leading-relaxed">
                            {msg ||
                                "Tidak ada jadwal pelajaran yang aktif untuk kelas ini pada hari dan jam sekarang."}
                        </p>
                    </div>
                </div>
            )}

            {/* ── KONDISI 4 : Tabel absensi ─────────────── */}
            {selectedMapel &&
                !isLoadingSiswa &&
                tidakAdaJadwal === false &&
                siswa.length > 0 && (
                    <form onSubmit={submitAbsensi}>
                        {/* Action bar */}
                        <div className="flex justify-between items-center mb-4">
                            {/* Live clock */}
                            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                    Waktu
                                </span>
                                <span className="text-sm font-bold text-slate-700 font-mono tracking-wider tabular-nums">
                                    {jam}:{menit}:{detik}
                                </span>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-2 px-5 rounded-lg text-xs transition-all shadow-sm"
                                >
                                    <i className="fa fa-save"></i>
                                    Simpan Absensi
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto overflow-y-auto h-[500px]">
                                <table className="min-w-full text-sm text-left">
                                    {/* Sticky header */}
                                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-12 text-center">
                                                No
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-36">
                                                NISN
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                                Nama Lengkap
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-center min-w-[320px]">
                                                Status Kehadiran
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {siswa.map((item, index) => (
                                            <tr
                                                key={item.id || item.nisn}
                                                className="hover:bg-slate-50/70 transition-colors"
                                            >
                                                {/* No */}
                                                <td className="px-4 py-3 text-center text-xs text-slate-400 font-medium tabular-nums">
                                                    {index + 1}
                                                </td>

                                                {/* NISN */}
                                                <td className="px-4 py-3 font-mono text-xs text-slate-500 tracking-wider">
                                                    {item.nisn}
                                                </td>

                                                {/* Nama */}
                                                <td className="px-4 py-3 font-medium text-slate-800">
                                                    {item.nama_siswa}
                                                </td>

                                                {/* Status Toggle Dinamis */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {STATUS_OPTIONS.map(
                                                            (opt) => {
                                                                const isActive =
                                                                    item.status_kehadiran ===
                                                                    opt.value;

                                                                return (
                                                                    <label
                                                                        key={
                                                                            opt.value
                                                                        }
                                                                        className={`cursor-pointer border rounded-md py-1.5 px-3 font-bold text-xs transition-all select-none flex items-center justify-center gap-1.5 min-w-[40px] ${
                                                                            isActive
                                                                                ? opt.active
                                                                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name={`status-${item.id || item.nisn}`}
                                                                            className="hidden"
                                                                            value={
                                                                                opt.value
                                                                            }
                                                                            checked={
                                                                                isActive
                                                                            }
                                                                            onChange={() =>
                                                                                handleStatusChange(
                                                                                    item.id ||
                                                                                        item.nisn,
                                                                                    opt.value,
                                                                                )
                                                                            }
                                                                        />
                                                                        {isActive && (
                                                                            <span
                                                                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.dot}`}
                                                                            ></span>
                                                                        )}
                                                                        {
                                                                            opt.short
                                                                        }
                                                                    </label>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </form>
                )}

            {/* ── MODAL RIWAYAT ─────────────────────────── */}
            <Offcanvas
                open={open}
                onClose={() => setOpen(false)}
                title={"Absensi " + namaMapel}
                width="w-1/2"
            >
                <HistoryAbsensi
                    open={open}
                    onClose={() => setOpen(false)}
                    kode_jadwal={selectedMapel}
                />
            </Offcanvas>
        </>
    );
}
