import { Menu, Bell, Code2 } from "lucide-react";
import SearchBar from "./SearchBar";
import { useEffect, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";

export default function Navbar({ user, onToggle, startTour }) {
    const [open, setOpen] = useState(false);
    const [devMode, setDevMode] = useState(false);
    const ref = useRef();

    // Load status developer mode dari localStorage saat komponen dimount
    useEffect(() => {
        const storedDevMode = localStorage.getItem("developer_mode") === "true";
        setDevMode(storedDevMode);
    }, []);

    // Handler untuk toggle developer mode
    const toggleDevMode = () => {
        const nextState = !devMode;
        setDevMode(nextState);
        localStorage.setItem("developer_mode", nextState);
        window.dispatchEvent(new Event("devModeChanged"));
        router.reload();
    };

    // klik di luar → close dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-2 sticky top-0 w-full z-30 flex-shrink-0">
            <div className="flex items-center justify-between">
                {/* LEFT */}
                <div className="flex items-center gap-3 w-full max-w-lg">
                    {/* Hamburger */}
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        <Menu size={18} className="text-gray-600" />
                    </button>

                    {/* Search */}
                    <div className="flex-1">
                        <SearchBar context={"list-feature"} />
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-2.5 md:gap-3">
                    {/* Panduan Pemakaian */}
                    <button
                        type="button"
                        onClick={startTour}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-emerald-600 hover:bg-primary-100 border border-primary-200 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                    >
                        <i className="fa fa-question-circle text-xs" />
                        <span className="hidden sm:inline">
                            Panduan Pengguna
                        </span>
                    </button>

                    {/* Notification */}
                    <div className="relative cursor-pointer p-1 hover:bg-gray-50 rounded-full transition-colors hidden">
                        <Bell className="text-gray-600" size={18} />
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] px-1 py-0.2 font-semibold rounded-full min-w-[16px] text-center">
                            3
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-5 w-px bg-gray-200"></div>

                    {/* User Info */}
                    <div className="flex items-center gap-2.5">
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-semibold uppercase text-gray-800 tracking-wide">
                                {user?.name}
                            </p>
                            <p className="text-[11px] text-gray-500 font-medium">
                                {user?.role?.nama_roles}
                            </p>
                        </div>

                        {/* Avatar Dropdown */}
                        <div className="relative" ref={ref}>
                            {/* BUTTON */}
                            <button
                                onClick={() => setOpen(!open)}
                                className="relative focus:outline-none flex items-center structure"
                            >
                                <div className="w-8 h-8 bg-primary-600 text-white flex items-center justify-center rounded-full text-xs font-bold shadow-sm hover:bg-primary-700 transition-colors">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>

                                {/* Status Dot */}
                                {/* <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary-400 border-2 border-white rounded-full"></span> */}
                            </button>

                            {/* DROPDOWN */}
                            {open && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 origin-top-right">
                                    <div className="p-3 border-b bg-gray-50 rounded-t-lg md:hidden">
                                        <p className="text-xs font-medium uppercase text-gray-800">
                                            {user?.name}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {user?.role?.nama_roles}
                                        </p>
                                    </div>

                                    <div className="py-1">
                                        <Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors text-left"
                                        >
                                            <i className="fa fa-sign-out text-xs"></i>
                                            Log out
                                        </Link>
                                    </div>
                                    <div className="py-1 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={toggleDevMode}
                                            title={
                                                devMode
                                                    ? "Developer Mode Aktif"
                                                    : "Developer Mode Nonaktif"
                                            }
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold transition-all ${
                                                devMode
                                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            <Code2 size={14} />
                                            <span>
                                                {devMode
                                                    ? "Dev Mode: ON"
                                                    : "Dev Mode"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
