export default function StatCard({
    label,
    value,
    sub,
    badge,
    badgeUp,
    progress,
    color,
}) {
    return (
        <div className="relative bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start overflow-hidden">
            {/* Accent border left */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: color }}
            />

            <div className="ml-4 flex-1">
                <div className="text-sm font-medium text-gray-500">{label}</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums my-1">
                    {value}
                </div>
                <div className="text-xs text-gray-400 mb-2">{sub}</div>

                {/* Badge */}
                {badge && (
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                            badgeUp
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-600"
                        }`}
                    >
                        {badge}
                    </span>
                )}

                {/* Progress Bar */}
                {progress !== undefined && (
                    <div className="mt-3">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: color,
                                }}
                            />
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1.5">
                            {progress}% ditempuh
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
