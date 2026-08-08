import GuruChip from "./GuruChip";
import { useDroppable } from "@dnd-kit/core";
export default function DroppableMapelRow({
    mapel,
    index,
    kelasList,
    removeGuru,
    handleGuruDataChange,
}) {
    const { setNodeRef, isOver } = useDroppable({ id: String(mapel.id) });

    // 🌟 PERBAIKAN 2: Mengumpulkan ID Kelas yang sudah terpakai di mata pelajaran ini
    const takenKelasIds = mapel.guru
        .map((g) => String(g.kelas_id))
        .filter((id) => id !== "");

    return (
        <tr
            className={`transition-colors ${isOver ? "bg-green-50/40" : "hover:bg-gray-50/50"}`}
        >
            <td className="px-5 py-3.5 align-top w-56">
                <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded text-[10px] bg-gray-100 text-gray-500">
                        {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                        {mapel.mapel || mapel.nama_mapel}
                    </span>
                </div>
            </td>
            <td className="px-5 py-3">
                <div
                    ref={setNodeRef}
                    className={`min-h-[48px] rounded-lg border-2 px-2.5 py-2 flex flex-wrap gap-2 items-center transition-all ${isOver ? "border-green-400 bg-green-50 border-dashed" : "border-transparent"}`}
                >
                    {mapel.guru.map((guru) => (
                        <GuruChip
                            key={guru.unique_id}
                            guru={guru}
                            mapelId={mapel.id}
                            kelasList={kelasList}
                            takenKelasIds={takenKelasIds} // 👈 Kirim data kelas yang sudah terpakai
                            onRemove={removeGuru}
                            onChangeData={handleGuruDataChange}
                        />
                    ))}
                    {mapel.guru.length === 0 && (
                        <p
                            className={`text-xs w-full text-center ${isOver ? "text-green-500 font-medium" : "text-gray-400"}`}
                        >
                            {isOver
                                ? "↓ Lepaskan di sini"
                                : "Tarik guru ke sini"}
                        </p>
                    )}
                </div>
            </td>
        </tr>
    );
}
