import React from "react";
import Avatar from "./Avatar";
import { useDraggable } from "@dnd-kit/core";

function DraggableGuru({ guru }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: guru.value,
        data: guru,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-grab transition-all select-none
                ${isDragging ? "opacity-40 bg-gray-50" : "bg-white hover:border-primary-300 hover:bg-primary-50/30"}`}
        >
            <Avatar name={guru.label} size="sm" color="primary" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                    {guru.label}
                </p>
            </div>
        </div>
    );
}

// Gunakan React.memo agar tidak ikut re-render saat state tabel/parent berubah
export default React.memo(DraggableGuru);
