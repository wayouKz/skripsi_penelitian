import React, { useEffect, useState } from "react";
import {
    Home,
    Globe,
    Layout,
    Mail,
    Layers,
    Server,
    Tag,
    Menu,
    Search,
    Gift,
    Zap,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Plus,
    User,
    Bug,
    X,
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import Sidebar from "./Partials/Sidebar";
import SearchBar from "./Partials/SearchBar";
import Navbar from "./Partials/Navbar";
import { Head } from "@inertiajs/react";
import "driver.js/dist/driver.css";
import { driver } from "driver.js";
import Pannel from "./DeveloperMode/Pannel";

export default function HostingerDashboard({ children, header }) {
    const user = usePage().props.auth.user;
    const { url, props } = usePage();

    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem("sidebar") === "true";
    });

    // State untuk mengontrol buka/tutup Panel Dev Tools
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

    // State untuk memantau apakah Developer Mode aktif
    const [isDevMode, setIsDevMode] = useState(false);

    useEffect(() => {
        localStorage.setItem("sidebar", collapsed);
    }, [collapsed]);

    // Cek status developer_mode dari localStorage
    useEffect(() => {
        const checkDevMode = () => {
            const status = localStorage.getItem("developer_mode") === "true";
            setIsDevMode(status);
        };

        checkDevMode();

        // Event listener untuk mendeteksi perubahan dari Navbar/tab lain
        window.addEventListener("storage", checkDevMode);
        window.addEventListener("devModeChanged", checkDevMode);

        return () => {
            window.removeEventListener("storage", checkDevMode);
            window.removeEventListener("devModeChanged", checkDevMode);
        };
    }, []);

    const menuItems = props.auth.list_features;

    const startTour = () => {
        const dynamicSteps = menuItems
            .filter((item) => !item.children?.length && item.route)
            .map((item) => ({
                element: `#menu-item-${item.id}`,
                popover: {
                    title: item.label,
                    description: item.deskripsi,
                    side: "right",
                    align: "start",
                },
            }));

        const driverObj = driver({
            showProgress: true,
            nextBtnText: "Selanjutnya",
            prevBtnText: "Kembali",
            doneBtnText: "Selesai",
            steps: dynamicSteps,
        });

        driverObj.drive();
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50 antialiased relative">
            <Head title={header} />

            {/* MOBILE OVERLAY */}
            {!collapsed && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}

            {/* SIDEBAR CONTAINER */}
            <div
                className={`
                    fixed lg:static z-40 h-full flex-shrink-0 transition-all duration-300
                    ${collapsed ? "-translate-x-full lg:tranprimary-x-0" : "tranprimary-x-0"}
                `}
            >
                <Sidebar collapsed={collapsed} menuItems={menuItems} />
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
                {/* NAVBAR CONTAINER */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 bg-white border-b border-gray-200">
                    <div className="flex-1">
                        <Navbar
                            user={user}
                            startTour={startTour}
                            onToggle={() => setCollapsed(!collapsed)}
                        />
                    </div>

                    {/* TOMBOL DEV TOOLS (Hanya tampil jika Dev Mode aktif di localStorage) */}
                    {isDevMode && (
                        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
                            <button
                                onClick={() => setIsDevToolsOpen(true)}
                                className="group flex items-center bg-white hover:bg-gray-50 text-gray-700 border-y border-l border-gray-200 shadow-xl pl-3 pr-2 py-3 rounded-l-full transition-all duration-300 cursor-pointer"
                                title="Developer Tools"
                            >
                                {/* Ilustrasi atau Ikon Bug dengan Lingkaran Indikator */}
                                <div className="relative flex items-center justify-center w-8 h-8 bg-amber-50 rounded-full border border-amber-200 group-hover:scale-110 transition-transform">
                                    <Bug className="w-4 h-4 text-amber-600 animate-pulse" />
                                    {/* Titik Indikator Merah kecil */}
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* SCROLLABLE CONTENT BODY */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="mx-auto w-full p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </div>
            </main>

            {/* ========================================== */}
            {/* PANEL DEV TOOLS DENGAN EFEK SISI MELENGKUNG */}
            {/* ========================================== */}
            {isDevToolsOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop / Latar Belakang Gelap */}
                    <div
                        className="absolute inset-0 bg-[#0a2f23]/60 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsDevToolsOpen(false)}
                    />

                    {/* Kotak Putih Utama dengan Lengkungan di Sisi Kiri */}
                    <div className="relative w-full max-w-md h-full bg-white rounded-l-[60px] shadow-2xl p-6 flex flex-col z-10 transition-transform duration-300 animate-in slide-in-from-right">
                        {/* Header Panel */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                                    <Bug className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">
                                        Developer Tools
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Panel kontrol & inspeksi sistem
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDevToolsOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <Pannel url={url} user={user} />
                    </div>
                </div>
            )}
        </div>
    );
}
