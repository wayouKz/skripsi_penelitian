import { useAlert } from "@/Components/AlertContext";
import Form from "@/Components/Form";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function KelolaInformasiInstansi() {
    const [logoPreview, setLogoPreview] = useState(null);
    const [sampulPreview, setSampulPreview] = useState(null);
    const dataInstansi = usePage().props.settings_application;
    const { showAlert } = useAlert();
    const { data, setData, post, processing, errors } = useForm({
        nama_instansi: dataInstansi?.nama_instansi || "",
        logo_instansi: dataInstansi?.logo_instansi || null,
        alamat_instansi: dataInstansi?.alamat_instansi || "",
        telepon_instansi: dataInstansi?.telepon_instansi || "",
        email_instansi: dataInstansi?.email_instansi || "",
        website_instansi: dataInstansi?.website_instansi || "",
        sampul_instansi: dataInstansi?.sampul_instansi || null,
    });

    const handleSampulChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setData("sampul_instansi", file);
        setSampulPreview(URL.createObjectURL(file));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setData("logo_instansi", file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();

        post(route("manajemen-aplikasi.kelola-informasi-instansi.store"), {
            forceFormData: true,
            onSuccess: () => {
                showAlert("Informasi instansi berhasil diperbarui", "success");
            },
        });
    };

    return (
        <AuthenticatedLayout header="Kelola Informasi Instansi">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                <Form onSubmit={submit} loading={processing}>
                    {/* Header Banner */}
                    <div className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <i className="fa fa-building text-white text-sm"></i>
                            </div>

                            <div>
                                <h2 className="text-sm font-bold text-white">
                                    Profil Instansi
                                </h2>
                                <p className="text-[11px] text-green-100">
                                    Kelola informasi dan identitas instansi
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {/* Nama Instansi */}
                            <div className="md:col-span-4">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Nama Instansi
                                </label>

                                <TextInput
                                    className="block w-full text-xs py-1.5 px-3 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    type="text"
                                    icon="building"
                                    placeholder="Masukkan nama instansi"
                                    value={data.nama_instansi}
                                    onChange={(e) =>
                                        setData("nama_instansi", e.target.value)
                                    }
                                />

                                {errors.nama_instansi && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                        {errors.nama_instansi}
                                    </p>
                                )}
                            </div>

                            {/* Logo */}
                            <div className="md:col-span-4">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Logo Instansi
                                </label>

                                <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-3 hover:border-green-400 transition">
                                    {logoPreview || data?.logo_instansi ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-24 h-24 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border">
                                                <img
                                                    src={
                                                        logoPreview
                                                            ? logoPreview
                                                            : `/storage/public/logo/${data.logo_instansi}`
                                                    }
                                                    alt="Logo Instansi"
                                                    className="object-contain w-full h-full p-2"
                                                />
                                            </div>

                                            <p className="text-[10px] text-gray-500 mt-2">
                                                {logoPreview
                                                    ? "Preview logo baru"
                                                    : "Logo instansi saat ini"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-1.5">
                                                <i className="fa fa-image text-green-600 text-base"></i>
                                            </div>

                                            <p className="text-xs font-medium text-gray-700">
                                                Upload logo instansi
                                            </p>

                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                PNG, JPG, SVG maksimal 2MB
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex justify-center mt-3">
                                        <label className="cursor-pointer">
                                            <span className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-medium shadow-sm transition inline-block">
                                                {logoPreview ||
                                                data?.logo_instansi
                                                    ? "Ganti Logo"
                                                    : "Pilih File"}
                                            </span>

                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleLogoChange}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {errors.logo_instansi && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                        {errors.logo_instansi}
                                    </p>
                                )}
                            </div>

                            {/* Foto Sampul */}
                            <div className="md:col-span-4 mt-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Foto Sampul (Header/Banner)
                                </label>

                                <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-3 hover:border-green-400 transition">
                                    {/* Preview Area */}
                                    <div className="w-full h-[500px] bg-gray-200 rounded-xl overflow-hidden mb-2.5 shadow-sm">
                                        {sampulPreview ||
                                        data?.sampul_instansi ? (
                                            <img
                                                src={
                                                    sampulPreview
                                                        ? sampulPreview
                                                        : `/storage/public/sampul_instansi/${data.sampul_instansi}`
                                                }
                                                alt="Sampul Instansi"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <i className="fa fa-image text-2xl"></i>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tombol Upload */}
                                    <div className="flex justify-center">
                                        <label className="cursor-pointer">
                                            <span className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-medium shadow-sm transition inline-block">
                                                {sampulPreview ||
                                                data?.sampul_instansi
                                                    ? "Ganti Sampul"
                                                    : "Upload Sampul"}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleSampulChange}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {errors.sampul_instansi && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                        {errors.sampul_instansi}
                                    </p>
                                )}
                            </div>

                            {/* Alamat */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Alamat Instansi
                                </label>

                                <TextInput
                                    className="block w-full text-xs py-1.5 px-3 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    type="text"
                                    icon="map-marker-alt"
                                    placeholder="Masukkan alamat"
                                    value={data.alamat_instansi}
                                    onChange={(e) =>
                                        setData(
                                            "alamat_instansi",
                                            e.target.value,
                                        )
                                    }
                                />

                                {errors.alamat_instansi && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                        {errors.alamat_instansi}
                                    </p>
                                )}
                            </div>

                            {/* Telepon */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Telepon Instansi
                                </label>

                                <TextInput
                                    className="block w-full text-xs py-1.5 px-3 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    type="text"
                                    icon="phone"
                                    placeholder="08xxxxxxxxxx"
                                    value={data.telepon_instansi}
                                    onChange={(e) =>
                                        setData(
                                            "telepon_instansi",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            {/* Email */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Email Instansi
                                </label>

                                <TextInput
                                    className="block w-full text-xs py-1.5 px-3 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    type="email"
                                    icon="envelope"
                                    placeholder="email@instansi.com"
                                    value={data.email_instansi}
                                    onChange={(e) =>
                                        setData(
                                            "email_instansi",
                                            e.target.value,
                                        )
                                    }
                                />

                                {errors.email_instansi && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                        {errors.email_instansi}
                                    </p>
                                )}
                            </div>

                            {/* Website */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Website Instansi
                                </label>

                                <TextInput
                                    className="block w-full text-xs py-1.5 px-3 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    type="text"
                                    icon="globe"
                                    placeholder="https://website.com"
                                    value={data.website_instansi}
                                    onChange={(e) =>
                                        setData(
                                            "website_instansi",
                                            e.target.value,
                                        )
                                    }
                                />

                                {errors.website_instansi && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                        {errors.website_instansi}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </AuthenticatedLayout>
    );
}
