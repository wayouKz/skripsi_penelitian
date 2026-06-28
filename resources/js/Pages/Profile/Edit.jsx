import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

export default function Edit({ mustVerifyEmail, status }) {
    const [activeTab, setActiveTab] = useState("profile");

    const tabs = [
        {
            id: "profile",
            label: "Profil",
            icon: "fa-user",
        },
        {
            id: "password",
            label: "Password",
            icon: "fa-lock",
        },
        {
            id: "delete",
            label: "Hapus Akun",
            icon: "fa-trash",
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="rounded-3xl bg-gradient-to-r from-green-600 to-green-500 p-8 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">
                                Pengaturan Akun
                            </h1>

                            <p className="mt-2 text-sm text-green-100">
                                Kelola informasi profil, keamanan akun, dan
                                pengaturan lainnya.
                            </p>
                        </div>

                        <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-white/10 md:flex">
                            <i className="fa-solid fa-user-gear text-3xl"></i>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 rounded-3xl bg-white p-2 shadow-sm border border-gray-100">
                    <div className="flex flex-wrap justify-center gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? tab.id === "delete"
                                            ? "bg-red-500 text-white shadow-md"
                                            : "bg-green-600 text-white shadow-md"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <i className={`fa-solid ${tab.icon}`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="mt-6">
                    {/* Profile */}
                    {activeTab === "profile" && (
                        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                                        <i className="fa-solid fa-user text-green-600"></i>
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            Informasi Profil
                                        </h2>

                                        <p className="text-sm text-gray-500">
                                            Perbarui data pribadi dan email akun
                                            Anda.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-6">
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                    className="max-w-2xl"
                                />
                            </div>
                        </div>
                    )}

                    {/* Password */}
                    {activeTab === "password" && (
                        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
                                        <i className="fa-solid fa-lock text-yellow-600"></i>
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            Keamanan Akun
                                        </h2>

                                        <p className="text-sm text-gray-500">
                                            Gunakan password yang kuat untuk
                                            menjaga keamanan akun.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-6">
                                <UpdatePasswordForm className="max-w-2xl" />
                            </div>
                        </div>
                    )}

                    {/* Delete */}
                    {activeTab === "delete" && (
                        <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
                            <div className="border-b border-red-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                                        <i className="fa-solid fa-trash text-red-600"></i>
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold text-red-600">
                                            Hapus Akun
                                        </h2>

                                        <p className="text-sm text-gray-500">
                                            Tindakan ini permanen dan tidak
                                            dapat dibatalkan.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-6">
                                <DeleteUserForm className="max-w-2xl" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
