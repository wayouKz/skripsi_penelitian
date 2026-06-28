import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function Add({
    open,
    setOpen,
    Guru = null,
    isEdit = false,
    getGuru,
}) {
    const { showAlert } = useAlert();
    const flash = usePage().props.flash;
    const [closeAlert, setCloseAlert] = useState(false);
    const { data, setData, post, put, processing, reset, errors } = useForm({
        nama_guru: "",
        jenis_kelamin: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        alamat: "",
        no_telp: "",
        nip: "",
        status: "active",
    });

    // isi form saat edit, reset saat add
    useEffect(() => {
        if (open) {
            if (isEdit) {
                setData({
                    id: Guru.id,
                    nama_guru: Guru.nama_guru,
                    jenis_kelamin: Guru.jenis_kelamin,
                    tempat_lahir: Guru.tempat_lahir,
                    tanggal_lahir: Guru.tanggal_lahir,
                    alamat: Guru.alamat,
                    no_telp: Guru.no_telp,
                    nip: Guru.nip,
                    status: Guru.status,
                });
            } else {
                reset();
            }
        }
    }, [Guru, open, isEdit]);

    const submit = (e) => {
        e.preventDefault();

        if (isEdit) {
            post(
                route("master.guru.update", {
                    id: Guru.nip,
                }),
                {
                    onSuccess: () => {
                        setOpen(false);
                        showAlert(flash.success, "success");
                        reset();
                        getGuru();
                    },
                    onError: () => {
                        showAlert(flash.error, "error");
                    },
                },
            );
        } else {
            post(route("master.guru.store"), {
                onSuccess: () => {
                    console.log(flash);
                    if (flash.success) {
                        setOpen(false);
                        showAlert(flash.success, "success");
                        reset();
                        getGuru();
                    } else if (flash.error) {
                        showAlert(flash.error, "error");
                    }
                },
                onError: () => {
                    showAlert(flash.error, "error");
                },
            });
        }
    };

    return (
        <FormModal
            show={open}
            onClose={() => {
                setOpen(false);
                reset(); // 🔥 RESET DI SINI
            }}
            title={isEdit ? "Edit Guru" : "Tambah Guru"}
            loading={processing}
            onSubmit={submit}
        >
            <div className="">
                {!closeAlert && (
                    <div className="flex items-start justify-between gap-4 rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-4 shadow-lg">
                        {/* LEFT CONTENT */}
                        <div className="flex items-start gap-4">
                            {/* ICON */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                                <i className="fa fa-info text-xl text-white"></i>
                            </div>

                            {/* TEXT */}
                            <div>
                                <p className="font-semibold text-white">
                                    Informasi
                                </p>

                                <p className="mt-1 text-sm leading-relaxed text-yellow-100">
                                    Data ini akan secara otomatis membuat user
                                    login menggunakan{" "}
                                    <span className="font-semibold">NIP</span>{" "}
                                    sebagai username dan password.
                                </p>
                            </div>
                        </div>

                        {/* CLOSE BUTTON */}
                        <button
                            type="button"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30"
                            onClick={() => {
                                setCloseAlert(true);
                            }}
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                )}
            </div>
            <div className=" grid grid-cols-2 gap-4">
                <div className="">
                    <label className="mb-1 block text-sm">Nama</label>
                    <TextInput
                        icon="address-card"
                        placeholder="Nama Guru"
                        type="text"
                        className="w-full rounded border px-3 py-2"
                        value={data.nama_guru}
                        onChange={(e) => setData("nama_guru", e.target.value)}
                        error={errors.nama_guru}
                    />
                    {errors.nama_guru && (
                        <InputError
                            message={errors.nama_guru}
                            className="mt-2"
                        />
                    )}
                </div>
                <div className="">
                    <label className="mb-1 block text-sm">Nip</label>
                    <TextInput
                        icon="address-card"
                        type="text"
                        placeholder="Nip Guru"
                        className="w-full rounded border px-3 py-2"
                        value={data.nip}
                        onChange={(e) => setData("nip", e.target.value)}
                        error={errors.nip}
                    />
                    {errors.nip && (
                        <InputError message={errors.nip} className="mt-2" />
                    )}
                </div>
                <div className="">
                    <label className="mb-1 block text-sm">Tanggal Lahir</label>
                    <TextInput
                        icon="calendar"
                        type="date"
                        placeholder="Tanggal Lahir"
                        className="w-full rounded border px-3 py-2"
                        value={data.tanggal_lahir}
                        onChange={(e) =>
                            setData("tanggal_lahir", e.target.value)
                        }
                        error={errors.tanggal_lahir}
                    />
                    {errors.tanggal_lahir && (
                        <InputError
                            message={errors.tanggal_lahir}
                            className="mt-2"
                        />
                    )}
                </div>
                <div className="">
                    <label className="mb-1 block text-sm">Tempat Lahir</label>
                    <TextInput
                        icon="location-dot"
                        type="text"
                        placeholder="Tempat Lahir"
                        className="w-full rounded border px-3 py-2"
                        value={data.tempat_lahir}
                        onChange={(e) =>
                            setData("tempat_lahir", e.target.value)
                        }
                        error={errors.tempat_lahir}
                    />
                    {errors.tempat_lahir && (
                        <InputError
                            message={errors.tempat_lahir}
                            className="mt-2"
                        />
                    )}
                </div>
                <div className="col-span-2">
                    <label className="mb-1 block text-sm">Alamat</label>
                    <TextInput
                        icon="tag"
                        type="text"
                        placeholder="Alamat"
                        className="w-full rounded border px-3 py-2"
                        value={data.alamat}
                        onChange={(e) => setData("alamat", e.target.value)}
                        error={errors.alamat}
                    />
                    {errors.alamat && (
                        <InputError message={errors.alamat} className="mt-2" />
                    )}
                </div>
                <div className="col-span-2">
                    <label className="mb-1 block text-sm">No Telp</label>

                    <div className="mt-2 flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-sm">
                            +62
                        </span>

                        <TextInput
                            icon="phone"
                            type="text"
                            placeholder="81234567890"
                            className="w-full rounded-r-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            value={data.no_telp}
                            onChange={(e) =>
                                setData(
                                    "no_telp",
                                    e.target.value.replace(/^0/, ""),
                                )
                            }
                            error={errors.no_telp}
                        />
                    </div>

                    {errors.no_telp && (
                        <InputError message={errors.no_telp} className="mt-2" />
                    )}
                </div>
                <div className="col-span-2">
                    <label className="mb-1 block text-sm">Jenis Kelamin</label>
                    <select
                        className={
                            `w-full rounded  px-3 py-2 bg-gray-200` +
                            (errors.jenis_kelamin
                                ? " border-red-500"
                                : " border-gray-300")
                        }
                        value={data.jenis_kelamin}
                        onChange={(e) =>
                            setData("jenis_kelamin", e.target.value)
                        }
                    >
                        <option value="">
                            <p className="text-gray-400">
                                [Pilih Jenis Kelamin]
                            </p>
                        </option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                    </select>
                    {errors.alamat && (
                        <InputError message={errors.alamat} className="mt-2" />
                    )}
                </div>
            </div>
        </FormModal>
    );
}
