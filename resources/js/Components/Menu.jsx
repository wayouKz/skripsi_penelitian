export default function Menu({ menu, setMenu, menus }) {
    return (
        <div className="w-full md:w-64 shrink-0 bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            {/* Header Menu (Desktop Only) - Dibuat lebih clean & modern */}
            <div className="hidden md:block px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Navigasi Menu
                </h2>
            </div>

            {/* Bagian Daftar Menu */}
            <div className="p-2 md:p-3 overflow-x-auto scrollbar-none">
                <ul className="flex flex-row md:flex-col gap-2 md:gap-1.5">
                    {menus.map((item, index) => {
                        const isActive = menu === item.value;
                        return (
                            <li key={index} className="shrink-0 md:shrink">
                                <button
                                    onClick={() => setMenu(item.value)}
                                    className={`w-full text-center md:text-left flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ease-in-out whitespace-nowrap ${
                                        isActive
                                            ? "bg-green-50 text-green-700 font-semibold shadow-xs ring-1 ring-green-500/20"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                >
                                    <span className="text-sm">
                                        {item.nama_menu}
                                    </span>

                                    {/* Indikator titik kecil di desktop saat menu aktif */}
                                    {isActive && (
                                        <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-green-600 shadow-xs"></span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
