import { useDroppable } from "@dnd-kit/core";

const initials = (name) =>
    name
        .split(" ")
        .map((k) => k.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);

export default function DroppableKelasCard({ kelas, removeSiswa }) {
    const { setNodeRef, isOver } = useDroppable({ id: String(kelas.id) });
    const kapasitas = kelas.kapasitas;
    const jumlah = kelas.siswa.length;
    const persen = Math.min((jumlah / kapasitas) * 100, 100);
    const isFull = jumlah >= kapasitas;

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col bg-white rounded-xl overflow-hidden min-h-[240px] transition-all duration-150 ${
                isOver
                    ? "border-2 border-emerald-400 ring-4 ring-emerald-100"
                    : "border border-gray-200 hover:border-gray-300"
            }`}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 truncate">
                        {kelas.nama_kelas || `Kelas ${kelas.id}`}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {kelas.nama_wali_kelas
                            ? `Wali: ${kelas.nama_wali_kelas}`
                            : "Belum ada wali kelas"}
                    </p>
                </div>

                {/* Kapasitas badge */}
                <span
                    className={`flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                        isFull
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-gray-50 text-gray-500 border-gray-100"
                    }`}
                >
                    {jumlah}
                </span>
            </div>

            {/* Progress bar kapasitas */}

            {/* Body */}
            <div className="flex-1 p-3 flex flex-col">
                {jumlah === 0 ? (
                    <div
                        className={`flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                            isOver
                                ? "border-emerald-300 bg-primary-50"
                                : "border-gray-100"
                        }`}
                    >
                        <i
                            className={`fa fa-arrow-down text-base mb-1.5 ${
                                isOver ? "text-emerald-400" : "text-gray-200"
                            }`}
                        />
                        <span
                            className={`text-xs ${
                                isOver ? "text-emerald-500" : "text-gray-300"
                            }`}
                        >
                            {isOver
                                ? "Lepaskan di sini"
                                : "Tarik siswa ke sini"}
                        </span>
                    </div>
                ) : (
                    <ul className="space-y-1 flex-1 overflow-y-auto max-h-64 scrollbar-thin scrollbar-thumb-gray-100 pr-0.5">
                        {kelas.siswa.map((siswa) => (
                            <li
                                key={siswa?.value}
                                className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                {/* Avatar */}
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-[10px] font-medium text-emerald-600">
                                    {initials(siswa.label)}
                                </span>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                                        {siswa.label}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        NISN: {siswa.value}
                                    </p>
                                </div>

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={() => removeSiswa(kelas.id, siswa)}
                                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus:opacity-100"
                                    title="Keluarkan dari kelas"
                                    aria-label={`Keluarkan ${siswa.label} dari kelas`}
                                >
                                    <i className="fa fa-times text-xs" />
                                </button>
                            </li>
                        ))}

                        {/* Drop hint ketika ada siswa dan sedang di-hover */}
                        {isOver && (
                            <li className="flex items-center justify-center px-2.5 py-2 rounded-lg border-2 border-dashed border-primary-200 bg-primary-50">
                                <span className="text-xs text-emerald-400">
                                    Lepaskan di sini
                                </span>
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
