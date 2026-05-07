import { useState } from "react";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, router, useForm } from "@inertiajs/react";

export default function Configure() {
    const [logoPreview, setLogoPreview] = useState(null);

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
                console.log("Konfigurasi berhasil");
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

            <form className="space-y-4" onSubmit={submit}>
                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-4">
                        <label className="block text-sm font-medium mb-1">
                            Nama Instansi
                        </label>
                        <TextInput
                            className="block w-full"
                            type="text"
                            value={data.nama_instansi}
                            onChange={(e) =>
                                setData("nama_instansi", e.target.value)
                            }
                        />
                        {errors.nama_instansi && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.nama_instansi}
                            </p>
                        )}
                    </div>

                    {/* Logo Instansi */}
                    <div className="col-span-4">
                        <label className="block text-sm font-medium mb-1">
                            Logo Instansi
                        </label>

                        {logoPreview && (
                            <div className="flex  w-1/2 ">
                                <img
                                    src={logoPreview}
                                    alt="Preview Logo"
                                    className="object-contain justify-center items-center"
                                />
                            </div>
                        )}

                        {/* Input */}
                        <label className="cursor-pointer">
                            <span className="block w-full p-2  bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                                Upload Logo
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoChange}
                            />
                        </label>

                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, atau SVG (max 2MB)
                        </p>

                        {errors.logo_instansi && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.logo_instansi}
                            </p>
                        )}
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Alamat Instansi
                        </label>
                        <TextInput
                            className="block w-full"
                            type="text"
                            value={data.alamat_instansi}
                            onChange={(e) =>
                                setData("alamat_instansi", e.target.value)
                            }
                        />
                        {errors.alamat_instansi && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.alamat_instansi}
                            </p>
                        )}
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Telepon Instansi
                        </label>
                        <TextInput
                            className="block w-full"
                            type="text"
                            value={data.telepon_instansi}
                            onChange={(e) =>
                                setData("telepon_instansi", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-span-4">
                        <label className="block text-sm font-medium mb-1">
                            Email Instansi
                        </label>
                        <TextInput
                            className="block w-full"
                            type="email"
                            value={data.email_instansi}
                            onChange={(e) =>
                                setData("email_instansi", e.target.value)
                            }
                        />
                        {errors.email_instansi && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.email_instansi}
                            </p>
                        )}
                    </div>

                    <div className="col-span-4">
                        <label className="block text-sm font-medium mb-1">
                            Website Instansi
                        </label>
                        <TextInput
                            className="block w-full"
                            type="text"
                            value={data.website_instansi}
                            onChange={(e) =>
                                setData("website_instansi", e.target.value)
                            }
                        />
                        {errors.website_instansi && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.website_instansi}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md"
                    >
                        Simpan
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
