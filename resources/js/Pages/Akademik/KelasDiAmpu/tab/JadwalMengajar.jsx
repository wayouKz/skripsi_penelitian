import Select from "react-select";
import { useEffect, useState } from "react";
import axios from "axios"; // Pastikan axios diimport

export default function JadwalMengajar({ dataKelas }) {
    const [mapel, setMapel] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMapel, setSelectedMapel] = useState("");
    const [jadwal, setJadwal] = useState([]);

    const hariKerja = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    const getJadwal = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                route("getData.get-jadwal-guru-kelas", {
                    kelas_id: dataKelas.kelas_id,
                    tahun_ajaran_id: dataKelas.tahun_ajaran_id,
                    mapel_id: selectedMapel,
                }),
            );
            if (res.data.success === false) {
                setJadwal([]);
            } else {
                setJadwal(res.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil data jadwal", error);
        }
        setLoading(false);
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
                setMapel([]);
            } else {
                setMapel(res.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil data mapel", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        getMapel();
    }, []);

    useEffect(() => {
        getJadwal();
    }, [selectedMapel]);

    // Filter jadwal berdasarkan dropdown yang dipilih
    const filteredJadwal = selectedMapel
        ? jadwal.filter((j) => j.kode_mapel === selectedMapel)
        : jadwal;

    // --- PERBAIKAN STYLES REACT-SELECT (Lebih kecil) ---
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? "#F3F4F6" : "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E5E7EB",
            borderRadius: "0.375rem", // sm
            padding: "0",
            minHeight: "28px", // Diperkecil dari 32px
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
            padding: "0px 6px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "10px", // Diperkecil
            fontWeight: "normal",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "10px", // Diperkecil
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
            fontSize: "10px", // Diperkecil
            fontWeight: "500",
            cursor: "pointer",
            padding: "4px 8px", // Padding opsi diperkecil
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
        dropdownIndicator: (base) => ({
            ...base,
            padding: "2px", // Panah diperkecil
        }),
        clearIndicator: (base) => ({
            ...base,
            padding: "2px",
        }),
    };

    const mapels = mapel.map((item) => ({
        value: item.kode_mapel,
        label: item.mapel || item.nama_mapel,
    }));

    return (
        <>
            {/* Header & Filter Section (Diperkecil gap dan padding-nya) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-sm">
                        <i className="fa fa-calendar text-white text-sm"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight m-0">
                            Jadwal Mengajar
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Jadwal mengajar
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-[160px]">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5 block">
                        Mata Pelajaran
                    </label>
                    <Select
                        options={mapels}
                        value={
                            selectedMapel
                                ? mapels.find(
                                      (opt) => opt.value === selectedMapel,
                                  ) || null
                                : null
                        }
                        onChange={(opt) =>
                            setSelectedMapel(opt ? opt.value : "")
                        }
                        isClearable={true}
                        styles={customSelectStyles}
                        placeholder="Pilih Mapel..."
                    />
                </div>
            </div>

            {/* Calendar / Timetable Grid Section */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <i className="fa fa-spinner fa-spin text-2xl text-green-500"></i>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                    {hariKerja.map((hari, index) => {
                        const jadwalHariIni = filteredJadwal.filter(
                            (j) => j.hari === hari,
                        );

                        return (
                            <div
                                key={index}
                                className="flex flex-col bg-gray-50 rounded-md overflow-hidden border border-gray-200"
                            >
                                {/* Header Hari */}
                                <div className="bg-green-600 text-white text-center py-1.5 font-bold text-[11px] tracking-wider uppercase shadow-sm">
                                    {hari}
                                </div>

                                {/* List Jadwal per Hari */}
                                <div className="p-2 flex flex-col gap-2 min-h-[120px]">
                                    {jadwalHariIni.length > 0 ? (
                                        jadwalHariIni.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white p-2 rounded-md shadow-sm border-l-[3px] border-green-500 hover:shadow-md transition-shadow relative group"
                                            >
                                                <div className="text-[10px] font-semibold text-gray-500 mb-0.5 flex items-center gap-1">
                                                    <i className="fa fa-clock-o"></i>
                                                    {item.jam_mulai.substring(
                                                        0,
                                                        5,
                                                    )}{" "}
                                                    -{" "}
                                                    {item.jam_selesai.substring(
                                                        0,
                                                        5,
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-gray-800 leading-tight mb-1">
                                                    {item.nama_mapel}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <i className="fa fa-map-marker text-green-600"></i>{" "}
                                                    {item.nama_kelas ||
                                                        "Kelas X-1"}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-[10px] text-gray-400 italic text-center p-2 border-2 border-dashed border-gray-200 rounded-md">
                                            - Kosong -
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
