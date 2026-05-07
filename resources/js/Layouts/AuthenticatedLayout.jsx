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

export default function HostingerDashboard({ header, children }) {
    const user = usePage().props.auth.user;
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem("sidebar") === "true";
    });
    useEffect(() => {
        localStorage.setItem("sidebar", collapsed);
    }, [collapsed]);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}

            {/* Menu Items */}
            <Sidebar collapsed={collapsed} />

            {/* Bottom Menu */}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <Navbar user={user} onToggle={() => setCollapsed(!collapsed)} />

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
