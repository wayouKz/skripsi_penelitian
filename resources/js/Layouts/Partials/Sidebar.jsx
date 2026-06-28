import { Head, Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

export default function Sidebar({ collapsed, menuItems }) {
    const { url, props } = usePage();

    const logo = props.settings_application?.logo_instansi;
    const appName = props.settings_application?.nama_aplikasi;
    const [openMenu, setOpenMenu] = useState(null);

    const isActive = (path) => {
        if (!path) return false;

        const formattedPath = path
            .replace(/\./g, "/") // ganti . jadi /
            .replace(/\/index$/, ""); // hapus /index di akhir

        return url.startsWith("/" + formattedPath);
    };

    // auto buka parent kalau child aktif
    useEffect(() => {
        menuItems.forEach((item) => {
            if (item.children?.length) {
                const isChildActive = item.children.some((child) =>
                    isActive(child.route),
                );

                if (isChildActive) {
                    setOpenMenu(item.id);
                }
            }
        });
    }, [url]);

    return (
        /* PERBAIKAN 1: Menambahkan flex flex-col h-full agar kontainer memiliki tinggi penuh yang statis */
        <aside
            className={`bg-white border-r transition-all duration-300 flex flex-col h-full ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
            {/* Logo */}
            {/* flex-shrink-0 menjaga bagian logo agar tetap di atas (tidak ikut tergulung) */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-3">
                    {logo ? (
                        <img
                            src={`/storage/public/logo/${logo}`}
                            alt="Logo"
                            className="w-10 h-10 object-contain"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                {appName?.charAt(0)?.toUpperCase() || "A"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* PERBAIKAN 2: Menambahkan overflow-y-auto dan min-h-0 supaya menu daftar list bisa di-scroll */}
            <nav className="flex-1 py-4 space-y-2 p-4 overflow-y-auto min-h-0 content-scrollbar">
                {menuItems.map((item) => {
                    const parentActive = isActive(item.route);
                    return (
                        <div key={item.id} className="relative group">
                            {!item.children?.length &&
                                (item.route ? (
                                    <Link
                                        href={route(item?.route)}
                                        id={`menu-item-${item.id}`}
                                        className={`flex items-center ${
                                            collapsed
                                                ? "justify-center"
                                                : " space-x-3"
                                        } py-2 px-2 rounded-full transition ${
                                            parentActive
                                                ? "bg-green-600 text-white"
                                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                        }`}
                                    >
                                        {/* ICON */}
                                        <i
                                            className={`fa ${item.icon} text-lg`}
                                        />

                                        {/* TEXT */}
                                        {!collapsed && (
                                            <span className="text-sm font-medium">
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                ) : (
                                    <div
                                        className={`flex items-center ${
                                            collapsed
                                                ? "justify-center"
                                                : "mx-auto p-2"
                                        }  text-gray-300  border-b border-gray-200 rounded-lg `}
                                    >
                                        <i className={`fa ${item.icon}`} />

                                        {!collapsed && (
                                            <span className="text-sm ">
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                ))}

                            {/* TOOLTIP */}
                        </div>
                    );
                })}
            </nav>

            {/* Bagian Kontrol Akun */}
            {/* flex-shrink-0 menjaga bagian profile/kontrol akun agar paku statis di dasar sidebar */}
            <div className="p-2 border-t border-gray-200 flex-shrink-0">
                <div className="relative group">
                    <Link
                        href={route("profile.edit")}
                        className={`flex items-center ${
                            collapsed ? "justify-center" : "px-4 space-x-3"
                        } py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition`}
                    >
                        {/* ICON */}
                        <i className="fa fa-user-cog text-lg"></i>

                        {/* TEXT */}
                        {!collapsed && (
                            <span className="text-sm">Kontrol akun</span>
                        )}
                    </Link>

                    {/* TOOLTIP */}
                    {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap z-50">
                            Kontrol akun
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
