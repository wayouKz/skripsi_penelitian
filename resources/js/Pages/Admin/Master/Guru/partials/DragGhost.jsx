<<<<<<< HEAD
import Avatar from "./Avatar";

export default function DragGhost({ guru }) {
    return (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-green-300 shadow-xl ring-1 ring-green-100 cursor-grabbing w-52 opacity-90 scale-105">
            <Avatar name={guru?.label} size="sm" color="green" />
            <div className="min-w-0">
=======
import React from "react";
import Avatar from "./Avatar";

function DragGhost({ guru }) {
    if (!guru) return null;

    return (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-green-300 shadow-xl ring-1 ring-green-100 cursor-grabbing w-52 opacity-90 scale-105 select-none pointer-events-none">
            <Avatar name={guru?.label} size="sm" color="green" />
            <div className="min-w-0 flex-1">
>>>>>>> main
                <p className="text-sm font-medium text-gray-800 truncate">
                    {guru.label}
                </p>
            </div>
        </div>
    );
}
<<<<<<< HEAD
=======

// Gunakan React.memo agar DragGhost tidak ikut re-render saat state parent berubah
export default React.memo(DragGhost);
>>>>>>> main
