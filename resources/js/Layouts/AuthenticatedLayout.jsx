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
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import Sidebar from "./Partials/Sidebar";
import SearchBar from "./Partials/SearchBar";
import Navbar from "./Partials/Navbar";
import { Head } from "@inertiajs/react";
import "driver.js/dist/driver.css";
import { driver } from "driver.js";

export default function HostingerDashboard({ children, header }) {
    const user = usePage().props.auth.user;
    const { url, props } = usePage();

    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem("sidebar") === "true";
    });
    useEffect(() => {
        localStorage.setItem("sidebar", collapsed);
    }, [collapsed]);

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
        /* FIX 1: Mengunci viewport browser agar tinggi halaman pas 100% layar dan scrollbar luar hilang */
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50 antialiased">
            <Head title={header} />

            {/* MOBILE OVERLAY */}
            {!collapsed && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}

            {/* SIDEBAR CONTAINER */}
            {/* FIX 2: h-full flex-shrink-0 memastikan tinggi sidebar mengunci 100% tanpa terpotong */}
            <div
                className={`
                    fixed lg:static z-40 h-full flex-shrink-0 transition-all duration-300
                    ${collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}
                `}
            >
                <Sidebar collapsed={collapsed} menuItems={menuItems} />
            </div>

            {/* MAIN CONTENT AREA */}
            {/* FIX 3: Container kanan wajib menggunakan h-full overflow-hidden agar navbar menetap di atas */}
            <main className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
                {/* NAVBAR CONTAINER */}
                <div className="flex-shrink-0">
                    <Navbar
                        user={user}
                        startTour={startTour}
                        onToggle={() => setCollapsed(!collapsed)}
                    />
                </div>

                {/* SCROLLABLE CONTENT BODY */}
                {/* FIX 4: flex-1 dan overflow-y-auto di sini memaksa hanya area tabel/children ini saja yang boleh di-scroll */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="mx-auto w-full p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
