import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

export default function Edit({ mustVerifyEmail, status }) {
    const [activeTab, setActiveTab] = useState("profile");

    const tabs = [
        { id: "profile", label: "Profil", icon: "fa-user" },
        { id: "password", label: "Password", icon: "fa-lock" },
        { id: "delete", label: "Hapus Akun", icon: "fa-trash" },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-lg font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="mx-auto max-w-5xl px-3 sm:px-4 lg:px-6">
                {/* Header */}
                <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 p-5 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold">
                                Pengaturan Akun
                            </h1>
                            <p className="mt-1 text-xs text-primary-100">
                                Kelola informasi profil, keamanan akun, dan
                                lainnya.
                            </p>
                        </div>
                        <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-white/10 md:flex">
                            <i className="fa-solid fa-user-gear text-xl"></i>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-4 rounded-2xl bg-white p-1.5 shadow-2xs border border-gray-100">
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                                    activeTab === tab.id
                                        ? tab.id === "delete"
                                            ? "bg-red-500 text-white shadow-xs"
                                            : "bg-primary-600 text-white shadow-xs"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <i
                                    className={`fa-solid ${tab.icon} text-xs`}
                                ></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="mt-4">
                    {/* Profile */}
                    {activeTab === "profile" && (
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
                            <div className="border-b border-gray-100 px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100">
                                        <i className="fa-solid fa-user text-primary-600 text-xs"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-800">
                                            Informasi Profil
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Perbarui data pribadi dan email akun
                                            Anda.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-4">
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                    className="max-w-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Password */}
                    {activeTab === "password" && (
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
                            <div className="border-b border-gray-100 px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100">
                                        <i className="fa-solid fa-lock text-yellow-600 text-xs"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-800">
                                            Keamanan Akun
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Gunakan password yang kuat untuk
                                            menjaga keamanan akun.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-4">
                                <UpdatePasswordForm className="max-w-full" />
                            </div>
                        </div>
                    )}

                    {/* Delete */}
                    {activeTab === "delete" && (
                        <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-2xs">
                            <div className="border-b border-red-100 px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
                                        <i className="fa-solid fa-trash text-red-600 text-xs"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-red-600">
                                            Hapus Akun
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Tindakan ini permanen dan tidak
                                            dapat dibatalkan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-4">
                                <DeleteUserForm className="max-w-xl" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
