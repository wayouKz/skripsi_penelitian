import { useAlert } from "@/Components/AlertContext";
import Checkbox from "@/Components/Checkbox";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import axios from "axios";

export default function Add({
    open,
    setOpen,
    Jurusan = null,
    isEdit = false,
    getJurusan,
}) {
    const { data, post, reset, errors, setData } = useForm({
        nama_jurusan: "",
    });

    const { showAlert } = useAlert();
    const { flash } = usePage().props;

    const submit = (e) => {
        e.preventDefault();

        // Tentukan route dinamis berdasarkan aksi (Tambah / Edit)
        if (isEdit) {
            post(route("master.jurusan.update", { id: Jurusan.id }), {
                onSuccess: () => {
                    if (flash.success) {
                        showAlert(flash.success, "success");
                    } else if (flash.error) {
                        showAlert(flash.error, "error");
                    }
                    setOpen(false);
                    getJurusan();
                    reset();
                },
            });
        } else {
            post(route("master.jurusan.store"), {
                onSuccess: () => {
                    if (flash.success) {
                        showAlert(flash.success, "success");
                    } else if (flash.error) {
                        showAlert(flash.error, "error");
                    }
                    setOpen(false);
                    getJurusan();
                    reset();
                },
            });
        }
    };
    // Sinkronisasi data saat mode Edit atau Reset saat Tambah Baru
    useEffect(() => {
        if (isEdit && Jurusan) {
            setData({
                nama_jurusan: Jurusan.nama_jurusan || "",
            });
        } else {
            reset();
        }
    }, [isEdit, Jurusan]);

    return (
        <FormModal
            title={isEdit ? "Edit Jurusan" : "Tambah Jurusan"}
            show={open}
            onClose={() => setOpen(false)}
            onSubmit={submit}
        >
            <div className="grid grid-cols-2 gap-4">
                {/* Field Wali Kelas */}

                {/* Field Nama Kelas */}
                <div className="col-span-2">
                    <InputLabel value="Nama Jurusan" />
                    <TextInput
                        icon="tag"
                        type="text"
                        placeholder="Contoh: IPA, IPS"
                        value={data.nama_jurusan}
                        onChange={(e) =>
                            setData("nama_jurusan", e.target.value)
                        }
                    />
                    <InputError message={errors.nama_jurusan} />
                </div>
            </div>
        </FormModal>
    );
}
