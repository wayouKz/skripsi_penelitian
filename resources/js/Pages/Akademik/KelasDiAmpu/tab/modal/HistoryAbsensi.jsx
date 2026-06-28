import { useAlert } from "@/Components/AlertContext";
import DangerButton from "@/Components/DangerButton";
import { useEffect, useState } from "react";
import axios from "axios";

export default function HistoryAbsensi({ title, kode_jadwal, onClose }) {
    const { showAlert } = useAlert();
    const [history, setHistory] = useState([]);

    // State baru untuk loading
    const [isLoading, setIsLoading] = useState(true);

    // State untuk menyimpan SATU item history yang sedang dilihat detailnya
    const [selectedItem, setSelectedItem] = useState(null);

    const getHistory = async () => {
        setIsLoading(true); // Mulai loading
        try {
            axios
                .get(route("getData.get-history-absensi"), {
                    params: {
                        kode_jadwal: kode_jadwal,
                    },
                })
                .then((res) => {
                    const data = res.data;
                    if (data.success === true) {
                        setHistory(data.data);
                    } else {
                        setHistory([]);
                    }
                })
                .finally(() => {
                    setIsLoading(false); // Matikan loading setelah selesai (sukses/gagal)
                });
        } catch (e) {
            showAlert(e.message, "error");
            setIsLoading(false); // Matikan loading jika error catch
        }
    };

    useEffect(() => {
        getHistory();
    }, []);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header Utama Modal */}
            <div className="flex items-center justify-between border-b px-5 py-4 bg-white shrink-0 z-10">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <i className="fa fa-history text-emerald-600"></i> {title}
                </h2>
                <DangerButton type="button" onClick={onClose}>
                    ✕
                </DangerButton>
            </div>

            {/* Container Konten */}
            <div className="w-full overflow-y-auto px-5 py-5 bg-gray-50/50 flex-1 relative">
                {isLoading ? (
                    /* ================= AREA SKELETON LOADING ================= */
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((skeleton) => (
                            <div
                                key={skeleton}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse"
                            >
                                <div className="space-y-3 w-full sm:w-auto">
                                    {/* Placeholder Kode Absen */}
                                    <div className="h-4 bg-gray-200 rounded-md w-32"></div>
                                    {/* Placeholder Tanggal */}
                                    <div className="h-3 bg-gray-200 rounded-md w-48"></div>
                                </div>

                                <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                                    {/* Placeholder Badge Waktu */}
                                    <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
                                    {/* Placeholder Chevron */}
                                    <div className="h-4 bg-gray-200 rounded-md w-4 hidden sm:block"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    /* Kosong */
                    <div className="w-full flex items-center justify-center py-12">
                        <span className="text-sm font-medium text-gray-500 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm">
                            Belum ada history absensi
                        </span>
                    </div>
                ) : selectedItem ? (
                    /* ================= AREA DETAIL (HANYA TABEL SISWA) ================= */
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Info & Tombol Kembali */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors w-fit"
                            >
                                <i className="fa fa-arrow-left"></i> Kembali
                            </button>

                            <div className="text-left sm:text-right">
                                <h3 className="text-sm font-bold text-gray-900">
                                    {selectedItem.kode_absen}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(
                                        selectedItem.waktu_absen,
                                    ).toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}{" "}
                                    •{" "}
                                    <span className="font-bold text-blue-600">
                                        {selectedItem.waktu} WITA
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Tabel Siswa */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-3 text-center w-12">
                                                No
                                            </th>
                                            <th className="py-3 px-4 w-32">
                                                NISN
                                            </th>
                                            <th className="py-3 px-4">
                                                Nama Lengkap
                                            </th>
                                            <th className="py-3 px-4 text-center w-32">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                        {selectedItem.list_siswa &&
                                        selectedItem.list_siswa.length > 0 ? (
                                            selectedItem.list_siswa.map(
                                                (siswa, idx) => (
                                                    <tr
                                                        key={siswa.nisn || idx}
                                                        className="hover:bg-gray-50/80 transition-colors"
                                                    >
                                                        <td className="py-3 px-3 text-center text-gray-400 font-medium">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="py-3 px-4 font-mono font-medium text-gray-600">
                                                            {siswa.nisn}
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-gray-900">
                                                            {siswa.nama_siswa}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span
                                                                className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                                                                    siswa.status.toLowerCase() ===
                                                                    "hadir"
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                        : siswa.status.toLowerCase() ===
                                                                            "alpha"
                                                                          ? "bg-red-50 text-red-700 border-red-200"
                                                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                                                }`}
                                                            >
                                                                {siswa.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="py-6 text-center text-gray-400 italic"
                                                >
                                                    Tidak ada data siswa pada
                                                    absensi ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ================= AREA MASTER (LIST HISTORY SAJA) ================= */
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div
                                key={item.kode_absen}
                                onClick={() => setSelectedItem(item)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                            >
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                                        {item.kode_absen}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">
                                        {new Date(
                                            item.waktu_absen,
                                        ).toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 justify-between sm:justify-end">
                                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100">
                                        <i className="fa fa-clock-o mr-1"></i>{" "}
                                        {item.waktu} WITA
                                    </span>

                                    {/* Indikator klik */}
                                    <div className="text-gray-400 group-hover:text-emerald-500 transition-colors">
                                        <i className="fa fa-chevron-right text-sm"></i>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
