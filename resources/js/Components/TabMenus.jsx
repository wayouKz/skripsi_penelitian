import React, { useState } from "react";

export default function TabsMenus({ menus }) {
    // State untuk menyimpan ID atau index menu yang sedang aktif
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 mt-6">
            {/* Header Tabs (Tombol Navigasi) */}
            <div className="flex border  border-gray-200">
                {menus.map((menu, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${
                            activeTab === index
                                ? "border-b-2 border-emerald-500 text-green-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {menu.nama_menu}
                    </button>
                ))}
            </div>

            {/* Konten Tab (Tampilan isi dari menu yang aktif) */}
            <div className="p-6 bg-white shadow-sm sm:rounded-b-lg border-x border-b border-gray-200">
                <div className="text-gray-900">
                    <p>{menus[activeTab].component}</p>
                </div>
            </div>
        </div>
    );
}
