import { useAlert } from "@/Components/AlertContext";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import DroppableKelasCard from "../../partials/DroppableKelasCard";
import DraggableSiswa from "../../partials/DraggableSiswa";

// --- IMPORT DRIVER.JS ---
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function TabMappingSiswa({
    kelasList,
    siswaList,
    removeSiswa,
    setKelasList,
    tahunAjaran,
}) {
    const { showCenterAlert, showAlert } = useAlert();

    const [activeSiswa, setActiveSiswa] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );

    const handleDragStart = (event) => {
        setActiveSiswa(event.active.data.current);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveSiswa(null);
        if (!over) return;

        const siswaId = active.id;
        const kelasId = Number(over.id);
        const siswa = siswaList.find((item) => item.value === siswaId);
        if (!siswa) return;

        const kelasSiswaSekarang = kelasList?.find((kelas) =>
            kelas.siswa.some((s) => s.value === siswaId),
        );

        if (kelasSiswaSekarang) {
            if (kelasSiswaSekarang.id === kelasId) return;
            showCenterAlert(
                `${siswa.label} sudah berada di ${kelasSiswaSekarang.nama_kelas || `Kelas ${kelasSiswaSekarang.id}`}`,
                "error",
                2500,
            );
            return;
        }

        setKelasList((prev) =>
            prev.map((kelas) =>
                kelas.id === kelasId
                    ? { ...kelas, siswa: [...kelas.siswa, { ...siswa }] }
                    : kelas,
            ),
        );
    };

    const submitPemetaanBaru = (e) => {
        e.preventDefault();
        setProcessing(true);
        if (!tahunAjaran) {
            showCenterAlert("Pilih tahun ajaran terlebih dahulu", "info", 2000);
            setProcessing(false);
            return;
        }
        const payload = kelasList?.map((kelas) => ({
            kelas_id: kelas.id,
            tahun_ajaran: tahunAjaran,
            siswa_ids: kelas.siswa.map((s) => ({
                nisn: s.value,
                nama_siswa: s.label,
                jenis_kelamin: s.jenis_kelamin,
            })),
        }));

        axios
            .post(route("master.siswa.mapping-kelas"), { payload })
            .then((res) => {
                if (res.data.success === true) {
                    showAlert(res.data.msg, "success", 2000);
                } else {
                    showAlert(res.data.msg, "error", 2000);
                }
            })
            .finally(() => setProcessing(false));
    };

    const filteredSiswaList = siswaList.filter((siswa) => {
        const sudahDiKelas = kelasList?.some((kelas) =>
            kelas.siswa.some((s) => s.value === siswa.value),
        );
        return (
            !sudahDiKelas &&
            siswa.label.toLowerCase().includes(search.toLowerCase())
        );
    });

    const totalSiswa = siswaList.length;
    const totalTerpetakan = siswaList.filter((siswa) =>
        kelasList?.some((kelas) =>
            kelas.siswa.some((s) => s.value === siswa.value),
        ),
    ).length;

    const initials = (name) =>
        name
            .split(" ")
            .map((k) => k.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);

    // --- DRIVER.JS INITIATOR ---
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            nextBtnText: "Selanjutnya",
            prevBtnText: "Kembali",
            doneBtnText: "Selesai",
            steps: [
                {
                    element: "#tour-panel-siswa",
                    popover: {
                        title: "1. Daftar Siswa Tersedia",
                        description:
                            "Di panel ini terdapat daftar siswa yang belum masuk ke kelas mana pun. Anda bisa men-drag (tarik) nama siswa dari sini.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: "#tour-search-siswa",
                    popover: {
                        title: "2. Pencarian Cepat",
                        description:
                            "Jika daftar siswanya panjang, gunakan kotak pencarian ini untuk menemukan nama siswa secara instan.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#tour-panel-kelas",
                    popover: {
                        title: "3. Kartu Kelas Tujuan",
                        description:
                            "Ini adalah kartu kelas. Jatuhkan (drop) nama siswa yang Anda tarik ke dalam area kartu ini.",
                        side: "left",
                        align: "start",
                    },
                },
                {
                    element: "#tour-btn-simpan",
                    popover: {
                        title: "4. Simpan Pemetaan",
                        description:
                            "Setelah semua siswa didistribusikan ke kelasnya masing-masing, tekan tombol ini untuk menyimpan susunan kelas ke database.",
                        side: "top",
                        align: "end",
                    },
                },
            ],
        });
        driverObj.drive();
    };

    return (
        <div className="flex flex-col gap-4">
            {/* ======= HEADER & TOMBOL PANDUAN ======= */}

            <form onSubmit={submitPemetaanBaru} className="flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Distribusi Kelas
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Tarik dan letakkan siswa ke kelas yang sesuai.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={startTour}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                            <i className="fa fa-question-circle" />
                            <span className="hidden sm:inline">
                                Panduan Tarik & Jatuh
                            </span>
                        </button>
                        <button
                            id="tour-btn-simpan"
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md disabled:shadow-none transition-all duration-200"
                        >
                            {processing ? (
                                <>
                                    <i className="fa fa-spinner animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <i className="fa fa-save text-xs" />
                                    Simpan
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveSiswa(null)}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[70vh]">
                        {/* ======= PANEL KIRI: DAFTAR SISWA ======= */}
                        <div
                            id="tour-panel-siswa"
                            className="bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-sm font-medium text-gray-800">
                                        Daftar siswa
                                    </span>
                                    <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                                        {filteredSiswaList.length} belum
                                        dipetakan
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">
                                    Seret nama siswa ke kartu kelas
                                </p>

                                {/* Progress bar */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                            style={{
                                                width: totalSiswa
                                                    ? `${(totalTerpetakan / totalSiswa) * 100}%`
                                                    : "0%",
                                            }}
                                        />
                                    </div>
                                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                                        {totalTerpetakan}/{totalSiswa}
                                    </span>
                                </div>

                                {/* Search */}
                                <div
                                    id="tour-search-siswa"
                                    className="relative"
                                >
                                    <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari nama siswa..."
                                        className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all text-gray-700 placeholder-gray-300"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-100">
                                {filteredSiswaList.length > 0 ? (
                                    filteredSiswaList.map((siswa) => (
                                        <DraggableSiswa
                                            key={siswa.value}
                                            siswa={siswa}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-10 gap-2">
                                        <i className="fa fa-inbox text-2xl text-gray-200" />
                                        <span className="text-xs text-gray-400 text-center">
                                            {search
                                                ? `Tidak ada hasil untuk "${search}"`
                                                : "Belum ada siswa"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ======= PANEL KANAN: KARTU KELAS ======= */}
                        <div
                            id="tour-panel-kelas"
                            className="col-span-1 lg:col-span-3 flex flex-col overflow-hidden"
                        >
                            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                                {kelasList?.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full w-full bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 transition-all duration-200 hover:border-green-200 hover:bg-gray-50/50">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50">
                                                <i className="fa fa-inbox text-xl text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600">
                                                    Belum ada kelas
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Data kelas tidak ditemukan
                                                    pada tahun ajaran ini
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {kelasList?.map((kelas) => (
                                        <DroppableKelasCard
                                            key={kelas.id}
                                            kelas={kelas}
                                            removeSiswa={removeSiswa}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ======= FOOTER ======= */}

                    {/* ======= DRAG OVERLAY ======= */}
                    <DragOverlay
                        dropAnimation={{
                            duration: 200,
                            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                        }}
                    >
                        {activeSiswa ? (
                            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-white border-emerald-200 shadow-lg cursor-grabbing min-w-[200px]">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 rounded-full text-[11px] font-medium text-emerald-600 flex-shrink-0">
                                    {initials(activeSiswa.label)}
                                </span>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                        {activeSiswa.label}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        NISN: {activeSiswa.value}
                                    </span>
                                </div>
                                <i className="fa fa-grip-vertical text-gray-300 ml-auto" />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </form>
        </div>
    );
}
