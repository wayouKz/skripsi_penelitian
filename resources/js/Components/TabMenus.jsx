import React, { useState, useMemo, useEffect } from "react";

export default function TabsMenus({ menus, id = "main-tabs" }) {
    // 1. Inisialisasi state dengan membaca localStorage terlebih dahulu
    const [activeTab, setActiveTab] = useState(() => {
        // Pengecekan typeof window berguna jika Anda menggunakan framework SSR seperti Next.js
        if (typeof window !== "undefined") {
            const savedTab = localStorage.getItem(`activeTab_${id}`);
            // Pastikan nilai yang tersimpan valid dan tidak melebihi panjang menu saat ini
            if (savedTab !== null && parseInt(savedTab) < menus.length) {
                return parseInt(savedTab);
            }
        }
        return 0; // Default ke tab pertama jika tidak ada data tersimpan
    });

    // 2. Gunakan useEffect untuk menyimpan ke localStorage setiap kali activeTab berubah
    useEffect(() => {
        localStorage.setItem(`activeTab_${id}`, activeTab);
    }, [activeTab, id]);

    // Header Tabs di-memoize
    const tabHeaders = useMemo(() => {
        if (!menus) return null;

        return menus.map((menu, index) => (
            <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 outline-none ${
                    activeTab === index
                        ? "bg-white border-b-2 border-emerald-600 text-emerald-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
            >
                <i className={`fa fa-${menu.icon || "list-ul"} mr-2`}></i>
                {menu.nama_menu}
            </button>
        ));
    }, [menus, activeTab]);

    // Konten Tab di-memoize
    const activeContent = useMemo(() => {
        if (!menus || menus.length === 0) {
            return (
                <p className="text-gray-500 text-center">
                    Tidak ada menu tersedia.
                </p>
            );
        }

        return menus[activeTab].component;
    }, [menus, activeTab]);

    return (
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden mb-6">
            {/* --- Bagian Header Tab --- */}
            <div className="flex border-b border-gray-200 bg-gray-50/50">
                {tabHeaders}
            </div>

            {/* --- Bagian Konten Tab --- */}
            <div className="p-6 bg-white shadow-sm sm:rounded-b-lg border-x border-b border-gray-200 min-h-[200px]">
                <div className="text-gray-900 animate-in fade-in duration-300">
                    {activeContent}
                </div>
            </div>
        </div>
    );
}
