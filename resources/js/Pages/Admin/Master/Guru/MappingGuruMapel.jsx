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
import DroppableMapelRow from "./partials/DroppableMapelRow";
import DraggableGuru from "./partials/DraggableGuru";
import DragGhost from "./partials/DragGhost";
import Select from "react-select";
import { useEffect, useState, useCallback, useMemo } from "react";

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

    // State untuk total jam dari Database (Server)
    const [totalJamServer, setTotalJamServer] = useState({
        10: 0,
        11: 0,
        12: 0,
    });

    // --- STYLING CUSTOM UNTUK REACT-SELECT ---
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: !selectedTahunAjaran ? "#FEF3C7" : "#F9FAFB",
            borderColor: state.isFocused
                ? "#10B981"
                : !selectedTahunAjaran
                  ? "#FCD34D"
                  : "#D1D5DB",
            borderRadius: "0.5rem",
            minHeight: "36px",
            padding: "0 2px",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
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
            fontSize: "0.75rem",
            fontWeight: "500",
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
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

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
                    unique_id: `existing-${g.nip}-${g.kelas_id}-${Math.random().toString(36).substring(2, 9)}`,
                    value: g.nip,
                    label: g.nama,
                    beban_jam: g.beban_jam || "",
                    kelas_id: g.kelas_id || "",
                })),
            }));
            setMapelList(data);
        } catch (error) {
            // console.error("Gagal mengambil data mapel:", error);
            showCenterAlert(
                "Gagal mengambil data mapel. Silakan coba lagi.",
                "error",
                2000,
            );
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
            showCenterAlert(
                "Gagal mengambil data guru. Silakan coba lagi.",
                "error",
                2000,
            );
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

    const handleGuruDataChange = useCallback(
        (mapelId, uniqueId, field, value) => {
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
        },
        [],
    );

    const removeGuru = useCallback((mapelId, uniqueId) => {
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
    }, []);

    // ==========================================
    // VARIAN 1: Hitung dari Database via Fetch
    // ==========================================
    const fetchTotalJam = useCallback(async () => {
        if (!selectedTahunAjaran) return;

        try {
            const res = await axios.get(route("getData.get-total-jam"), {
                params: {
                    tingkat: [10, 11, 12],
                    tahun_ajaran_id: selectedTahunAjaran,
                },
            });

            if (res.data.success) {
                setTotalJamServer({
                    10: res.data.data.tingkat10.total_jam,
                    11: res.data.data.tingkat11.total_jam,
                    12: res.data.data.tingkat12.total_jam,
                });
            }
        } catch (error) {
            console.error("Gagal mengambil total jam server:", error);
        }
    }, [selectedTahunAjaran]);

    useEffect(() => {
        if (open && selectedTahunAjaran) {
            fetchTotalJam();
        }
    }, [open, selectedTahunAjaran]);

    // ==========================================
    // VARIAN 2: Hitung Real-time saat Input (Frontend)
    // ==========================================
    const totalJamRealtime = useMemo(() => {
        const hasil = { 10: 0, 11: 0, 12: 0 };

        mapelList.forEach((mapel) => {
            (mapel.guru || []).forEach((g) => {
                if (!g.kelas_id || !g.beban_jam) return;

                const kelasObj = kelasList.find(
                    (k) =>
                        Number(k.id || k.kelas_id || k.value) ===
                        Number(g.kelas_id),
                );

                if (kelasObj) {
                    const tingkat = Number(kelasObj.tingkat);
                    const jam = Number(g.beban_jam) || 0;

                    if (hasil[tingkat] !== undefined) {
                        hasil[tingkat] += jam;
                    }
                }
            });
        });

        return hasil;
    }, [mapelList, kelasList]);

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
                    fetchTotalJam(); // Refresh data server setelah simpan
                } else {
                    showCenterAlert(res.data.msg, "error", 2000);
                }
            });
    };

    const filteredGuruList = guruList.filter((g) =>
        g.label.toLowerCase().includes(search.toLowerCase()),
    );

    const tahunAjaranOptions = (tahunAjaranList || []).map((ta) => ({
        value: ta.value,
        label: ta.label,
    }));

    const selectedTahunAjaranOption =
        tahunAjaranOptions.find(
            (opt) => String(opt.value) === String(selectedTahunAjaran),
        ) || null;

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
                    <span className="font-semibold text-gray-700 ">
                        Tarik dan Jatuh (Drag & Drop)
                    </span>
                    .
                </p>
                <div className="flex gap-2 items-center">
                    <div className="w-[200px]">
                        <Select
                            value={selectedTahunAjaranOption}
                            onChange={(option) =>
                                setSelectedTahunAjaran(
                                    option ? option.value : "",
                                )
                            }
                            options={tahunAjaranOptions}
                            placeholder="-- Pilih Tahun Ajaran --"
                            isSearchable={true}
                            menuPortalTarget={document.body}
                            className="text-xs"
                            classNamePrefix="react-select"
                            styles={customSelectStyles}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={startTour}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200 rounded-lg text-xs font-bold transition-all shadow-sm"
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
                                className="w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-primary-500/30"
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

            {/* Footer Gabungan Database & Real-time */}
            {/* Sisi Kiri: Total Jam Server (Database) */}
            {/* Footer Gabungan Satu UI */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 px-5 py-3 border border-gray-200 text-xs text-gray-600 rounded-xl mt-4 gap-3 shadow-sm">
                <div className="flex items-center gap-2 justify-end">
                    <small className="font-bold text-gray-800">
                        Total Jam :
                    </small>
                    <span className="bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm text-gray-700">
                        X:{" "}
                        <strong className="font-bold text-primary-600">
                            {totalJamRealtime[10]}
                        </strong>{" "}
                        Jam
                    </span>
                    <span className="bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm text-gray-700">
                        XI:{" "}
                        <strong className="font-bold text-primary-600">
                            {totalJamRealtime[11]}
                        </strong>{" "}
                        Jam
                    </span>
                    <span className="bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm text-gray-700">
                        XII:{" "}
                        <strong className="font-bold text-primary-600">
                            {totalJamRealtime[12]}
                        </strong>{" "}
                        Jam
                    </span>
                </div>
            </div>
        </FormModal>
    );
}
