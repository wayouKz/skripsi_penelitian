import { useEffect, useState } from "react";

export default function JadwalMengajar({ dataKelas }) {
    const [mapel, setMapel] = useState([]);
    const [loading, setLoading] = useState(false);

    // State untuk filter mata pelajaran yang dipilih
    const [selectedMapel, setSelectedMapel] = useState("");

    // --- DATA DUMMY JADWAL (Ganti ini dengan data dari API/Axios nanti) ---
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

    return (
        <>
            {/* Header & Filter Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
                        <i className="fa fa-calendar text-white text-base"></i>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 leading-tight m-0">
                            Jadwal Mengajar Anda
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Jadwal mengajar
                        </p>
                    </div>
                </div>

                <div className="relative w-[200px] ">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Mata Pelajaran
                    </label>
                    <select
                        className="block w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2.5 px-2 pr-1 rounded-lg shadow-sm hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out cursor-pointer text-sm font-medium"
                        value={selectedMapel}
                        onChange={(e) => setSelectedMapel(e.target.value)}
                    >
                        <option value="">[ Semua Mata Pelajaran ]</option>
                        {mapel.map((item) => (
                            <option
                                key={item.kode_mapel}
                                value={item.kode_mapel}
                            >
                                {item.nama_mapel}
                            </option>
                        ))}
                    </select>
                    {/* Ikon Panah Kustom */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                        <svg
                            className="h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Calendar / Timetable Grid Section */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <i className="fa fa-spinner fa-spin text-3xl text-green-500"></i>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {hariKerja.map((hari, index) => {
                        // Ambil jadwal khusus untuk hari ini dari data yang sudah difilter
                        const jadwalHariIni = filteredJadwal.filter(
                            (j) => j.hari === hari,
                        );

                        return (
                            <div
                                key={index}
                                className="flex flex-col bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                            >
                                {/* Header Hari */}
                                <div className="bg-green-600 text-white text-center py-2 font-bold text-sm tracking-wider uppercase shadow-sm">
                                    {hari}
                                </div>

                                {/* List Jadwal per Hari */}
                                <div className="p-3 flex flex-col gap-3 min-h-[150px]">
                                    {jadwalHariIni.length > 0 ? (
                                        jadwalHariIni.map((item) => (
                                            <div
                                                key={item.id}
                                                className="bg-white p-3 rounded shadow-sm border-l-4 border-green-500 hover:shadow-md transition-shadow relative group"
                                            >
                                                <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                                    <i className="fa fa-clock-o"></i>
                                                    {item.jam_mulai} -{" "}
                                                    {item.jam_selesai}
                                                </div>
                                                <div className="text-sm font-bold text-gray-800 leading-tight mb-1">
                                                    {item.nama_mapel}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                    <i className="fa fa-map-marker text-green-600"></i>{" "}
                                                    Kelas X-1
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic text-center p-4 border-2 border-dashed border-gray-200 rounded">
                                            Tidak ada jadwal
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
