import { useAlert } from "@/Components/AlertContext";
import RenderTabelJadwal from "./RenderTabelJadwal";
import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

export default function JadwalMengajarAnda({
    selectedNamaTahunAjaran,
    selectedTahunAjaran,
}) {
    const [jadwal, setJadwal] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();
    const auth = usePage().props.auth;
    const getJadwalPerGuru = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                route("getData.get-jadwal-perguru", {
                    tahun_ajaran_id: selectedTahunAjaran,
                    guru_id: auth.user.guru_id,
                }),
            );
            if (res.data.success === false) {
                setJadwal([]);
            } else {
                setJadwal(res.data.data);
            }
            setLoading(false);
        } catch (error) {
            showAlert("Gagal mengambil data jadwal per guru.", "error");
        }
    };
    useEffect(() => {
        getJadwalPerGuru();
    }, [selectedTahunAjaran]);
    function RenderTabelJadwalSkeleton() {
        // Kita buat 2 placeholder tabel untuk mensimulasikan loading beberapa kelas
        const skeletonTables = [1, 2];

        // 1 kolom waktu + 6 kolom hari
        const daysPlaceholder = [1, 2, 3, 4, 5, 6];

        // 4 baris jam pelajaran sebagai sampel
        const rowsPlaceholder = [1, 2, 3, 4];

        return (
            <div className="space-y-12">
                {skeletonTables.map((tableIdx) => (
                    <div
                        key={tableIdx}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-pulse"
                    >
                        {/* Header Skeleton */}
                        <div className="bg-green-600/60 px-6 py-4 flex items-center justify-between">
                            <div className="h-6 bg-white/40 rounded w-48"></div>
                            <div className="h-6 bg-white/40 rounded-full w-32"></div>
                        </div>

                        {/* Table Skeleton */}
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-green-50 border-b border-green-100">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-32 border-r border-green-100">
                                            <div className="h-4 bg-green-200 rounded w-16 mx-auto"></div>
                                        </th>
                                        {daysPlaceholder.map((day) => (
                                            <th
                                                key={day}
                                                className="px-4 py-3 text-center border-r border-green-100 min-w-[200px]"
                                            >
                                                <div className="h-4 bg-green-200 rounded w-20 mx-auto"></div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rowsPlaceholder.map((rowIdx) => (
                                        <tr key={rowIdx}>
                                            {/* Kolom Waktu Skeleton */}
                                            <td className="px-4 py-3 text-center bg-gray-50 border-r border-gray-100">
                                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                                            </td>

                                            {/* Kolom Hari (Isi Mapel) Skeleton */}
                                            {daysPlaceholder.map((colIdx) => {
                                                // Buat efek acak: sebagian sel berisi mapel, sebagian kosong
                                                const hasJadwal =
                                                    (rowIdx + colIdx) % 3 !== 0;

                                                return (
                                                    <td
                                                        key={colIdx}
                                                        className="px-4 py-3 border-r border-gray-100"
                                                    >
                                                        {hasJadwal ? (
                                                            <div className="flex flex-col h-full min-h-[70px] bg-gray-50 border border-gray-100 rounded-lg p-3 border-l-4 border-l-gray-300">
                                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                                                                <div className="h-3 bg-gray-200 rounded w-1/2 mt-auto flex items-center gap-2">
                                                                    <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                                                                    <div className="h-3 bg-gray-300 rounded w-full"></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full min-h-[70px]">
                                                                <div className="h-3 bg-gray-100 rounded w-16"></div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return (
        <>
            {loading ? (
                <RenderTabelJadwalSkeleton />
            ) : (
                <RenderTabelJadwal
                    historyJadwal={jadwal}
                    selectedNamaTahunAjaran={selectedNamaTahunAjaran}
                />
            )}
        </>
    );
}
