export default function Menu({ menu, setMenu, menus }) {
    return (
        // 1. Ubah w-56 menjadi w-full, lalu gunakan md:w-56 untuk layar besar
        <div className="w-full md:w-56 shrink-0 bg-white border-gray-200 rounded-md border  overflow-hidden md:mt-6">
            {/* Bagian Header Menu (Disembunyikan di HP agar lebih rapi seperti Tab, dimunculkan di md) */}
            <div className="hidden md:block bg-gradient-to-r from-green-500 to-green-600 px-5 py-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Menu
                </h2>
            </div>

            {/* Bagian Daftar Menu */}
            {/* 2. Tambahkan overflow-x-auto agar bisa digeser horizontal di HP jika menu banyak */}
            <div className="p- md:p-3 overflow-x-auto">
                {/* 3. Gunakan flex-row (menyamping) di HP, dan flex-col (menurun) di md */}
                <ul className="flex flex-row md:flex-col gap-2 md:gap-1">
                    {menus.map((item, index) => {
                        const isActive = menu === item.value;
                        return (
                            // 4. Tambahkan shrink-0 agar tombol tidak gepeng saat digeser di HP
                            <li key={index} className="shrink-0 md:shrink">
                                <button
                                    onClick={() => setMenu(item.value)}
                                    // 5. Tambahkan text-center (HP) / md:text-left, dan whitespace-nowrap agar teks tidak turun baris
                                    className={`w-full text-center md:text-left block px-4 py-4  border rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap ${
                                        isActive
                                            ? "bg-green-50 text-green-700 border-green-200 font-semibold shadow-sm ring-1 ring-green-100" // Gaya saat aktif
                                            : " border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-600 " // Gaya saat tidak aktif
                                    }`}
                                >
                                    <span className="text-sm block">
                                        {item.nama_menu}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
