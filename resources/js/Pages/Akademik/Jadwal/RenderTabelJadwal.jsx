export default function RenderTabelJadwal({
    historyJadwal,
    selectedNamaTahunAjaran = "Tahun Ajaran Aktif",
}) {
    // 1. CEK DATA KOSONG
    if (!historyJadwal || historyJadwal.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                <i className="fa fa-calendar-times-o text-4xl text-gray-300 mb-3"></i>
                <div className="text-gray-500 font-medium text-sm">
                    Tidak ada jadwal yang tersedia.
                </div>
                <p className="text-xs text-gray-400 mt-1 italic">
                    Silakan pilih kelas atau tahun ajaran lain.
                </p>
            </div>
        );
    }

    const daftarHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    // 2. KELOMPOKKAN BERDASARKAN KELAS
    const groupedByKelas = historyJadwal.reduce((acc, curr) => {
        if (!acc[curr.nama_kelas]) acc[curr.nama_kelas] = [];
        acc[curr.nama_kelas].push(curr);
        return acc;
    }, {});

    return (
        <div className="space-y-12">
            {Object.keys(groupedByKelas)
                .sort()
                .map((kelas) => {
                    const dataKelas = groupedByKelas[kelas];

                    // Ambil semua slot jam unik yang tersedia untuk kelas ini, urutkan berdasarkan jam mulai
                    const jamUnikMap = new Map();
                    dataKelas.forEach((item) => {
                        if (item.jam_mulai && item.jam_selesai) {
                            const mulai = item.jam_mulai.substring(0, 5);
                            const selesai = item.jam_selesai.substring(0, 5);
                            const key = `${mulai}-${selesai}`;
                            if (!jamUnikMap.has(key)) {
                                jamUnikMap.set(key, {
                                    jam_mulai: mulai,
                                    jam_selesai: selesai,
                                });
                            }
                        }
                    });

                    // Urutkan kolom jam berdasarkan jam mulai
                    const daftarJam = Array.from(jamUnikMap.values()).sort(
                        (a, b) => a.jam_mulai.localeCompare(b.jam_mulai),
                    );

                    return (
                        <div
                            key={kelas}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500"
                        >
                            {/* Header Kelas */}
                            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-black text-white tracking-wide">
                                    JADWAL KELAS {kelas}
                                </h3>
                                <span className="bg-green-800 text-green-100 text-xs font-bold px-3 py-1 rounded-full">
                                    {selectedNamaTahunAjaran}
                                </span>
                            </div>

                            {/* Kontainer Tabel Matriks */}
                            <div className="p-6 overflow-x-auto bg-gray-50/50">
                                <table className="w-full border-collapse min-w-max">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-200 text-center">
                                            <th className="p-3 font-extrabold text-gray-700 text-xs uppercase tracking-wide border-r border-gray-200 w-32 sticky left-0 bg-gray-100 z-10">
                                                Hari / Jam
                                            </th>
                                            {daftarJam.map((jam, index) => (
                                                <th
                                                    key={index}
                                                    className="p-3 border-r border-gray-200 min-w-[140px]"
                                                >
                                                    <div className="font-extrabold text-gray-800 text-xs">
                                                        {jam.jam_mulai} -{" "}
                                                        {jam.jam_selesai}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {daftarHari.map((hari) => {
                                            // Filter data untuk hari ini
                                            const dataHariIni =
                                                dataKelas.filter(
                                                    (item) =>
                                                        item.hari === hari,
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

                                                    {/* Kolom Jam Pelajaran */}
                                                    {daftarJam.map(
                                                        (jam, index) => {
                                                            // Cari mapel yang cocok dengan hari dan rentang jam tersebut
                                                            const matchItem =
                                                                dataHariIni.find(
                                                                    (item) =>
                                                                        item.jam_mulai &&
                                                                        item.jam_selesai &&
                                                                        item.jam_mulai.substring(
                                                                            0,
                                                                            5,
                                                                        ) ===
                                                                            jam.jam_mulai &&
                                                                        item.jam_selesai.substring(
                                                                            0,
                                                                            5,
                                                                        ) ===
                                                                            jam.jam_selesai,
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
                                                                            <div className="text-[10px] font-semibold text-green-700 truncate flex items-center justify-center gap-1 mt-1">
                                                                                <i className="fa fa-user-circle text-green-400"></i>
                                                                                <span className="truncate">
                                                                                    {matchItem.nama_guru ||
                                                                                        matchItem.kode_jadwal}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-gray-300 text-xs italic py-4">
                                                                            -
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        },
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}
