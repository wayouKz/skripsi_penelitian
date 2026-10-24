import FormModal from "@/Components/FormModal";
import {
    DndContext,
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
import {
    memo,
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import AppSelect from "@/Components/AppSelect";
import TextInput from "@/Components/TextInput";

/* ------------------------------------------------------------------ */
/* Panel guru: state `search` dipisah supaya ketikan tidak me-render   */
/* ulang seluruh modal & tabel mapel.                                  */
/* ------------------------------------------------------------------ */
const GuruPanel = memo(function GuruPanel({ guruList, loading }) {
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);

    const filtered = useMemo(() => {
        const q = deferredSearch.trim().toLowerCase();
        if (!q) return guruList;
        return guruList.filter((g) => g.label.toLowerCase().includes(q));
    }, [guruList, deferredSearch]);

    return (
        <aside
            id="tour-panel-guru"
            className="w-64 flex-shrink-0 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
        >
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Daftar Guru
                </p>
                <TextInput
                    icon="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari guru…"
                />
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                {loading ? (
                    <GuruSkeletonList />
                ) : (
                    filtered.map((guru) => (
                        <DraggableGuru key={guru.value} guru={guru} />
                    ))
                )}
            </div>
        </aside>
    );
});

/* ------------------------------------------------------------------ */
/* Footer total jam: dipisah supaya hanya dirender saat total berubah  */
/* ------------------------------------------------------------------ */
const TotalJamFooter = memo(function TotalJamFooter({ total }) {
    const items = [
        { label: "X", value: total[10] },
        { label: "XI", value: total[11] },
        { label: "XII", value: total[12] },
    ];

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 px-5 py-3 border border-gray-200 text-xs text-gray-600 rounded-xl mt-4 gap-3 shadow-sm">
            <div className="flex items-center gap-2 justify-end">
                <small className="font-bold text-gray-800">Total Jam :</small>
                {items.map((it) => (
                    <span
                        key={it.label}
                        className="bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm text-gray-700"
                    >
                        {it.label}:{" "}
                        <strong className="font-bold text-primary-600">
                            {it.value}
                        </strong>{" "}
                        Jam
                    </span>
                ))}
            </div>
        </div>
    );
});

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */
const GuruSkeletonList = memo(function GuruSkeletonList({ count = 10 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-white animate-pulse"
                >
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex-shrink-0" />
                    <div
                        className="h-3 rounded bg-gray-200"
                        style={{ width: `${55 + ((i * 17) % 35)}%` }}
                    />
                </div>
            ))}
        </>
    );
});

const MapelSkeletonRows = memo(function MapelSkeletonRows({ count = 8 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="w-56 px-5 py-4 align-top">
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded bg-gray-200" />
                            <div
                                className="h-3 rounded bg-gray-200"
                                style={{ width: `${60 + ((i * 13) % 30)}%` }}
                            />
                        </div>
                    </td>
                    <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: (i % 3) + 1 }).map(
                                (__, j) => (
                                    <div
                                        key={j}
                                        className="h-9 w-72 rounded-lg bg-gray-100 border border-gray-200"
                                    />
                                ),
                            )}
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
});

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
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("");
    const [loadingGuru, setLoadingGuru] = useState(true);
    const [loadingMapel, setLoadingMapel] = useState(true);

    // counter id: lebih murah & stabil dibanding Math.random() per item
    const uidRef = useRef(0);
    const nextUid = () => `g-${++uidRef.current}`;

    // untuk mengabaikan response lama (race condition saat ganti tahun ajaran)
    const mapelRequestRef = useRef(0);

    /* ---------------------------- FETCHERS ---------------------------- */

    const getKelasList = useCallback(async () => {
        try {
            const res = await axios.get(route("getData.get-kelas"));
            setKelasList(res.data.data || res.data || []);
        } catch (error) {
            console.error("Gagal mengambil data kelas:", error);
        }
    }, []);

    const getTahunAjaranList = useCallback(async () => {
        try {
            const res = await axios.get(route("getData.get-tahun-ajaran"));
            const dataTA = res.data.data || res.data || [];
            setTahunAjaranList(dataTA);

            const activeTA = dataTA.find(
                (ta) => ta.status === "active" || ta.status === 1,
            );
            if (activeTA) {
                setSelectedTahunAjaran((prev) => prev || activeTA.value);
            } else {
                // tidak ada tahun ajaran aktif: jangan skeleton selamanya
                setLoadingMapel(false);
            }
        } catch (error) {
            console.error("Gagal mengambil data tahun ajaran:", error);
            setLoadingMapel(false);
        }
    }, []);

    const getGuru = useCallback(async () => {
        setLoadingGuru(true);
        try {
            const res = await axios.get(route("getData.get-list-guru"));
            if (!res.data.success) {
                setGuruList([]);
                showCenterAlert(res.data.msg, "info", 2000);
            } else {
                setGuruList(
                    res.data.data.map((guru) => ({
                        value: guru.nip,
                        label: guru.nama_guru,
                        mapel: guru.mapel,
                    })),
                );
            }
        } catch (error) {
            showCenterAlert(
                "Gagal mengambil data guru. Silakan coba lagi.",
                "error",
                2000,
            );
        } finally {
            setLoadingGuru(false);
        }
    }, [showCenterAlert]);

    const getMapelList = useCallback(
        async (tahunAjaranId) => {
            const reqId = ++mapelRequestRef.current;
            setLoadingMapel(true);
            try {
                const res = await axios.get(route("getData.get-mapel-guru"), {
                    params: { tahun_ajaran_id: tahunAjaranId },
                });

                // abaikan jika sudah ada request yang lebih baru
                if (reqId !== mapelRequestRef.current) return;

                const data = res.data.data.map((item) => ({
                    ...item,
                    guru: (item.guru || []).map((g) => ({
                        ...g,
                        unique_id: `existing-${nextUid()}`,
                        value: g.nip,
                        label: g.nama,
                        beban_jam: g.beban_jam || "",
                        kelas_id: g.kelas_id || "",
                    })),
                }));
                setMapelList(data);
            } catch (error) {
                if (reqId !== mapelRequestRef.current) return;
                showCenterAlert(
                    "Gagal mengambil data mapel. Silakan coba lagi.",
                    "error",
                    2000,
                );
            } finally {
                if (reqId === mapelRequestRef.current) {
                    setLoadingMapel(false);
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [showCenterAlert],
    );

    /* ----------------------------- EFFECTS ---------------------------- */

    // Data yang tidak bergantung tahun ajaran: sekali saat modal dibuka
    useEffect(() => {
        if (!open) return;
        setLoadingMapel(true);
        getGuru();
        getKelasList();
        getTahunAjaranList();
    }, [open, getGuru, getKelasList, getTahunAjaranList]);

    // Mapel hanya diambil setelah tahun ajaran terpilih (tidak dobel fetch)
    useEffect(() => {
        if (open && selectedTahunAjaran) {
            getMapelList(selectedTahunAjaran);
        }
    }, [open, selectedTahunAjaran, getMapelList]);

    /* ------------------------------ DND ------------------------------- */

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const guruMap = useMemo(() => {
        const m = new Map();
        guruOptions.forEach((g) => m.set(g.value, g));
        guruList.forEach((g) => m.set(g.value, g)); // guruList menimpa guruOptions
        return m;
    }, [guruList, guruOptions]);

    const handleDragStart = useCallback(
        ({ active }) => setActiveGuru(active.data.current),
        [],
    );
    const handleDragCancel = useCallback(() => setActiveGuru(null), []);

    const handleDragEnd = useCallback(
        ({ active, over }) => {
            setActiveGuru(null);
            if (!over) return;

            const guru = guruMap.get(active.id);
            if (!guru) return;

            const mapelId = Number(over.id);
            const uniqueId = nextUid();

            setMapelList((prev) =>
                prev.map((mapel) =>
                    mapel.id !== mapelId
                        ? mapel
                        : {
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
                          },
                ),
            );
        },
        [guruMap],
    );

    /* ------------------------- EDIT / HAPUS GURU ---------------------- */

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

    /* ------------------------ TOTAL JAM REAL-TIME --------------------- */

    const tingkatByKelas = useMemo(() => {
        const m = new Map();
        kelasList.forEach((k) =>
            m.set(Number(k.id || k.kelas_id || k.value), Number(k.tingkat)),
        );
        return m;
    }, [kelasList]);

    const totalJamRealtime = useMemo(() => {
        const hasil = { 10: 0, 11: 0, 12: 0 };
        for (const mapel of mapelList) {
            for (const g of mapel.guru) {
                if (!g.kelas_id || !g.beban_jam) continue;
                const tingkat = tingkatByKelas.get(Number(g.kelas_id));
                if (tingkat in hasil) {
                    hasil[tingkat] += Number(g.beban_jam) || 0;
                }
            }
        }
        return hasil;
    }, [mapelList, tingkatByKelas]);

    /* ------------------------------ SUBMIT ---------------------------- */

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
            })
            .catch(() => {
                showCenterAlert(
                    "Terjadi kesalahan saat menyimpan data.",
                    "error",
                    2000,
                );
            });
    };

    /* ----------------------------- TAHUN AJARAN ----------------------- */

    const tahunAjaranOptions = useMemo(
        () =>
            (tahunAjaranList || []).map((ta) => ({
                value: ta.value,
                label: ta.label,
            })),
        [tahunAjaranList],
    );

    const selectedTahunAjaranOption = useMemo(
        () =>
            tahunAjaranOptions.find(
                (opt) => String(opt.value) === String(selectedTahunAjaran),
            ) || null,
        [tahunAjaranOptions, selectedTahunAjaran],
    );

    const handleTahunAjaranChange = useCallback(
        (option) => setSelectedTahunAjaran(option ? option.value : ""),
        [],
    );

    /* -------------------------------- TOUR ---------------------------- */

    const startTour = useCallback(() => {
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
    }, []);

    /* ------------------------------ RENDER ---------------------------- */

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
                        <AppSelect
                            value={selectedTahunAjaranOption}
                            onChange={handleTahunAjaranChange}
                            options={tahunAjaranOptions}
                            placeholder="-- Pilih Tahun Ajaran --"
                            isSearchable={true}
                            menuPortalTarget={document.body}
                            className="text-xs"
                            classNamePrefix="react-select"
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
                onDragCancel={handleDragCancel}
            >
                <div className="flex gap-5 h-[72vh]">
                    {/* Left Panel */}
                    <GuruPanel guruList={guruList} loading={loadingGuru} />

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
                                            Guru, Kelas, & Jam Pelajaran (JP)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingMapel ? (
                                        <MapelSkeletonRows />
                                    ) : (
                                        mapelList.map((mapel, index) => (
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeGuru ? <DragGhost guru={activeGuru} /> : null}
                </DragOverlay>
            </DndContext>

            <TotalJamFooter total={totalJamRealtime} />
        </FormModal>
    );
}
