import { useEffect, useState } from "react";
import Select from "react-select";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function ChartRekapKehadiranSiswa({ siswa, onMapelChange }) {
    const [mapel, setMapel] = useState([]);

    // Set default nilai awal ke "Semua Mata Pelajaran" ({ value: "", label: "Semua Mata Pelajaran" })
    const [selectedMapel, setSelectedMapel] = useState({
        value: "",
        label: "Semua Mata Pelajaran",
    });

    const [rekapPerMapel, setRekapPerMapel] = useState({
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
    });
    const [rincianMapel, setRincianMapel] = useState([]);
    const [tipeData, setTipeData] = useState("all");

    const getMapel = async () => {
        try {
            const res = await axios.get(route("master.mapel.getMapel"));
            if (res.data.status == false) {
                setMapel([]);
            } else {
                setMapel(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat mata pelajaran:", error);
            setMapel([]);
        }
    };

    useEffect(() => {
        getMapel();
    }, [siswa]);

    const getRekapByMapel = async (mapelId) => {
        try {
            const res = await axios.get(
                route("dashboard.get-rekap-kehadiran-siswa", {
                    kelas_id: siswa?.kelas_id,
                    tahun_ajaran_id: siswa?.tahun_ajaran_id,
                    mapel_id: mapelId,
                    siswa_id: siswa?.siswa_id,
                }),
            );
            if (res.data.status === false) {
                setRekapPerMapel({ hadir: 0, izin: 0, sakit: 0, alpa: 0 });
                setRincianMapel([]);
            } else {
                if (res.data.type === "all") {
                    setTipeData("all");
                    setRekapPerMapel(res.data.data.total_rekap);
                    setRincianMapel(res.data.data.rincian_per_mapel || []);
                } else {
                    setTipeData("single");
                    setRekapPerMapel(res.data.data);
                    setRincianMapel([]);
                }
            }
        } catch (error) {
            console.error("Gagal memuat rekap kehadiran:", error);
            setRekapPerMapel({ hadir: 0, izin: 0, sakit: 0, alpa: 0 });
            setRincianMapel([]);
        }
    };

    useEffect(() => {
        if (siswa?.siswa_id) {
            // Jika selectedMapel null, fallback ke string kosong ""
            const mapelId = selectedMapel ? selectedMapel.value : "";
            getRekapByMapel(mapelId);
        }
    }, [siswa, selectedMapel]);

    const optionsSelect = [
        { value: "", label: "Semua Mata Pelajaran" },
        ...mapel.map((item) => ({
            value: item.id || item.kode_mapel || item.mapel_id,
            label: item.nama_mapel || item.mapel,
        })),
    ];

    const handleChange = (selectedOption) => {
        // Jika user menghapus pilihan (clear), kembalikan otomatis ke "Semua Mata Pelajaran"
        const defaultOption = { value: "", label: "Semua Mata Pelajaran" };
        const activeOption = selectedOption || defaultOption;

        setSelectedMapel(activeOption);
        if (onMapelChange) {
            onMapelChange(activeOption.value);
        }
    };

    const chartData = {
        labels: ["Hadir", "Izin", "Sakit", "Alpa"],
        datasets: [
            {
                label: "Jumlah Kehadiran",
                data: [
                    rekapPerMapel?.hadir || 0,
                    rekapPerMapel?.izin || 0,
                    rekapPerMapel?.sakit || 0,
                    rekapPerMapel?.alpa || 0,
                ],
                backgroundColor: [
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                ],
                borderColor: [
                    "rgb(16, 185, 129)",
                    "rgb(59, 130, 246)",
                    "rgb(245, 158, 11)",
                    "rgb(239, 68, 68)",
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    boxWidth: 12,
                    font: {
                        size: 11,
                    },
                },
            },
        },
    };

    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? "#F3F4F6" : "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E5E7EB",
            borderRadius: "0.5rem",
            padding: "2px",
            minHeight: "36px",
            boxShadow: state.isFocused
                ? "0 0 0 2px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            "&:hover": {
                borderColor: state.isDisabled ? "#E5E7EB" : "#10B981",
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0px 8px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "11px",
            fontWeight: "normal",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "11px",
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
            fontSize: "11px",
            fontWeight: "500",
            cursor: "pointer",
            padding: "8px 12px",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
        dropdownIndicator: (base) => ({
            ...base,
            padding: "4px",
            color: "#6B7280",
        }),
        clearIndicator: (base) => ({
            ...base,
            padding: "4px",
            color: "#6B7280",
        }),
    };

    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
                Rekap Kehadiran Berdasarkan Mapel
            </h3>

            {/* Dropdown Select Mata Pelajaran */}
            <div className="w-full mb-4">
                <Select
                    value={selectedMapel}
                    onChange={handleChange}
                    options={optionsSelect}
                    styles={customSelectStyles}
                    placeholder="Pilih Mata Pelajaran..."
                    isClearable={false}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                />
            </div>

            {/* Pie / Doughnut Chart Container */}
            <div className="w-full h-52 flex items-center justify-center mb-4">
                <Doughnut data={chartData} options={chartOptions} />
            </div>

            {/* Rincian Per Mapel jika memilih "Semua Mata Pelajaran" */}
            {tipeData === "all" && rincianMapel.length > 0 && (
                <div className="mt-2 border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">
                        Rincian Kehadiran Tiap Mata Pelajaran:
                    </h4>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {rincianMapel.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex justify-between items-center"
                            >
                                <span className="font-semibold text-slate-800">
                                    {item.nama_mapel}
                                </span>
                                <div className="flex gap-2 text-[11px]">
                                    <span className="text-emerald-600 font-medium">
                                        H: {item.hadir}
                                    </span>
                                    <span className="text-blue-600 font-medium">
                                        I: {item.izin}
                                    </span>
                                    <span className="text-amber-600 font-medium">
                                        S: {item.sakit}
                                    </span>
                                    <span className="text-rose-600 font-medium">
                                        A: {item.alpa}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
