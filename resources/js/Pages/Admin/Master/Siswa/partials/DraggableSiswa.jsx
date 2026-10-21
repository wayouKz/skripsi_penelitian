import { useDraggable } from "@dnd-kit/core";

export default function DraggableSiswa({ siswa }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: siswa.value,
        data: siswa,
    });
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{ opacity: isDragging ? 0.3 : 1 }}
            className={`flex items-center gap-3 p-2.5 rounded-xl border ${isDragging ? "bg-gray-50 border-dashed border-gray-300 shadow-inner" : "bg-white border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md cursor-grab transition-all duration-200"}`}
        >
            <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full text-xs font-bold text-primary-700 shadow-sm">
                {siswa.label
                    .split(" ")
                    .map((k) => k.charAt(0))
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
            </span>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-gray-800 text-sm truncate">
                    {siswa.label}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                    NISN: {siswa.value}
                </span>
            </div>
            <i className="fa fa-grip-vertical text-gray-300 flex-shrink-0"></i>
        </div>
    );
}
