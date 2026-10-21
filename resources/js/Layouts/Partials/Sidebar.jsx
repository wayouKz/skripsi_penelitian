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
        <aside
            className={`bg-white border-r transition-all duration-300 flex flex-col h-full ${
                collapsed ? "w-16" : "w-56"
            }`}
        >
            {/* Logo */}
            <div className="p-3 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-2.5">
                    {logo ? (
                        <img
                            src={`/storage/public/logo/${logo}`}
                            alt="Logo"
                            className="w-8 h-8 object-contain"
                        />
                    ) : (
                        <img
                            src={`/img/logo-default.png`}
                            alt="Logo"
                            className="w-12 h-12 object-contain"
                        />
                    )}
                </div>
            </div>

            {/* Menu Navigation */}
            <nav className="flex-1 py-6 space-y-3.5 px-2.5 overflow-y-auto min-h-0 content-scrollbar">
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
                                                : "space-x-2.5"
                                        } py-1.5 px-2.5 rounded-xl transition ${
                                            parentActive
                                                ? "bg-primary-600 text-white shadow-sm"
                                                : "text-gray-500 hover:bg-primary-500 hover:text-white"
                                        }`}
                                    >
                                        {/* ICON */}
                                        <i
                                            className={`fa ${item.icon} text-sm`}
                                        />

                                        {/* TEXT */}
                                        {!collapsed && (
                                            <span className="text-xs font-medium">
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                ) : (
                                    <div
                                        className={`flex items-center ${
                                            collapsed
                                                ? "justify-center"
                                                : "mx-auto px-2 py-1.5"
                                        } text-gray-400 border-b border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider`}
                                    >
                                        <i
                                            className={`fa ${item.icon} text-xs`}
                                        />

                                        {!collapsed && (
                                            <span className="ml-2">
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                ))}
                        </div>
                    );
                })}
            </nav>

            {/* Bagian Kontrol Akun */}
            <div className="p-2 border-t border-gray-200 flex-shrink-0">
                <div className="relative group">
                    <Link
                        href={route("profile.edit")}
                        className={`flex items-center py-2 rounded-xl transition ${
                            route().current("profile.edit")
                                ? "bg-primary-600 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:text-primary-600"
                        } ${collapsed ? "justify-center" : "px-3 space-x-2.5"}`}
                    >
                        {/* ICON */}
                        <i className="fa fa-user-cog text-sm"></i>

                        {/* TEXT */}
                        {!collapsed && (
                            <span className="text-xs font-medium">
                                Kontrol akun
                            </span>
                        )}
                    </Link>

                    {/* TOOLTIP */}
                    {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow whitespace-nowrap z-50">
                            Kontrol akun
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
