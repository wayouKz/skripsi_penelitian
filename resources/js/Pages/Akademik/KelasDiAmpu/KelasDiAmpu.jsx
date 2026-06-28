import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, usePage } from "@inertiajs/react";

export default function KelasDiAmpu() {
    const [kelas, setKelas] = useState([]);
    const [filteredKelas, setFilteredKelas] = useState([]); // State untuk hasil pencarian
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const user = usePage().props.auth.user;
    // --- State ini bisa Anda gunakan nanti jika sudah ada data tahun ajaran dari backend ---
    const [tahunAjaran, setTahunAjaran] = useState([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState();
    console.log(selectedTahunAjaran);
    useEffect(() => {
        fetchTahunAjaran();
    }, []);

    useEffect(() => {
        if (selectedTahunAjaran) {
            fetchDataKelas();
        }
    }, [selectedTahunAjaran]);

    // Effect untuk menangani filter secara real-time saat search query berubah
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredKelas(kelas); // Tampilkan semua jika pencarian kosong
        } else {
            const lowerCaseQuery = searchQuery.toLowerCase();
            const filtered = kelas.filter((item) =>
                item.nama_kelas.toLowerCase().includes(lowerCaseQuery),
            );
            setFilteredKelas(filtered);
        }
    }, [searchQuery, kelas]);

    const fetchDataKelas = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                route("getData.get-guru-pengampu-kelas", {
                    tahun_ajaran: selectedTahunAjaran,
                }),
            );
            if (response.data.success === true) {
                setKelas(response.data.data);
                setFilteredKelas(response.data.data); // Set juga ke filteredKelas
            } else {
                setKelas([]);
                setFilteredKelas([]);
            }
        } catch (error) {
            console.error("Gagal mengambil data kelas:", error);
            setKelas([]);
            setFilteredKelas([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (event) => {
        setSearchQuery(event.target.value);
    };

    const fetchTahunAjaran = async () => {
        try {
            const response = await axios.get(route("getData.get-tahun-ajaran"));
            if (response.data.success === true) {
                setTahunAjaran(response.data.data);
                const dataTahun = response.data.data;
                const activeTahun = dataTahun.find(
                    (t) => t.status === "active",
                );
                if (activeTahun) {
                    // Pastikan yang diset adalah .value, bukan .status
                    setSelectedTahunAjaran(activeTahun.value);
                }
            } else {
                setTahunAjaran([]);
            }
        } catch (error) {
            console.error("Gagal mengambil data tahun ajaran:", error);
            setTahunAjaran([]);
        }
    };
    return (
        <AuthenticatedLayout header={"Daftar Kelas Diampu"}>
            <div className="py-12 min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                Daftar Kelas Diampu
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Kelola dan pantau kelas yang Anda ampu saat ini.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-52">
                                <select
                                    value={selectedTahunAjaran}
                                    onChange={(e) =>
                                        setSelectedTahunAjaran(e.target.value)
                                    }
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                >
                                    <option value="">
                                        [Pilih Tahun Ajaran]
                                    </option>
                                    {tahunAjaran?.map((tahunAjaran) => (
                                        <option
                                            key={tahunAjaran.value}
                                            value={tahunAjaran.value}
                                            selected={
                                                tahunAjaran.status === "active"
                                            }
                                        >
                                            {tahunAjaran.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search Bar */}
                            <div className="w-full md:w-80 relative">
                                <div className="absolute inset-y-2 top-3 left-1 pl-3 flex items-center pointer-events-none">
                                    <i className="fas fa-search text-gray-400"></i>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari kelas "
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300 shadow-sm"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((skeleton) => (
                                <div
                                    key={skeleton}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"
                                >
                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                    <div className="space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                    <div className="h-10 bg-gray-200 rounded-xl mt-6 w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Grid Container (Gunakan filteredKelas, bukan kelas) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredKelas.map((item) => (
                                    <div
                                        key={item.id || item.nama_kelas}
                                        className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden"
                                    >
                                        {/* Card Header */}
                                        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                                            <div>
                                                <p className="text-xs font-semibold text-green-600 tracking-wider uppercase mb-1">
                                                    Ruang Kelas
                                                </p>
                                                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                                                    {item.nama_kelas}
                                                </h3>
                                            </div>
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                    ></path>
                                                </svg>
                                                {item.jumlah_siswa} Siswa
                                            </span>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 flex-grow space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1.5 flex items-center gap-2">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                        ></path>
                                                    </svg>
                                                    Mata Pelajaran
                                                </p>
                                                <p className="font-semibold text-gray-900 bg-gray-100 inline-block px-3 py-1.5 rounded-lg text-sm border border-gray-200">
                                                    <ul>
                                                        {item.mapel.map(
                                                            (mapel, index) => (
                                                                <li
                                                                    className="inline-flex items-center pb-2 mb-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-100 shadow-sm"
                                                                    // Gunakan mapel.id jika ada, jika tidak ada fallback ke index
                                                                    key={
                                                                        mapel.index
                                                                    }
                                                                >
                                                                    <i className="fa fa-book"></i>{" "}
                                                                    {
                                                                        mapel.nama_mapel
                                                                    }
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500 mb-1.5 flex items-center gap-2">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                        ></path>
                                                    </svg>
                                                    Wali Kelas
                                                </p>
                                                <div className="flex items-center justify-between pl-6">
                                                    <p
                                                        className={`font-medium text-sm ${item.nip_perwalian === user.nip ? "text-yellow-600" : "text-gray-900"}`}
                                                    >
                                                        {item.nip_perwalian ===
                                                            user.nip && (
                                                            <i className="fa fa-star text-yellow-300 mr-1.5"></i>
                                                        )}
                                                        {item.nama_perwalian}
                                                    </p>

                                                    {/* PERBAIKAN: Dibuat menjadi badge kecil di sebelah kanan nama */}
                                                    {item.nip_perwalian ===
                                                        user.nip && (
                                                        <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            Kelas Perwalian
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="p-5 pt-0">
                                            <Link
                                                href={route(
                                                    "akademik.kelas-diampu.detail",
                                                    item.kelas_id,
                                                )}
                                                className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 border px-4 py-2.5 rounded-xl hover:bg-green-600 hover:text-white transition-all duration-300 font-semibold text-sm group-hover:shadow-md border-green-100"
                                            >
                                                Lihat Detail
                                                <svg
                                                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                                    ></path>
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Empty State 1: Data Backend Kosong */}
                            {kelas.length === 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center flex flex-col items-center justify-center ">
                                    <div className="bg-gray-100 p-4 rounded-full mb-4 ">
                                        <svg
                                            className="w-12 h-12 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.5"
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                            ></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        {selectedTahunAjaran
                                            ? "Tidak Ada Kelas"
                                            : "Tahun Ajaran Belum Dipilih"}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        {selectedTahunAjaran
                                            ? "Saat ini tidak ada daftar kelas yang ditugaskan kepada Anda untuk tahun ajaran tersebut."
                                            : "Silakan pilih tahun ajaran pada menu filter di atas untuk melihat daftar kelas."}
                                    </p>
                                </div>
                            )}

                            {/* Empty State 2: Hasil Pencarian Tidak Ditemukan */}
                            {kelas.length > 0 && filteredKelas.length === 0 && (
                                <div className="bg-white  rounded-2xl shadow-sm border border-gray-200 p-10 text-center flex flex-col items-center justify-center mt-6">
                                    <div className="bg-green-50 p-4 rounded-full mb-4">
                                        <svg
                                            className="w-12 h-12 text-green-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.5"
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            ></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        Kelas Tidak Ditemukan
                                    </h3>
                                    <p className="text-gray-500">
                                        Pencarian untuk{" "}
                                        <span className="font-semibold text-gray-700">
                                            "{searchQuery}"
                                        </span>{" "}
                                        tidak membuahkan hasil.
                                    </p>
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="mt-4 text-green-600 hover:text-green-800 text-sm font-medium"
                                    >
                                        Hapus Pencarian
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
