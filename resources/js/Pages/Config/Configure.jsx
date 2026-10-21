import { useState } from "react";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useAlert } from "@/Components/AlertContext";

export default function Configure() {
    const [logoPreview, setLogoPreview] = useState(null);
    const { showAlert } = useAlert();
    const { data, setData, post, processing, errors } = useForm({
        nama_instansi: "",
        logo_instansi: null,
        alamat_instansi: "",
        telepon_instansi: "",
        email_instansi: "",
        website_instansi: "",
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setData("logo_instansi", file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();

        router.post(route("install.configure.store"), data, {
            forceFormData: true,
            onSuccess: () => {
                showAlert("Konfigurasi berhasil disimpan", "success");
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Configure" />

            <h2 className="text-2xl font-bold text-center mb-2">
                Konfigurasi Instansi
            </h2>
            <p className="text-center text-gray-500 mb-6">
                Configure your instansi to continue installation
            </p>

            <form className="space-y-6" onSubmit={submit}>
                <div className="rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                            <i className="fa fa-building text-primary-600"></i>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Informasi Instansi
                            </h2>
                            <p className="text-sm text-gray-500">
                                Kelola data profil instansi
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        {/* Nama Instansi */}
                        <div className="md:col-span-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nama Instansi
                            </label>

                            <TextInput
                                className="block w-full rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                type="text"
                                placeholder="Masukkan nama instansi"
                                value={data.nama_instansi}
                                onChange={(e) =>
                                    setData("nama_instansi", e.target.value)
                                }
                            />

                            {errors.nama_instansi && (
                                <p className="text-red-500 text-xs mt-2">
                                    {errors.nama_instansi}
                                </p>
                            )}
                        </div>

                        {/* Logo */}
                        <div className="md:col-span-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Logo Instansi
                            </label>

                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50">
                                {logoPreview ? (
                                    <div className="flex justify-center mb-4">
                                        <img
                                            src={logoPreview}
                                            alt="Preview Logo"
                                            className="h-32 object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center py-6">
                                        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                                            <i className="fa fa-image text-primary-600 text-xl"></i>
                                        </div>

                                        <p className="text-sm font-medium text-gray-700">
                                            Upload logo instansi
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            PNG, JPG, SVG maksimal 2MB
                                        </p>
                                    </div>
                                )}

                                <label className="cursor-pointer flex justify-center">
                                    <span className="px-4 py-2 bg-primary-500 hover:bg-primary-600 transition text-white text-sm rounded-xl shadow-sm">
                                        Pilih File
                                    </span>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoChange}
                                    />
                                </label>
                            </div>

                            {errors.logo_instansi && (
                                <p className="text-red-500 text-xs mt-2">
                                    {errors.logo_instansi}
                                </p>
                            )}
                        </div>

                        {/* Alamat */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Alamat Instansi
                            </label>

                            <TextInput
                                className="block w-full rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                type="text"
                                placeholder="Masukkan alamat instansi"
                                value={data.alamat_instansi}
                                onChange={(e) =>
                                    setData("alamat_instansi", e.target.value)
                                }
                            />

                            {errors.alamat_instansi && (
                                <p className="text-red-500 text-xs mt-2">
                                    {errors.alamat_instansi}
                                </p>
                            )}
                        </div>

                        {/* Telepon */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Telepon Instansi
                            </label>

                            <TextInput
                                className="block w-full rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                type="text"
                                placeholder="08xxxxxxxxxx"
                                value={data.telepon_instansi}
                                onChange={(e) =>
                                    setData("telepon_instansi", e.target.value)
                                }
                            />
                        </div>

                        {/* Email */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Instansi
                            </label>

                            <TextInput
                                className="block w-full rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                type="email"
                                placeholder="email@instansi.com"
                                value={data.email_instansi}
                                onChange={(e) =>
                                    setData("email_instansi", e.target.value)
                                }
                            />

                            {errors.email_instansi && (
                                <p className="text-red-500 text-xs mt-2">
                                    {errors.email_instansi}
                                </p>
                            )}
                        </div>

                        {/* Website */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Website Instansi
                            </label>

                            <TextInput
                                className="block w-full rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                type="text"
                                placeholder="https://website.com"
                                value={data.website_instansi}
                                onChange={(e) =>
                                    setData("website_instansi", e.target.value)
                                }
                            />

                            {errors.website_instansi && (
                                <p className="text-red-500 text-xs mt-2">
                                    {errors.website_instansi}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Button */}
                    <div className="flex justify-end mt-8">
                        <button
                            type="submit"
                            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 transition text-white rounded-xl shadow-md font-medium"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
