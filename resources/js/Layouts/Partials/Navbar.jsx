import { Menu, Bell } from "lucide-react";
import SearchBar from "./SearchBar";
import { useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";

export default function Navbar({ user, onToggle }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    // klik di luar → close
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
        <header className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
                {/* LEFT */}
                <div className="flex items-center gap-4 w-full max-w-xl">
                    {/* Hamburger */}
                    <button
                        onClick={onToggle}
                        className="p-2 rounded-md hover:bg-gray-100"
                    >
                        <Menu size={20} className="text-gray-600" />
                    </button>

                    {/* Search */}
                    <div className="flex-1">
                        <SearchBar context={"list-feature"} />
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-6">
                    {/* Notification */}
                    <div className="relative">
                        <Bell className="text-gray-600" size={20} />

                        {/* Badge */}
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                            3
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-medium uppercase text-gray-800">
                                {user?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {user?.role?.nama_roles}
                            </p>
                        </div>

                        {/* Avatar */}
                        <div className="relative" ref={ref}>
                            {/* BUTTON */}
                            <button
                                onClick={() => setOpen(!open)}
                                className="relative focus:outline-none"
                            >
                                <div className="w-10 h-10 bg-indigo-500 text-white flex items-center justify-center rounded-full">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>

                                {/* Status Dot */}
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                            </button>

                            {/* DROPDOWN */}
                            {open && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="p-4 border-b">
                                        <p className="text-sm font-medium uppercase text-gray-800">
                                            {user?.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {user?.role?.nama_roles}
                                        </p>
                                    </div>

                                    <div className="py-2">
                                        <Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                                        >
                                            <i className="fa fa-sign-out"></i>
                                            Log out
                                        </Link>
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
