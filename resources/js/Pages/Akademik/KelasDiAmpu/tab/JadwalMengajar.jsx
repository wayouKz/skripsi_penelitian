import Select from "react-select";
import { useEffect, useState } from "react";
import axios from "axios";

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

    // Kumpulkan semua slot jam unik yang tersedia dari data jadwal untuk dijadikan kolom
    const jamUnikMap = new Map();
    filteredJadwal.forEach((item) => {
        if (item.jam_mulai && item.jam_selesai) {
            const mulai = item.jam_mulai.substring(0, 5);
            const selesai = item.jam_selesai.substring(0, 5);
            const key = `${mulai}-${selesai}`;
            if (!jamUnikMap.has(key)) {
                jamUnikMap.set(key, { jam_mulai: mulai, jam_selesai: selesai });
            }
        }
    });

    const daftarJam = Array.from(jamUnikMap.values()).sort((a, b) =>
        a.jam_mulai.localeCompare(b.jam_mulai),
    );

    // --- STYLES REACT-SELECT ---
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? "#F3F4F6" : "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E5E7EB",
            borderRadius: "0.375rem",
            padding: "0",
            minHeight: "28px",
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
            fontSize: "10px",
            fontWeight: "normal",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "10px",
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
            fontSize: "10px",
            fontWeight: "500",
            cursor: "pointer",
            padding: "4px 8px",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
        dropdownIndicator: (base) => ({
            ...base,
            padding: "2px",
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header & Filter Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-6 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-sm">
                        <i className="fa fa-calendar text-white text-sm"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight m-0">
                            Jadwal Mengajar
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Jadwal mengajar dan kelas
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-[180px]">
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

            {/* Content Section */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <i className="fa fa-spinner fa-spin text-2xl text-green-500"></i>
                </div>
            ) : (
                <div className="p-6 overflow-x-auto bg-gray-50/50">
                    <table className="w-full border-collapse min-w-max">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200 text-center">
                                <th className="p-3 font-extrabold text-gray-700 text-xs uppercase tracking-wide border-r border-gray-200 w-32 sticky left-0 bg-gray-100 z-10">
                                    Hari / Jam
                                </th>
                                {daftarJam.length > 0 ? (
                                    daftarJam.map((jam, index) => (
                                        <th
                                            key={index}
                                            className="p-3 border-r border-gray-200 min-w-[140px]"
                                        >
                                            <div className="font-extrabold text-gray-800 text-xs">
                                                {jam.jam_mulai}
                                            </div>
                                        </th>
                                    ))
                                ) : (
                                    <th className="p-3 text-gray-400 text-xs font-normal">
                                        Tidak ada jam tersedia
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {hariKerja.map((hari) => {
                                const dataHariIni = filteredJadwal.filter(
                                    (item) => item.hari === hari,
                                );

                                return (
                                    <tr
                                        key={hari}
                                        className="border-b border-gray-200 hover:bg-gray-50/80"
                                    >
                                        {/* Kolom Hari */}
                                        <td className="p-3 font-extrabold text-gray-800 text-xs uppercase tracking-wide bg-gray-50 border-r border-gray-200 text-center sticky left-0 z-10">
                                            {hari}
                                        </td>

                                        {/* Kolom Jam Pelajaran Berdasarkan Indeks Universal */}
                                        {daftarJam.map((jam, index) => {
                                            const matchItem = dataHariIni.find(
                                                (item) =>
                                                    item.jam_mulai &&
                                                    item.jam_selesai &&
                                                    item.jam_mulai.substring(
                                                        0,
                                                        5,
                                                    ) === jam.jam_mulai &&
                                                    item.jam_selesai.substring(
                                                        0,
                                                        5,
                                                    ) === jam.jam_selesai,
                                            );

                                            return (
                                                <td
                                                    key={index}
                                                    className="p-2 border-r border-gray-200 text-center align-middle"
                                                >
                                                    {matchItem ? (
                                                        <div className="p-2.5 bg-white border border-green-200 rounded-xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-center min-h-[70px]">
                                                            <div className="font-mono text-[10px] text-gray-400 mb-1">
                                                                {matchItem.jam_mulai.substring(
                                                                    0,
                                                                    5,
                                                                )}{" "}
                                                                -{" "}
                                                                {matchItem.jam_selesai.substring(
                                                                    0,
                                                                    5,
                                                                )}
                                                            </div>
                                                            <div className="font-bold text-gray-900 text-xs line-clamp-2">
                                                                {
                                                                    matchItem.nama_mapel
                                                                }
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-300 text-xs italic py-4">
                                                            -
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
