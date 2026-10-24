import { useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import AppSelect from "@/Components/AppSelect";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function getCssRgb(name, fallback) {
    if (typeof document === "undefined") return fallback;
    const v = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    return v || fallback;
}

/** "16 185 129" → "rgba(16, 185, 129, 0.8)" */
function rgbaFromCssRgb(cssRgb, alpha) {
    const parts = String(cssRgb).trim().split(/\s+/).join(", ");
    return `rgba(${parts}, ${alpha})`;
}

function rgbFromCssRgb(cssRgb) {
    const parts = String(cssRgb).trim().split(/\s+/).join(", ");
    return `rgb(${parts})`;
}

export default function ChartRekapKehadiranSiswa({ siswa, onMapelChange }) {
    const [mapel, setMapel] = useState([]);
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
    // re-render chart saat tema diganti
    const [themeTick, setThemeTick] = useState(0);

    const getMapel = async () => {
        try {
            const res = await axios.get(route("master.mapel.getMapel"));
            setMapel(res.data.status == false ? [] : res.data.data);
        } catch (error) {
            console.error("Gagal memuat mata pelajaran:", error);
            setMapel([]);
        }
    };

    useEffect(() => {
        getMapel();
    }, [siswa]);

    // Dengarkan perubahan CSS variable tema (saat admin ganti warna)
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setThemeTick((t) => t + 1);
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["style"],
        });
        return () => observer.disconnect();
    }, []);

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
            } else if (res.data.type === "all") {
                setTipeData("all");
                setRekapPerMapel(res.data.data.total_rekap);
                setRincianMapel(res.data.data.rincian_per_mapel || []);
            } else {
                setTipeData("single");
                setRekapPerMapel(res.data.data);
                setRincianMapel([]);
            }
        } catch (error) {
            console.error("Gagal memuat rekap kehadiran:", error);
            setRekapPerMapel({ hadir: 0, izin: 0, sakit: 0, alpa: 0 });
            setRincianMapel([]);
        }
    };

    useEffect(() => {
        if (siswa?.siswa_id) {
            const mapelId = selectedMapel ? selectedMapel.value : "";
            getRekapByMapel(mapelId);
        }
    }, [siswa, selectedMapel]);

    const optionsSelect = useMemo(
        () => [
            { value: "", label: "Semua Mata Pelajaran" },
            ...mapel.map((item) => ({
                value: item.id || item.kode_mapel || item.mapel_id,
                label: item.nama_mapel || item.mapel,
            })),
        ],
        [mapel],
    );

    const handleChange = (selectedOption) => {
        const defaultOption = {
            value: "",
            label: "Semua Mata Pelajaran",
        };
        const activeOption = selectedOption || defaultOption;
        setSelectedMapel(activeOption);
        onMapelChange?.(activeOption.value);
    };

    // Warna chart: Hadir = primary tema, lainnya status tetap jelas
    const chartData = useMemo(() => {
        const primary = getCssRgb("--color-primary", "16 185 129");

        return {
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
                        rgbaFromCssRgb(primary, 0.85), // Hadir → tema
                        "rgba(59, 130, 246, 0.8)", // Izin
                        "rgba(245, 158, 11, 0.8)", // Sakit
                        "rgba(239, 68, 68, 0.8)", // Alpa
                    ],
                    borderColor: [
                        rgbFromCssRgb(primary),
                        "rgb(59, 130, 246)",
                        "rgb(245, 158, 11)",
                        "rgb(239, 68, 68)",
                    ],
                    borderWidth: 1,
                },
            ],
        };
    }, [rekapPerMapel, themeTick]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    boxWidth: 12,
                    font: { size: 11 },
                },
            },
        },
    };

    return (
        <div className="bg-white p-5 rounded-3xl border border-primary-100 shadow-sm flex flex-col h-full">
            <h3 className="text-sm font-bold text-primary-800 mb-3">
                Rekap Kehadiran Berdasarkan Mapel
            </h3>

            <div className="w-full mb-4">
                <AppSelect
                    value={selectedMapel}
                    onChange={handleChange}
                    options={optionsSelect}
                    placeholder="Pilih Mata Pelajaran..."
                    isClearable={false}
                    isSearchable
                    size="md"
                />
            </div>

            <div className="w-full h-52 flex items-center justify-center mb-4">
                <Doughnut data={chartData} options={chartOptions} />
            </div>

            {tipeData === "all" && rincianMapel.length > 0 && (
                <div className="mt-2 border-t border-primary-100 pt-3">
                    <h4 className="text-xs font-bold text-primary-700 mb-2">
                        Rincian Kehadiran Tiap Mata Pelajaran:
                    </h4>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {rincianMapel.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-primary-50 p-2.5 rounded-xl border border-primary-100 text-xs flex justify-between items-center"
                            >
                                <span className="font-semibold text-primary-800">
                                    {item.nama_mapel}
                                </span>
                                <div className="flex gap-2 text-[11px]">
                                    <span className="text-primary-600 font-medium">
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
