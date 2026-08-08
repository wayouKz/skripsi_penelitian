export default function Proses({
    progress,
    setProgress,
    resetButton,
    generation,
    fitness,
    logs,
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 space-y-10 max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-purple-600 relative z-10">
                    <span className="text-green-600">Memproses </span>
                    Jadwal....
                </h3>
            </div>
            <strong className=" text-xs text-red-400 font-mono">
                * Proses ini membutuhkan waktu,harap bersabar
            </strong>
            <div className="grid grid-cols-1 gap-4 w-full">
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Progress
                    </p>
                    <p className="text-3xl font-black text-green-600">
                        {progress}%
                    </p>
                </div>
                {/* <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Generasi
                    </p>
                    <p className="text-3xl font-black text-purple-600">
                        {generation}
                    </p>
                </div>
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Fitness
                    </p>
                    <p className="text-3xl font-black text-emerald-500">
                        {fitness}
                    </p>
                </div> */}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                    className="bg-gradient-to-r from-green-500 via-purple-500 to-green-500 h-full rounded-full transition-all duration-300 relative"
                    style={{
                        width: `${progress}%`,
                        backgroundSize: "200% 100%",
                        animation: "gradient 2s linear infinite",
                    }}
                ></div>
            </div>
            <div className="w-full bg-gray-900 rounded-2xl p-5 font-mono text-sm text-emerald-400 shadow-2xl h-40 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-gray-900 to-transparent z-10"></div>
                <div className="space-y-1.5 relative z-0">
                    {logs.map((log, i) => (
                        <p
                            key={i}
                            className={`${i === 0 ? "text-white font-bold" : "text-emerald-400/60"}`}
                        >
                            <span className="text-gray-500 mr-2">{">"}</span>
                            {log}
                        </p>
                    ))}
                </div>
            </div>
            {resetButton && (
                <button
                    onClick={handleStartGA}
                    className="font-black px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg bg-red-600 hover:bg-red-700 hover:-translate-y-1 hover:shadow-red-200 text-white"
                >
                    RESET
                </button>
            )}
        </div>
    );
}
