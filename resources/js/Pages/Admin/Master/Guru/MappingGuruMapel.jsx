import { useEffect, useState } from "react";
import FormModal from "@/Components/FormModal";
import {
    DndContext,
    useDraggable,
    useDroppable,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
} from "@dnd-kit/core";
import axios from "axios";
import { useAlert } from "@/Components/AlertContext";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// ─── Avatar Initials ──────────────────────────────────────────────────────────
function Avatar({ name, size = "sm", color = "green" }) {
    const initials = name
        .split(" ")
        .map((k) => k.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sizes = { sm: "w-7 h-7 text-[11px]", md: "w-8 h-8 text-xs" };
    const colors = {
        green: "bg-green-100 text-green-700",
        violet: "bg-violet-100 text-violet-700",
        sky: "bg-sky-100 text-sky-700",
    };

    return (
        <span
            className={`inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 ${sizes[size]} ${colors[color]}`}
        >
            {initials}
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MappingGuruMapel({
    open,
    setOpen,
    guruOptions = [],
    getGuruMapel,
}) {
    const { showCenterAlert, showAlert } = useAlert();
    const [mapelList, setMapelList] = useState([]);
    const [guruList, setGuruList] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [activeGuru, setActiveGuru] = useState(null);
    const [search, setSearch] = useState("");
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("");

    useEffect(() => {
        if (open) {
            getMapelList();
            getGuru();
            getKelasList();
            getTahunAjaranList();
        }
    }, [open]);

    useEffect(() => {
        if (open && selectedTahunAjaran !== "") {
            getMapelList();
        }
    }, [selectedTahunAjaran]);

    const getKelasList = async () => {
        try {
            const res = await axios.get(route("getData.get-kelas"));
            setKelasList(res.data.data || res.data || []);
        } catch (error) {
            console.error("Gagal mengambil data kelas:", error);
        }
    };

    const getTahunAjaranList = async () => {
        try {
            const res = await axios.get(route("getData.get-tahun-ajaran"));
            const dataTA = res.data.data || res.data || [];

            setTahunAjaranList(dataTA);

            const activeTA = dataTA.find(
                (ta) => ta.status === "active" || ta.status === 1,
            );

            if (activeTA) {
                setSelectedTahunAjaran(activeTA.value);
            }
        } catch (error) {
            console.error("Gagal mengambil data tahun ajaran:", error);
        }
    };

    const getMapelList = async () => {
        try {
            const res = await axios.get(route("getData.get-mapel-guru"), {
                params: {
                    tahun_ajaran_id: selectedTahunAjaran,
                },
            });
            const data = res.data.data.map((item) => ({
                ...item,
                guru: (item.guru || []).map((g) => ({
                    ...g,
                    // 🌟 PERBAIKAN 1: Tambahkan String random agar unique_id benar-benar unik
                    // meskipun data dari DB ada yang kembar/duplikat.
                    unique_id: `existing-${g.nip}-${g.kelas_id}-${Math.random().toString(36).substring(2, 9)}`,
                    value: g.nip,
                    label: g.nama,
                    beban_jam: g.beban_jam || "",
                    kelas_id: g.kelas_id || "",
                })),
            }));
            setMapelList(data);
        } catch (error) {
            console.error("Gagal mengambil data mapel:", error);
        }
    };

    const getGuru = async () => {
        try {
            const res = await axios.get(route("getData.get-list-guru"));
            if (!res.data.success) {
                setGuruList([]);
                showCenterAlert(res.data.msg, "info", 2000);
            } else {
                const data = res.data.data.map((guru) => ({
                    value: guru.nip,
                    label: guru.nama_guru,
                    mapel: guru.mapel,
                }));
                setGuruList(data);
            }
        } catch (error) {
            console.error("Gagal mengambil data guru:", error);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleDragStart = ({ active }) => setActiveGuru(active.data.current);

    const handleDragEnd = ({ active, over }) => {
        setActiveGuru(null);
        if (!over) return;

        const guruId = active.id;
        const mapelId = Number(over.id);
        const guru =
            guruList.find((g) => g.value === guruId) ||
            guruOptions.find((g) => g.value === guruId);
        if (!guru) return;

        setMapelList((prev) =>
            prev.map((mapel) => {
                if (mapel.id !== mapelId) return mapel;

                const uniqueId = `${guruId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                return {
                    ...mapel,
                    guru: [
                        ...mapel.guru,
                        {
                            ...guru,
                            unique_id: uniqueId,
                            beban_jam: "",
                            kelas_id: "",
                        },
                    ],
                };
            }),
        );
    };

    const handleGuruDataChange = (mapelId, uniqueId, field, value) => {
        setMapelList((prev) =>
            prev.map((mapel) =>
                mapel.id !== mapelId
                    ? mapel
                    : {
                          ...mapel,
                          guru: mapel.guru.map((g) =>
                              g.unique_id === uniqueId
                                  ? { ...g, [field]: value }
                                  : g,
                          ),
                      },
            ),
        );
    };

    const removeGuru = (mapelId, uniqueId) => {
        setMapelList((prev) =>
            prev.map((m) =>
                m.id === mapelId
                    ? {
                          ...m,
                          guru: m.guru.filter((g) => g.unique_id !== uniqueId),
                      }
                    : m,
            ),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        if (!selectedTahunAjaran) {
            showCenterAlert(
                "Pilih Tahun Ajaran terlebih dahulu di bagian atas.",
                "info",
                2500,
            );
            return;
        }

        const hasEmpty = mapelList.some((m) =>
            m.guru.some((g) => g.beban_jam === "" || g.kelas_id === ""),
        );

        if (hasEmpty) {
            showCenterAlert(
                "Lengkapi Kelas dan Beban Jam untuk semua guru yang ditetapkan.",
                "info",
                2500,
            );
            return;
        }

        const payload = mapelList.map((mapel) => ({
            mapel_id: mapel.id,
            gurus: mapel.guru.map((g) => ({
                guru_id: g.value,
                kelas_id: Number(g.kelas_id),
                beban_jam: Number(g.beban_jam) || 0,
            })),
        }));

        axios
            .post(route("master.guru.mapping-mappel"), {
                payload,
                tahun_ajaran_id: Number(selectedTahunAjaran),
            })
            .then((res) => {
                if (res.data.success) {
                    showAlert(res.data.msg, "success", 2000);
                    getGuruMapel();
                } else {
                    showCenterAlert(res.data.msg, "error", 2000);
                }
            });
    };

    const filteredGuruList = guruList.filter((g) =>
        g.label.toLowerCase().includes(search.toLowerCase()),
    );

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            nextBtnText: "Selanjutnya",
            prevBtnText: "Kembali",
            doneBtnText: "Selesai",
            steps: [
                {
                    element: "#tour-panel-guru",
                    popover: {
                        title: "1. Daftar Guru",
                        description:
                            "Di panel ini terdapat daftar seluruh guru. Klik dan tahan pada nama guru.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: "#tour-tabel-mapel",
                    popover: {
                        title: "2. Jatuhkan & Lengkapi",
                        description:
                            "Jatuhkan guru ke mapel. PENTING: Pilih Kelas dan isi Beban Jam. Jika guru mengajar di kelas lain, tarik lagi guru tersebut ke baris ini.",
                        side: "left",
                        align: "start",
                    },
                },
            ],
        });
        driverObj.drive();
    };

    return (
        <FormModal
            title="Penugasan Guru Mata Pelajaran"
            show={open}
            setOpen={setOpen}
            onClose={() => setOpen(false)}
            maxWidth="full"
            onSubmit={submit}
        >
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                    Sistem pemetaan pengajar berbasis{" "}
                    <span className="font-semibold text-gray-700">
                        Tarik dan Jatuh (Drag & Drop)
                    </span>
                    .
                </p>
                <div className="flex gap-2 items-center">
                    <select
                        className={`h-8 text-xs rounded border focus:ring-2 focus:outline-none transition px-2 py-0 ${!selectedTahunAjaran ? "bg-amber-50 border-amber-300 ring-1 ring-amber-200 text-amber-800" : "bg-gray-50 border-gray-300"}`}
                        value={selectedTahunAjaran}
                        onChange={(e) => {
                            setSelectedTahunAjaran(e.target.value);
                        }}
                    >
                        <option value="">-- Pilih Tahun Ajaran --</option>
                        {tahunAjaranList.map((ta) => (
                            <option key={ta.value} value={ta.value}>
                                {ta.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={startTour}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                        <i className="fa fa-info-circle" />
                        <span>Panduan Penggunaan</span>
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveGuru(null)}
            >
                <div className="flex gap-5 h-[72vh]">
                    {/* Left Panel */}
                    <aside
                        id="tour-panel-guru"
                        className="w-64 flex-shrink-0 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                                Daftar Guru
                            </p>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari guru…"
                                className="w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-green-500/30"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                            {filteredGuruList.map((guru) => (
                                <DraggableGuru key={guru.value} guru={guru} />
                            ))}
                        </div>
                    </aside>

                    {/* Right Panel */}
                    <div
                        id="tour-tabel-mapel"
                        className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
                                    <tr>
                                        <th className="w-56 px-5 py-3 text-left text-[11px] font-semibold uppercase text-gray-500 border-b">
                                            Nama Mata Pelajaran
                                        </th>
                                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-gray-500 border-b">
                                            Guru, Kelas, & Beban Jam
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {mapelList.map((mapel, index) => (
                                        <DroppableMapelRow
                                            key={mapel.id}
                                            mapel={mapel}
                                            index={index}
                                            kelasList={kelasList}
                                            removeGuru={removeGuru}
                                            handleGuruDataChange={
                                                handleGuruDataChange
                                            }
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeGuru ? <DragGhost guru={activeGuru} /> : null}
                </DragOverlay>
            </DndContext>
        </FormModal>
    );
}

// ─── Drag Ghost ───────────────────────────────────────────────────────────────
function DragGhost({ guru }) {
    return (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-green-300 shadow-xl ring-1 ring-green-100 cursor-grabbing w-52 opacity-90 scale-105">
            <Avatar name={guru?.label} size="sm" color="green" />
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                    {guru.label}
                </p>
            </div>
        </div>
    );
}

// ─── Draggable Guru Card ──────────────────────────────────────────────────────
function DraggableGuru({ guru }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: guru.value,
        data: guru,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-grab transition-all
                ${isDragging ? "opacity-40 bg-gray-50" : "bg-white hover:border-green-300 hover:bg-green-50/30"}`}
        >
            <Avatar name={guru.label} size="sm" color="green" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                    {guru.label}
                </p>
            </div>
        </div>
    );
}

// ─── Droppable Mapel Row ──────────────────────────────────────────────────────
function DroppableMapelRow({
    mapel,
    index,
    kelasList,
    removeGuru,
    handleGuruDataChange,
}) {
    const { setNodeRef, isOver } = useDroppable({ id: String(mapel.id) });

    // 🌟 PERBAIKAN 2: Mengumpulkan ID Kelas yang sudah terpakai di mata pelajaran ini
    const takenKelasIds = mapel.guru
        .map((g) => String(g.kelas_id))
        .filter((id) => id !== "");

    return (
        <tr
            className={`transition-colors ${isOver ? "bg-green-50/40" : "hover:bg-gray-50/50"}`}
        >
            <td className="px-5 py-3.5 align-top w-56">
                <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded text-[10px] bg-gray-100 text-gray-500">
                        {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                        {mapel.mapel || mapel.nama_mapel}
                    </span>
                </div>
            </td>
            <td className="px-5 py-3">
                <div
                    ref={setNodeRef}
                    className={`min-h-[48px] rounded-lg border-2 px-2.5 py-2 flex flex-wrap gap-2 items-center transition-all ${isOver ? "border-green-400 bg-green-50 border-dashed" : "border-transparent"}`}
                >
                    {mapel.guru.map((guru) => (
                        <GuruChip
                            key={guru.unique_id}
                            guru={guru}
                            mapelId={mapel.id}
                            kelasList={kelasList}
                            takenKelasIds={takenKelasIds} // 👈 Kirim data kelas yang sudah terpakai
                            onRemove={removeGuru}
                            onChangeData={handleGuruDataChange}
                        />
                    ))}
                    {mapel.guru.length === 0 && (
                        <p
                            className={`text-xs w-full text-center ${isOver ? "text-green-500 font-medium" : "text-gray-400"}`}
                        >
                            {isOver
                                ? "↓ Lepaskan di sini"
                                : "Seret guru ke sini"}
                        </p>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ─── Guru Chip ───────────────────────────────────────────────────────────────
function GuruChip({
    guru,
    mapelId,
    kelasList,
    takenKelasIds,
    onRemove,
    onChangeData,
}) {
    const errorKelas = guru.kelas_id === "";
    const errorJam = guru.beban_jam === "" || Number(guru.beban_jam) <= 0;
    const hasError = errorKelas || errorJam;

    return (
        <div
            className={`inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${hasError ? "bg-white border-amber-300 ring-1 ring-amber-200/60" : "bg-white border-gray-200 shadow-sm"}`}
        >
            <Avatar name={guru.label} size="sm" color="green" />
            <span
                className="text-xs font-semibold text-gray-700 max-w-[100px] truncate"
                title={guru.label}
            >
                {guru.label}
            </span>
            <span className="w-px h-4 bg-gray-200 flex-shrink-0" />

            {/* Dropdown Kelas */}
            <select
                value={guru.kelas_id}
                onChange={(e) =>
                    onChangeData(
                        mapelId,
                        guru.unique_id,
                        "kelas_id",
                        e.target.value,
                    )
                }
                className={`w-24 h-7 text-xs rounded border bg-gray-50 focus:ring-2 focus:outline-none transition px-1 ${errorKelas ? "border-amber-300 text-amber-700" : "border-gray-200"}`}
            >
                <option value="">-- Kelas --</option>
                {kelasList
                    .filter((k) => String(k.value).toLowerCase() !== "all")
                    .map((k) => {
                        // 🌟 PERBAIKAN 3: Logika Disable Kelas
                        const isTaken = takenKelasIds.includes(String(k.value));
                        const isCurrent =
                            String(guru.kelas_id) === String(k.value);

                        // Disable jika sudah terpakai DAN bukan yang sedang terpilih saat ini
                        const isDisabled = isTaken && !isCurrent;

                        return (
                            <option
                                key={k.value}
                                value={k.value}
                                disabled={isDisabled}
                                className={
                                    isDisabled
                                        ? "bg-gray-100 text-gray-400"
                                        : ""
                                }
                            >
                                {k.label} {isDisabled ? " (Terpakai)" : ""}
                            </option>
                        );
                    })}
            </select>

            {/* Input Beban Jam */}
            <div className="flex items-center gap-1">
                <input
                    type="number"
                    min="1"
                    value={guru.beban_jam}
                    onChange={(e) =>
                        onChangeData(
                            mapelId,
                            guru.unique_id,
                            "beban_jam",
                            e.target.value,
                        )
                    }
                    placeholder="Jam"
                    className={`w-14 h-7 text-xs text-center rounded border bg-gray-50 focus:ring-2 focus:outline-none px-1 ${errorJam ? "border-amber-300" : "border-gray-200"}`}
                />
            </div>

            {/* Tombol Hapus */}
            <button
                type="button"
                onClick={() => onRemove(mapelId, guru.unique_id)}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
            >
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    );
}
