import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, usePage } from "@inertiajs/react";

export default function KelasDiAmpu({
    selectedTahunAjaran,
    setSelectedTahunAjaran,
}) {
    const [kelas, setKelas] = useState([]);
    const [filteredKelas, setFilteredKelas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const user = usePage().props.auth.user;

    useEffect(() => {
        if (selectedTahunAjaran) {
            fetchDataKelas();
        }
    }, [selectedTahunAjaran]);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredKelas(kelas);
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
                setFilteredKelas(response.data.data);
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

    return (
        <div className="py-6 min-h-screen">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
                    <div>
                        <h2 className="text-md font-bold text-gray-900 tracking-tight">
                            Daftar Kelas Diampu
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Kelola dan pantau kelas yang Anda ampu saat ini.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {/* Search Bar */}
                        <div className="w-full md:w-72 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fas fa-search text-gray-400 text-xs"></i>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari kelas..."
                                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-xs transition-all shadow-sm"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                            <div
                                key={skeleton}
                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
                            >
                                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div className="h-8 bg-gray-200 rounded-lg mt-4 w-full"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Grid Container */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredKelas.map((item) => (
                                <div
                                    key={item.id || item.nama_kelas}
                                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group overflow-hidden text-xs"
                                >
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-[10px] font-semibold text-green-600 tracking-wider uppercase">
                                                    Ruang Kelas
                                                </p>
                                                {item.gurupengganti && (
                                                    <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                                                        <i className="fa fa-user-clock text-[9px]"></i>
                                                        Guru Pengganti
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                                                {item.nama_kelas}
                                            </h3>
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
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
                                    <div className="p-4 flex-grow space-y-3">
                                        <div>
                                            <div className="text-gray-500 mb-1 flex items-center gap-1.5 font-medium">
                                                <svg
                                                    className="w-3.5 h-3.5 text-gray-400"
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
                                            </div>
                                            <div>
                                                <ul className="flex flex-wrap gap-1">
                                                    {item.mapel.map(
                                                        (mapel, index) => (
                                                            <li
                                                                className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold bg-green-50 text-green-700 border border-green-100 shadow-2xs"
                                                                key={
                                                                    mapel.id ||
                                                                    index
                                                                }
                                                            >
                                                                <i className="fa fa-book mr-1 text-[10px]"></i>
                                                                {
                                                                    mapel.nama_mapel
                                                                }
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-gray-500 mb-1 flex items-center gap-1.5 font-medium">
                                                <svg
                                                    className="w-3.5 h-3.5 text-gray-400"
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
                                            </div>
                                            <div className="flex items-center justify-between pl-5">
                                                <p
                                                    className={`text-xs flex items-center ${
                                                        item.nip_perwalian ===
                                                        user.nip
                                                            ? "text-yellow-600 font-semibold"
                                                            : "text-gray-900"
                                                    }`}
                                                >
                                                    {item.nip_perwalian ===
                                                        user.nip && (
                                                        <i className="fa fa-star text-yellow-400 mr-1"></i>
                                                    )}
                                                    {item.nama_perwalian}
                                                </p>

                                                {item.nip_perwalian ===
                                                    user.nip && (
                                                    <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                        Perwalian
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="p-4 pt-0">
                                        <Link
                                            href={route(
                                                "akademik.kelas-diampu.detail",
                                                item.kelas_id,
                                            )}
                                            className="w-full flex items-center justify-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-3 py-1 text-xs rounded-lg hover:bg-green-600 hover:text-white transition-all font-semibold group-hover:shadow-xs"
                                        >
                                            Lihat Detail
                                            <svg
                                                className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform"
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
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center flex flex-col items-center justify-center">
                                <div className="bg-gray-100 p-3 rounded-full mb-3">
                                    <svg
                                        className="w-8 h-8 text-gray-400"
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
                                <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                                    {selectedTahunAjaran
                                        ? "Tidak Ada Kelas"
                                        : "Tahun Ajaran Belum Dipilih"}
                                </h3>
                                <p className="text-gray-500 text-xs">
                                    {selectedTahunAjaran
                                        ? "Saat ini tidak ada daftar kelas yang ditugaskan kepada Anda."
                                        : "Silakan pilih tahun ajaran pada menu filter di atas."}
                                </p>
                            </div>
                        )}

                        {/* Empty State 2: Hasil Pencarian Tidak Ditemukan */}
                        {kelas.length > 0 && filteredKelas.length === 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center justify-center mt-4">
                                <div className="bg-green-50 p-3 rounded-full mb-3">
                                    <svg
                                        className="w-8 h-8 text-green-400"
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
                                <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                                    Kelas Tidak Ditemukan
                                </h3>
                                <p className="text-gray-500 text-xs">
                                    Pencarian untuk{" "}
                                    <span className="font-semibold text-gray-700">
                                        "{searchQuery}"
                                    </span>{" "}
                                    tidak membuahkan hasil.
                                </p>
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="mt-3 text-green-600 hover:text-green-800 text-xs font-medium"
                                >
                                    Hapus Pencarian
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
