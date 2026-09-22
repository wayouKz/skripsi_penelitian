export default function Menu({ menu, setMenu, menus }) {
    return (
        <div className="w-full md:w-52 shrink-0 bg-white border border-gray-200/80 rounded-xl shadow-xs overflow-hidden">
            {/* Header Menu (Desktop Only) */}
            <div className="hidden md:block px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Menu
                </h2>
            </div>

            {/* Bagian Daftar Menu */}
            <div className="p-1.5 md:p-2 overflow-x-auto scrollbar-none">
                <ul className="flex flex-row md:flex-col gap-1.5 md:gap-1">
                    {menus.map((item, index) => {
                        const isActive = menu === item.value;
                        return (
                            <li key={index} className="shrink-0 md:shrink">
                                <button
                                    onClick={() => setMenu(item.value)}
                                    type="button"
                                    className={`w-full text-center md:text-left flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap ${
                                        isActive
                                            ? "bg-green-50 text-green-700 font-semibold shadow-xs ring-1 ring-green-500/20"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                >
                                    <span className="text-xs">
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
