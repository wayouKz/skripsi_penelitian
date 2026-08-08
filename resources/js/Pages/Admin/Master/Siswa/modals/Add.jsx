import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function Add({
    open,
    setOpen,
    Siswa = null,
    isEdit = false,
    getSiswa,
}) {
    const { data, post, reset, errors, setData, processing } = useForm({
        nisn: "",
        nama_siswa: "",
        jenis_kelamin: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        alamat: "",
        no_telp: "",
        no_telp_orang_tua: "",
        foto: "",
        status: "active",
    });
    const { showAlert } = useAlert();
    const flash = usePage().props.flash;

    const submit = (e) => {
        e.preventDefault();

        if (isEdit) {
            post(
                route("master.siswa.update", {
                    id: Siswa.id,
                }),
                {
                    onSuccess: () => {
                        const success = flash.success;
                        const error = flash.error;
                        if (success) {
                            showAlert(success, "success");
                        } else {
                            showAlert(error, "error");
                        }
                        setOpen(false);
                        getSiswa();
                        reset();
                    },
                },
            );
        } else {
            post(route("master.siswa.store"), {
                onSuccess: (page) => {
                    const success = flash.success;
                    const error = flash.error;
                    if (success !== null) {
                        showAlert(success, "success");
                        setOpen(false);
                        getSiswa();
                        reset();
                    } else if (error !== null) {
                        showAlert(error, "error");
                    }
                },
            });
        }
    };

    useEffect(() => {
        if (isEdit) {
            setData({
                nisn: Siswa?.nisn,
                nama_siswa: Siswa?.nama_siswa,
                jenis_kelamin: Siswa?.jenis_kelamin,
                tempat_lahir: Siswa?.tempat_lahir,
                tanggal_lahir: Siswa?.tanggal_lahir,
                alamat: Siswa?.alamat,
                no_telp: Siswa?.no_telp,
                no_telp_orang_tua: Siswa?.no_telp_orang_tua,
                foto: Siswa?.foto,
                status: Siswa?.status,
            });
        } else {
            reset();
        }
    }, [isEdit, Siswa]);

    const previewImage =
        data.foto instanceof File
            ? URL.createObjectURL(data.foto)
            : data.foto
              ? `/storage/public/foto/${data.foto}`
              : null;
    const fields = [
        {
            label: "Nama Siswa",
            name: "nama_siswa",
            type: "text",
            placeholder: "Masukkan nama lengkap",
        },
        {
            label: "NISN",
            name: "nisn",
            type: "text",
            placeholder: "Masukkan NISN",
        },
        {
            label: "Jenis Kelamin",
            name: "jenis_kelamin",
            type: "select",
            options: [
                { label: "Laki-laki", value: "Laki-laki" },
                { label: "Perempuan", value: "Perempuan" },
            ],
        },
        {
            label: "Tempat Lahir",
            name: "tempat_lahir",
            type: "text",
            placeholder: "Masukkan tempat lahir",
        },
        {
            label: "Tanggal Lahir",
            name: "tanggal_lahir",
            colSpan: "col-span-2",
            type: "date",
        },
        {
            label: "Alamat",
            name: "alamat",
            type: "textarea",
            colSpan: "col-span-2",
            placeholder: "Masukkan alamat lengkap",
        },
        {
            label: "No Telp Siswa",
            name: "no_telp",
            type: "phone",
        },
        {
            label: "No Telp Orang Tua",
            name: "no_telp_orang_tua",
            type: "phone",
        },
    ];
    return (
        <FormModal
            title={isEdit ? "Edit Siswa" : "Tambah Siswa"}
            show={open}
            loading={processing}
            onClose={() => setOpen(false)}
            setOpen={setOpen}
            onSubmit={submit}
        >
            <div className="flex justify-center hidden">
                <label className="relative cursor-pointer group">
                    <div className=" w-12 h-12 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden">
                        {previewImage ? (
                            <img
                                src={previewImage}
                                alt="preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <i className="fa fa-camera text-2xl"></i>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white border flex items-center justify-center shadow">
                        <i className="fa fa-plus text-xs"></i>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setData("foto", e.target.files[0])}
                    />
                </label>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {fields.map((field, index) => (
                    <div
                        key={index}
                        className={`flex flex-col gap-2 ${field.colSpan || ""}`}
                    >
                        <label className="text-sm font-medium text-gray-700">
                            {field.label}
                        </label>

                        {/* TEXT */}
                        {field.type === "text" && (
                            <input
                                type="text"
                                value={data[field.name]}
                                placeholder={field.placeholder}
                                onChange={(e) =>
                                    setData(field.name, e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        )}

                        {/* DATE */}
                        {field.type === "date" && (
                            <input
                                type="date"
                                value={data[field.name]}
                                onChange={(e) =>
                                    setData(field.name, e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        )}

                        {/* SELECT */}
                        {field.type === "select" && (
                            <select
                                value={data[field.name]}
                                onChange={(e) =>
                                    setData(field.name, e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Pilih Jenis Kelamin</option>

                                {field.options.map((item, i) => (
                                    <option key={i} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* TEXTAREA */}
                        {field.type === "textarea" && (
                            <textarea
                                rows={3}
                                value={data[field.name]}
                                placeholder={field.placeholder}
                                onChange={(e) =>
                                    setData(field.name, e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        )}

                        {/* PHONE */}
                        {field.type === "phone" && (
                            <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                                <div className="px-3 bg-gray-100 flex items-center text-sm text-gray-500 border-r">
                                    +62
                                </div>

                                <input
                                    type="text"
                                    value={data[field.name]}
                                    placeholder="8123456789"
                                    onChange={(e) =>
                                        setData(field.name, e.target.value)
                                    }
                                    className="w-full px-4 py-3 text-sm border-none focus:ring-0"
                                />
                            </div>
                        )}

                        {/* ERROR */}
                        {errors[field.name] && (
                            <p className="text-sm text-red-500">
                                {errors[field.name]}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </FormModal>
    );
}
