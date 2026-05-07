import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import { useForm } from "@inertiajs/react";
import { useEffect } from "react";

export default function Add({
    open,
    setOpen,
    Guru = null,
    isEdit = false,
    getGuru,
}) {
    const { showAlert } = useAlert();
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
                        showAlert("Data berhasil diubah", "success");
                        reset();
                        getGuru();
                    },
                    onError: () => {
                        showAlert("Data gagal diubah", "error");
                    },
                },
            );
        } else {
            post(route("master.guru.store"), {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    getGuru();
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
            <div className=" grid grid-cols-2 gap-4">
                <div className="">
                    <label className="mb-1 block text-sm">Nama</label>
                    <TextInput
                        type="text"
                        className="w-full rounded border px-3 py-2"
                        value={data.nama_guru}
                        onChange={(e) => setData("nama_guru", e.target.value)}
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
                        type="text"
                        className="w-full rounded border px-3 py-2"
                        value={data.nip}
                        onChange={(e) => setData("nip", e.target.value)}
                    />
                    {errors.nip && (
                        <InputError message={errors.nip} className="mt-2" />
                    )}
                </div>
                <div className="">
                    <label className="mb-1 block text-sm">Tanggal Lahir</label>
                    <TextInput
                        type="date"
                        className="w-full rounded border px-3 py-2"
                        value={data.tanggal_lahir}
                        onChange={(e) =>
                            setData("tanggal_lahir", e.target.value)
                        }
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
                        type="text"
                        className="w-full rounded border px-3 py-2"
                        value={data.tempat_lahir}
                        onChange={(e) =>
                            setData("tempat_lahir", e.target.value)
                        }
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
                        type="text"
                        className="w-full rounded border px-3 py-2"
                        value={data.alamat}
                        onChange={(e) => setData("alamat", e.target.value)}
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
                            type="text"
                            className="w-full rounded-r-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={data.no_telp}
                            onChange={(e) =>
                                setData(
                                    "no_telp",
                                    e.target.value.replace(/^0/, ""),
                                )
                            }
                            placeholder="81234567890"
                        />
                    </div>

                    {errors.no_telp && (
                        <InputError message={errors.no_telp} className="mt-2" />
                    )}
                </div>
                <div className="col-span-2">
                    <label className="mb-1 block text-sm">Jenis Kelamin</label>
                    <select
                        className="w-full rounded  px-3 py-2"
                        value={data.jenis_kelamin}
                        onChange={(e) =>
                            setData("jenis_kelamin", e.target.value)
                        }
                    >
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
