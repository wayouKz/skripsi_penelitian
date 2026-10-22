export default function JadwalTimeline({ jadwal }) {
    return (
        <div className="space-y-0">
            {jadwal?.map((item, i) => {
                const isAktif = item.status === "aktif";
                const isSelesai = item.status === "selesai";
                const isLast = i === jadwal.length - 1;

                return (
                    <div key={i} className="flex gap-4 group">
                        {/* Vertical timeline rail */}
                        <div className="flex flex-col items-center flex-shrink-0 w-4">
                            <div
                                className={`w-3 h-3 rounded-full mt-1.5 transition-all duration-300 border-2 ${
                                    isAktif
                                        ? "bg-blue-600 border-blue-300 ring-4 ring-blue-100"
                                        : isSelesai
                                          ? "bg-primary-300 border-primary-300"
                                          : "bg-primary-100 border-primary-200"
                                }`}
                            />
                            {!isLast && (
                                <div
                                    className={`w-0.5 flex-1 my-1.5 ${
                                        isAktif
                                            ? "bg-gradient-to-b from-blue-400 to-primary-200"
                                            : "bg-primary-200"
                                    }`}
                                />
                            )}
                        </div>

                        {/* Schedule card */}
                        <div
                            className={`flex-1 mb-4 p-4 rounded-xl border transition-all ${
                                isAktif
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-gray-50 border-gray-100 hover:border-gray-200"
                            }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div
                                        className={`font-bold text-sm truncate ${isSelesai ? "text-primary-400" : "text-primary-900"}`}
                                    >
                                        {item.mk}
                                    </div>
                                    <div className="text-xs text-primary-400 mt-1 truncate">
                                        📍 {item.ruang} · 👤 {item.dosen}
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <div
                                        className={`text-xs font-bold tabular-nums ${isAktif ? "text-blue-600" : "text-primary-500"}`}
                                    >
                                        {item.waktu}–{item.selesai}
                                    </div>

                                    {isAktif && (
                                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                            Berlangsung
                                        </span>
                                    )}
                                    {isSelesai && (
                                        <span className="block mt-1.5 text-[10px] text-primary-400 font-medium">
                                            ✓ Selesai
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
