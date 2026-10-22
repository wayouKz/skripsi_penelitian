import React, { useState, useMemo, useEffect } from "react";

export default function TabMenus({ menus = [], id = "main-tabs" }) {
    // 1. Inisialisasi state dengan membaca localStorage
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== "undefined") {
            const savedTab = localStorage.getItem(`activeTab_${id}`);
            if (savedTab !== null) {
                return parseInt(savedTab, 10);
            }
        }
        return 0;
    });

    // 2. Pastikan activeTab selalu berada dalam batas index menus yang valid
    useEffect(() => {
        if (menus.length > 0 && activeTab >= menus.length) {
            setActiveTab(0);
        }
    }, [menus, activeTab]);

    // 3. Simpan ke localStorage setiap kali activeTab berubah
    useEffect(() => {
        if (typeof window !== "undefined" && menus.length > 0) {
            // Hanya simpan jika index-nya valid
            if (activeTab < menus.length) {
                localStorage.setItem(`activeTab_${id}`, activeTab);
            }
        }
    }, [activeTab, id, menus.length]);

    // Header Tabs di-memoize
    const tabHeaders = useMemo(() => {
        if (!menus || menus.length === 0) return null;

        return menus.map((menu, index) => (
            <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex-1 text-md py-4 px-6  font-medium transition-all duration-200 outline-none ${
                    activeTab === index
                        ? "bg-white border-b-2 border-primary-600 text-primary-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
            >
                <i className={`fa fa-${menu.icon || "list-ul"} mr-2`}></i>
                {menu.nama_menu}
            </button>
        ));
    }, [menus, activeTab]);

    // Konten Tab di-memoize dengan aman terhadap out-of-bounds index
    const activeContent = useMemo(() => {
        if (!menus || menus.length === 0) {
            return (
                <p className="text-gray-500 text-center">
                    Tidak ada menu tersedia.
                </p>
            );
        }

        // Ambil aman jika activeTab melebihi panjang menu saat ini
        const safeIndex = activeTab < menus.length ? activeTab : 0;
        return menus[safeIndex].component;
    }, [menus, activeTab]);

    return (
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden mb-6">
            {/* --- Bagian Header Tab --- */}
            <div className="flex border-b border-gray-200 bg-gray-50/50 text-xs">
                {tabHeaders}
            </div>

            <div className="p-6 bg-white shadow-sm sm:rounded-b-lg border-x border-b border-gray-200 min-h-[200px]">
                <div className="text-gray-900 animate-in fade-in duration-300">
                    {activeContent}
                </div>
            </div>
        </div>
    );
}
