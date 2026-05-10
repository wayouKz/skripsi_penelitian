import { Head, Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

export default function Sidebar({ collapsed }) {
    const { url, props } = usePage();
    const menuItems = props.auth.list_features;

    const [openMenu, setOpenMenu] = useState(null);

    const isActive = (path) => {
        if (!path) return false;
        return url.startsWith("/" + path);
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
            className={`bg-white border-r transition-all duration-300 ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-black flex items-center justify-center">
                        <div className="text-white font-bold text-xl">G</div>
                    </div>
                    <span className="text-xl font-bold hidden"></span>
                </div>
            </div>
            <nav className="flex-1 py-4 space-y-2 overflow-y-aut p-4">
                {menuItems.map((item) => {
                    const parentActive =
                        isActive(item.route) ||
                        item.children?.some((child) => isActive(child.route));
                    return (
                        <div key={item.id} className="relative group">
                            {!item.children?.length &&
                                (item.route ? (
                                    <Link
                                        href={route(item?.route)}
                                        className={`flex items-center ${
                                            collapsed
                                                ? "justify-center"
                                                : "px-4 space-x-3"
                                        } py-3 rounded-lg transition ${
                                            parentActive
                                                ? "bg-indigo-600 text-white"
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
                                                : "px-4 space-x-3"
                                        } py-3 text-gray-400`}
                                    >
                                        <i className={`fa ${item.icon}`} />

                                        {!collapsed && (
                                            <span className="text-sm">
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                ))}

                            {/* TOOLTIP */}
                            {collapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block bg-indigo-900 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
            <div className="p-2 border-t border-gray-200">
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
