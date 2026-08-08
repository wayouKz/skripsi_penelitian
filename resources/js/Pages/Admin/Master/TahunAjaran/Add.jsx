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
    TahunAjaran = null,
    isEdit = false,
    getTahunAjaran,
    loading,
}) {
    const { data, post, reset, errors, setData, processing } = useForm({
        tahun_ajaran: "",
        semester: "",
        status: "active",
    });
    const { showAlert } = useAlert();
    const flash = usePage().props.flash;

    const submit = (e) => {
        e.preventDefault();

        const options = {};

        if (isEdit) {
            post(
                route("master.tahun-ajaran.update", {
                    id: TahunAjaran.id,
                }),
                {
                    onSuccess: (page) => {
                        if (flash?.success) {
                            showAlert(flash?.success, "success");
                        } else if (flash?.error) {
                            showAlert(flash?.error, "error");
                        }

                        setOpen(false);
                        getTahunAjaran();
                        reset();
                    },
                },
            );
        } else {
            post(route("master.tahun-ajaran.store"), {
                onSuccess: (page) => {
                    if (flash?.success) {
                        showAlert(flash?.success, "success");
                    } else if (flash?.error) {
                        showAlert(flash?.error, "error");
                    }

                    setOpen(false);
                    getTahunAjaran();
                    reset();
                },
            });
        }
    };

    const ambilTahun = () => {
        const tahunSekarang = new Date().getFullYear();

        const data = [];

        for (let i = 0; i < 3; i++) {
            const awal = tahunSekarang - i;
            const akhir = awal + 1;

            data.push(`${awal}/${akhir}`);
        }

        return data;
    };

    useEffect(() => {
        if (isEdit) {
            setData("tahun_ajaran", TahunAjaran.tahun_ajaran);
            setData("semester", TahunAjaran.semester);
            setData("status", TahunAjaran.status);
        } else {
            setData("tahun_ajaran", "");
            setData("semester", "");
            setData("status", "active");
        }
    }, [isEdit]);
    return (
        <FormModal
            title={isEdit ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
            show={open}
            onClose={() => setOpen(false)}
            setOpen={setOpen}
            onSubmit={submit}
            loading={processing}
        >
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                    <InputLabel for="tahun_ajaran" value="Tahun Ajaran" />
                    <select
                        name="tahun_ajaran"
                        id="tahun_ajaran"
                        value={data.tahun_ajaran}
                        onChange={(e) => {
                            setData("tahun_ajaran", e.target.value);
                        }}
                        className={`mt-1 block w-full py-2 px-3 border ${errors.tahun_ajaran ? "border-red-500" : ""} border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    >
                        <option value="">[Pilih Tahun Ajaran]</option>
                        {ambilTahun().map((tahun, index) => (
                            <option key={index} value={tahun}>
                                {tahun}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.tahun_ajaran} />
                </div>
                <div className="col-span-1">
                    <InputLabel for="semester" value="Semester" />
                    <select
                        name="semester"
                        id="semester"
                        value={data.semester}
                        onChange={(e) => {
                            setData("semester", e.target.value);
                        }}
                        className={`${errors.semester ? "border-red-500" : ""} mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    >
                        <option value="">[Pilih Semester]</option>
                        <option value="ganjil">Ganjil</option>
                        <option value="genap">Genap</option>
                    </select>
                    <InputError message={errors.semester} />
                </div>
            </div>
        </FormModal>
    );
}
