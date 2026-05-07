import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { ChevronDown, ChevronUp, Globe, Plus, Server } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
    const [showPromo, setShowPromo] = useState(true);
    const [expandedSections, setExpandedSections] = useState({
        hosting: true,
        domain: true,
    });
    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };
    const user = usePage().props.auth.user.user;
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <div className="main">
                {/* Welcome Message */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    Selamat datang di SIAMAN, {user?.name}!
                </h1>

                {/* Promo Banner */}

                {/* Widget Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Widget
                    </h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 flex items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer">
                        <Plus size={32} className="text-gray-400" />
                    </div>
                </div>

                {/* Hosting Section */}
                <div className="bg-white rounded-xl hidden border border-gray-200 mb-6">
                    <button
                        onClick={() => toggleSection("hosting")}
                        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="text-lg font-semibold text-gray-900">
                            Hosting
                        </h3>
                        {expandedSections.hosting ? (
                            <ChevronUp size={20} />
                        ) : (
                            <ChevronDown size={20} />
                        )}
                    </button>

                    {expandedSections.hosting && (
                        <div className="px-6 pb-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center relative">
                                        <Server
                                            className="text-white"
                                            size={24}
                                        />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            cPanel Cloud Premium
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            Berakhir pada 2026-03-12 •{" "}
                                            <span className="text-indigo-600">
                                                man1kotagorontalo.sc...
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <button className="px-6 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
                                    Kelola
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Domain Section */}
                <div className="bg-white hidden rounded-xl border border-gray-200">
                    <button
                        onClick={() => toggleSection("domain")}
                        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="text-lg font-semibold text-gray-900">
                            Domain
                        </h3>
                        {expandedSections.domain ? (
                            <ChevronUp size={20} />
                        ) : (
                            <ChevronDown size={20} />
                        )}
                    </button>

                    {expandedSections.domain && (
                        <div className="px-6 pb-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center relative">
                                        <Globe
                                            className="text-white"
                                            size={24}
                                        />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            man1kotagorontalo.sch.id
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            Berakhir pada 2027-09-12
                                        </p>
                                    </div>
                                </div>
                                <button className="px-6 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
                                    Kelola
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
