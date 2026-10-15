import { useAlert } from "@/Components/AlertContext";
import Form from "@/Components/Form";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Select from "react-select";

export default function KelolaInformasiInstansi() {
    const [logoPreview, setLogoPreview] = useState(null);
    const [sampulPreview, setSampulPreview] = useState(null);
    const [highlightPreviews, setHighlightPreviews] = useState([
        null,
        null,
        null,
    ]);
    const [dataGuru, setDataGuru] = useState([]);
    const dataInstansi = usePage().props.settings_application;
    const { showAlert } = useAlert();

    // 1. Parsing data JSON card_img dari database menjadi Array
    let parsedCardImg = {}; // Kita gunakan object sebagai default agar lebih fleksibel

    if (dataInstansi?.card_img) {
        try {
            let rawData = dataInstansi.card_img;

            // Terkadang data JSON dari Laravel menjadi string 2x (double-encoded).
            // Loop ini memastikan kita mengekstrak string tersebut sampai menjadi bentuk aslinya (Object/Array).
            while (
                typeof rawData === "string" &&
                (rawData.trim().startsWith("[") ||
                    rawData.trim().startsWith("{"))
            ) {
                rawData = JSON.parse(rawData);
            }

            parsedCardImg = rawData || {};

            // Console log sementara untuk nge-cek apakah datanya sukses ditangkap
            console.log("Sukses Parse card_img:", parsedCardImg);
        } catch (error) {
            console.error(
                "Gagal memparsing card_img:",
                error,
                "Data mentah:",
                dataInstansi.card_img,
            );
        }
    }

    const { data, setData, post, processing, errors } = useForm({
        nama_instansi: dataInstansi?.nama_instansi || "",
        logo_instansi: dataInstansi?.logo_instansi || null,
        alamat_instansi: dataInstansi?.alamat_instansi || "",
        telepon_instansi: dataInstansi?.telepon_instansi || "",
        email_instansi: dataInstansi?.email_instansi || "",
        website_instansi: dataInstansi?.website_instansi || "",
        sampul_instansi: dataInstansi?.sampul_instansi || null,
        kepala_sekolah: dataInstansi?.kepala_sekolah_id
            ? {
                  value: dataInstansi.kepala_sekolah_id,
                  label:
                      dataInstansi.kepala_sekolah?.nama_guru ||
                      "Tidak diketahui",
              }
            : null,
        // Cek fallback index angka integer maupun string agar tidak lolos
        foto_highlight_1: parsedCardImg[0] || parsedCardImg["0"] || null,
        foto_highlight_2: parsedCardImg[1] || parsedCardImg["1"] || null,
        foto_highlight_3: parsedCardImg[2] || parsedCardImg["2"] || null,
    });

    console.log("Data form saat ini:", data);

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

    // Handler untuk perubahan gambar highlight
    const handleHighlightChange = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Update URL preview
        const newPreviews = [...highlightPreviews];
        newPreviews[index] = URL.createObjectURL(file);
        setHighlightPreviews(newPreviews);

        setData(`foto_highlight_${index + 1}`, file);
    };

    // Handler untuk menghapus gambar highlight
    const removeHighlight = (index) => {
        // Hapus dari preview
        const newPreviews = [...highlightPreviews];
        newPreviews[index] = null;
        setHighlightPreviews(newPreviews);

        // Hapus dari state form jika itu file baru (kembalikan ke null)
        setData(`foto_highlight_${index + 1}`, null);
    };

    const submit = (e) => {
        e.preventDefault();

        post(route("manajemen-aplikasi.kelola-informasi-instansi.store"), {
            forceFormData: true,
            onSuccess: () => {
                showAlert("Informasi instansi berhasil diperbarui", "success");
            },
            onError: () => {
                showAlert("Informasi instansi gagal diperbarui", "error");
            },
        });
    };
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: !data?.kepala_sekolah?.value ? "#FFFF" : "#F9FAFB",
            borderColor: state.isFocused
                ? "#10B981"
                : !data?.kepala_sekolah?.value
                  ? "#FCD34D"
                  : "#D1D5DB",
            borderRadius: "0.5rem",
            minHeight: "36px",
            padding: "0 2px",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: "pointer",
            "&:hover": {
                borderColor: "#10B981",
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 6px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "0.75rem",
            fontWeight: "500",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "0.75rem",
            fontWeight: "600",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#10B981"
                : state.isFocused
                  ? "#ECFDF5"
                  : "white",
            color: state.isSelected ? "white" : "#1F2937",
            fontSize: "0.75rem",
            fontWeight: "500",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

    const getDataGuru = async () => {
        const res = await axios.get(route("master.guru.getGuru"));
        const data = res.data.data.map((guru) => ({
            value: guru.id,
            label: guru.nama_guru,
        }));
        setDataGuru(data);
    };

    useEffect(() => {
        getDataGuru();
    }, []);
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
                            <div className="md:col-span-4 lg:col-span-2">
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
                            <div className="md:col-span-4 lg:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Kepala Sekolah
                                </label>
                                <Select
                                    className="block w-full text-xs rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    options={dataGuru}
                                    value={data?.kepala_sekolah} // BERIKAN OBJECT PENUH (bukan .value)
                                    onChange={
                                        (e) => setData("kepala_sekolah", e) // SIMPAN OBJECT PENUH
                                    }
                                    placeholder="Pilih Kepala Sekolah"
                                    isSearchable={true}
                                    menuPortalTarget={document.body}
                                    classNamePrefix="react-select"
                                    styles={customSelectStyles}
                                />
                                {errors.kepala_sekolah && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                        {errors.kepala_sekolah}
                                    </p>
                                )}
                            </div>

                            {/* Logo */}
                            <div className="md:col-span-4 lg:col-span-2">
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
                            <div className="md:col-span-4 lg:col-span-2 mt-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Foto Sampul (Header/Banner)
                                </label>

                                <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-3 hover:border-green-400 transition">
                                    {/* Preview Area */}
                                    <div className="w-full rounded-xl overflow-hidden mb-2.5 shadow-sm">
                                        {sampulPreview ||
                                        data?.sampul_instansi ? (
                                            <img
                                                src={
                                                    sampulPreview
                                                        ? sampulPreview
                                                        : `/storage/public/sampul_instansi/${data.sampul_instansi}`
                                                }
                                                alt="Sampul Instansi"
                                                className="w-full h-[110px] object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-3">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-1.5">
                                                    <i className="fa fa-image text-green-600 text-base"></i>
                                                </div>

                                                <p className="text-xs font-medium text-gray-700">
                                                    Upload sampul login
                                                </p>

                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    PNG, JPG, SVG maksimal 2MB
                                                </p>
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

                            {/* Foto Highlight 1, 2, 3 */}
                            <div className="md:col-span-4 mt-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Foto Highlight Landing Page
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[0, 1, 2].map((index) => {
                                        const fieldName = `foto_highlight_${index + 1}`;
                                        const existingImage = data[fieldName];
                                        const previewUrl =
                                            highlightPreviews[index];

                                        // 3. Cek apakah menampilkan file lokal baru ATAU data string dari server
                                        // Catatan: Saya ubah path ke /storage/foto_highlight/ sesuai folder storeAs Backend Anda sebelumnya
                                        const displaySrc = previewUrl
                                            ? previewUrl
                                            : typeof existingImage ===
                                                    "string" && existingImage
                                              ? `/storage/public/foto_highlight/${existingImage}`
                                              : null;

                                        return (
                                            <div
                                                key={index}
                                                className="relative w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:border-green-400 transition overflow-hidden"
                                            >
                                                {displaySrc ? (
                                                    <div className="relative w-full h-full">
                                                        <img
                                                            src={displaySrc}
                                                            alt={`Highlight ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeHighlight(
                                                                    index,
                                                                )
                                                            }
                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-md"
                                                        >
                                                            <i className="fa fa-times"></i>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-3">
                                                        <div className="flex flex-col items-center justify-center text-center">
                                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-1.5">
                                                                <i className="fa fa-image text-green-600 text-base"></i>
                                                            </div>
                                                            <p className="text-xs font-medium text-gray-700">
                                                                Upload Foto{" "}
                                                                {index + 1}
                                                            </p>
                                                            <p className="text-[9px] text-gray-500 mt-0.5">
                                                                Disarankan
                                                                potrait
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                handleHighlightChange(
                                                                    index,
                                                                    e,
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                )}

                                                {errors[fieldName] && (
                                                    <p className="absolute bottom-2 left-2 bg-white/90 px-1.5 py-0.5 rounded text-red-500 text-[10px] shadow-sm">
                                                        {errors[fieldName]}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Foto Sampul */}

                            {/* Alamat */}
                            <div className="md:col-span-2 mt-2">
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
                            <div className="md:col-span-2 mt-2">
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
