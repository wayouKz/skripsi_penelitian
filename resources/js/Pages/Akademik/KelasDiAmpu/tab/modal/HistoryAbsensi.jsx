import { useAlert } from "@/Components/AlertContext";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function HistoryAbsensi({ open, kode_jadwal, onClose }) {
    const { showAlert } = useAlert();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () =>
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
        );
    const prevMonth = () =>
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
        );
    const goToday = () => setCurrentDate(new Date());

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const historyByDate = useMemo(() => {
        const map = new Map();
        history.forEach((item) => map.set(formatDate(item.waktu_absen), item));
        return map;
    }, [history]);

    const getHistory = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(route("getData.get-history-absensi"), {
                params: { kode_jadwal: kode_jadwal },
            });
            const data = res.data;
            setHistory(data.success === true ? data.data : []);
        } catch (e) {
            showAlert(e.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        getHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, kode_jadwal]);

    const monthTotal = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        return history.filter((item) => {
            const d = new Date(item.waktu_absen);
            return d.getFullYear() === y && d.getMonth() === m;
        }).length;
    }, [history, currentDate]);

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const namaHari = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

        const cells = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`empty-${i}`} className="aspect-square" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const absenData = historyByDate.get(dateStr);
            const isToday = formatDate(new Date()) === dateStr;

            cells.push(
                <button
                    key={`day-${day}`}
                    type="button"
                    disabled={!absenData}
                    onClick={() => absenData && setSelectedItem(absenData)}
                    className={`group relative aspect-square rounded-2xl border p-2 text-left transition-all duration-150
                        ${
                            absenData
                                ? "border-primary-200 bg-primary-50 hover:border-primary-400 hover:bg-primary-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                                : "border-gray-300 bg-gray-50/40 cursor-default"
                        }
                    `}
                >
                    <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                            ${
                                isToday
                                    ? "bg-primary-900 text-white"
                                    : absenData
                                      ? "text-primary-800"
                                      : "text-gray-600"
                            }
                        `}
                    >
                        {day}
                    </span>

                    {absenData && (
                        <span className="absolute bottom-2 left-2 right-2 flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-1 text-[10px] font-bold text-primary-700 backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                            <span className="truncate">{absenData.waktu}</span>
                        </span>
                    )}
                </button>,
            );
        }

        return (
            <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {currentDate.toLocaleDateString("id-ID", {
                                month: "long",
                                year: "numeric",
                            })}
                        </h2>
                        <p className="text-xs text-gray-400">
                            {monthTotal > 0
                                ? `${monthTotal} sesi absensi tercatat`
                                : "Tidak ada sesi bulan ini"}
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={prevMonth}
                            aria-label="Bulan sebelumnya"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                            <i className="fa fa-chevron-left text-xs" />
                        </button>
                        <button
                            onClick={goToday}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                            Hari ini
                        </button>
                        <button
                            onClick={nextMonth}
                            aria-label="Bulan berikutnya"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                            <i className="fa fa-chevron-right text-xs" />
                        </button>
                    </div>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-2">
                    {namaHari.map((hari) => (
                        <div
                            key={hari}
                            className="py-1 text-center text-[11px] font-bold uppercase tracking-wide text-gray-400"
                        >
                            {hari}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">{cells}</div>
            </div>
        );
    };

    const renderDetail = () => {
        const siswaList = selectedItem.list_siswa || [];
        const hadirCount = siswaList.filter(
            (s) => s.status?.toLowerCase() === "hadir",
        ).length;

        return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="flex w-fit items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600 transition-colors hover:text-primary-700"
                    >
                        <i className="fa fa-arrow-left" /> Kembali ke Kalender
                    </button>

                    <div className="text-left sm:text-right">
                        <h3 className="text-sm font-bold text-gray-900">
                            {selectedItem.kode_absen}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {new Date(
                                selectedItem.waktu_absen,
                            ).toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}{" "}
                            •{" "}
                            <span className="font-bold text-primary-600">
                                {selectedItem.waktu} WITA
                            </span>
                        </p>
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
                        <p className="text-lg font-extrabold text-gray-900">
                            {siswaList.length}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400">
                            Total Siswa
                        </p>
                    </div>
                    <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-center shadow-sm">
                        <p className="text-lg font-extrabold text-primary-700">
                            {hadirCount}
                        </p>
                        <p className="text-[11px] font-medium text-primary-600">
                            Hadir
                        </p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center shadow-sm">
                        <p className="text-lg font-extrabold text-red-700">
                            {siswaList.length - hadirCount}
                        </p>
                        <p className="text-[11px] font-medium text-red-600">
                            Tidak Hadir
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <th className="w-12 px-3 py-3 text-center">
                                        No
                                    </th>
                                    <th className="w-32 px-4 py-3">NISN</th>
                                    <th className="px-4 py-3">Nama Lengkap</th>
                                    <th className="w-32 px-4 py-3 text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                {siswaList.length > 0 ? (
                                    siswaList.map((siswa, idx) => {
                                        const status =
                                            siswa.status?.toLowerCase();
                                        return (
                                            <tr
                                                key={siswa.nisn || idx}
                                                className="transition-colors hover:bg-gray-50/80"
                                            >
                                                <td className="px-3 py-3 text-center font-medium text-gray-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-medium text-gray-600">
                                                    {siswa.nisn}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-900">
                                                    {siswa.nama_siswa}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-block rounded-md border px-3 py-1 text-[10px] font-bold uppercase tracking-widest
                                                            ${
                                                                status ===
                                                                "hadir"
                                                                    ? "border-primary-200 bg-primary-50 text-primary-700"
                                                                    : status ===
                                                                        "alpha"
                                                                      ? "border-red-200 bg-red-50 text-red-700"
                                                                      : "border-amber-200 bg-amber-50 text-amber-700"
                                                            }
                                                        `}
                                                    >
                                                        {siswa.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="py-6 text-center italic text-gray-400"
                                        >
                                            Tidak ada data siswa pada absensi
                                            ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="relative flex-1 overflow-y-auto bg-gray-50/50 px-5 py-5">
                {isLoading ? (
                    /* ================= AREA SKELETON KALENDER ================= */
                    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
                        {/* Skeleton Header Kalender */}
                        <div className="mb-5 flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-5 w-40 rounded-lg bg-gray-200" />
                                <div className="h-3 w-28 rounded-lg bg-gray-100" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gray-100" />
                                <div className="h-8 w-16 rounded-lg bg-gray-100" />
                                <div className="h-8 w-8 rounded-lg bg-gray-100" />
                            </div>
                        </div>

                        {/* Skeleton Header Hari */}
                        <div className="mb-2 grid grid-cols-7 gap-2">
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className="mx-auto h-3 w-8 rounded bg-gray-200"
                                />
                            ))}
                        </div>

                        {/* Skeleton Grid Tanggal (35 hari) */}
                        <div className="grid grid-cols-7 gap-2">
                            {[...Array(35)].map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-square rounded-2xl bg-gray-50 border border-gray-100"
                                />
                            ))}
                        </div>
                    </div>
                ) : selectedItem ? (
                    renderDetail()
                ) : (
                    <div className="space-y-4">
                        {history.length === 0 && (
                            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                                <i className="fa fa-info-circle text-lg" />
                                Belum ada riwayat absensi yang tercatat.
                            </div>
                        )}
                        {renderCalendar()}
                    </div>
                )}
            </div>
        </div>
    );
}
