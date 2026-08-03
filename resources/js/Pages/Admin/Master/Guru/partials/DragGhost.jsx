import Avatar from "./Avatar";

export default function DragGhost({ guru }) {
    return (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-green-300 shadow-xl ring-1 ring-green-100 cursor-grabbing w-52 opacity-90 scale-105">
            <Avatar name={guru?.label} size="sm" color="green" />
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                    {guru.label}
                </p>
            </div>
        </div>
    );
}
