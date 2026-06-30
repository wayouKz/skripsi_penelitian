export default function RenderTabelJadwal({ historyJadwal }) {
    if (!historyJadwal || historyJadwal.length === 0) return null;

    const groupedByKelas = historyJadwal.reduce((acc, curr) => {
        if (!acc[curr.nama_kelas]) acc[curr.nama_kelas] = [];
        acc[curr.nama_kelas].push(curr);
        return acc;
    }, {});

    const jamUnik = Array.from(
        new Set(
            historyJadwal.map(
                (item) => `${item.jam_mulai} - ${item.jam_selesai}`,
            ),
        ),
    ).sort();

    return (
        <div className="space-y-12">
            {Object.keys(groupedByKelas)
                .sort()
                .map((kelas) => {
                    const dataKelas = groupedByKelas[kelas];

                    return (
                        <div
                            key={kelas}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500"
                        >
                            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-black text-white tracking-wide">
                                    JADWAL KELAS {kelas}
                                </h3>
                                <span className="bg-green-800 text-green-100 text-xs font-bold px-3 py-1 rounded-full">
                                    {selectedNamaTahunAjaran}
                                </span>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-green-50 border-b border-green-100 text-green-900">
                                        <tr>
                                            <th className="px-4 py-3 text-center w-32 border-r border-green-100 font-extrabold uppercase text-xs">
                                                Waktu
                                            </th>
                                            {daftarHari.map((hari) => (
                                                <th
                                                    key={hari}
                                                    className="px-4 py-3 text-center border-r border-green-100 font-extrabold uppercase text-xs min-w-[200px]"
                                                >
                                                    {hari}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {jamUnik.map((waktu, rowIndex) => {
                                            const [mulai, selesai] =
                                                waktu.split(" - ");
                                            const jamTampil = `${mulai.slice(0, 5)} - ${selesai.slice(0, 5)}`;

                                            return (
                                                <tr
                                                    key={rowIndex}
                                                    className="hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-center font-bold text-gray-600 bg-gray-50 border-r border-gray-100 whitespace-nowrap">
                                                        {jamTampil}
                                                    </td>

                                                    {daftarHari.map((hari) => {
                                                        const mapelDitemukan =
                                                            dataKelas.find(
                                                                (j) =>
                                                                    j.hari ===
                                                                        hari &&
                                                                    j.jam_mulai ===
                                                                        mulai &&
                                                                    j.jam_selesai ===
                                                                        selesai,
                                                            );

                                                        return (
                                                            <td
                                                                key={`${hari}-${waktu}`}
                                                                className="px-4 py-3 border-r border-gray-100 relative group"
                                                            >
                                                                {mapelDitemukan ? (
                                                                    <div className="flex flex-col h-full bg-white border border-green-100 rounded-lg p-3 shadow-sm group-hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                                                                        <span className="font-bold text-gray-800 leading-tight mb-1">
                                                                            {
                                                                                mapelDitemukan.nama_mapel
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs font-semibold text-green-600 mt-auto flex items-center gap-1.5">
                                                                            <i className="fa fa-user-circle text-green-400"></i>
                                                                            {
                                                                                mapelDitemukan.nama_guru
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full min-h-[60px]">
                                                                        <span className="text-gray-300 font-medium text-xs uppercase tracking-widest">
                                                                            -
                                                                            Kosong
                                                                            -
                                                                        </span>
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
                        </div>
                    );
                })}
        </div>
    );
}
