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
    Mapel = null,
    isEdit = false,
    getMapel,
}) {
    const { data, post, reset, errors, setData } = useForm({
        nama_mapel: "",
    });

    const { showAlert } = useAlert();
    const flash = usePage().props.flash;
    const [loading, setLoading] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setLoading(true);

        const url = isEdit
            ? route("master.mapel.update", { id: Mapel.id })
            : route("master.mapel.store");

        post(url, {
            onSuccess: () => {
                if (flash.success) {
                    showAlert(flash.success, "success");
                } else if (flash.error) {
                    showAlert(flash.error, "error");
                }
                setLoading(false);
                setOpen(false);
                getMapel();
                reset();
            },
            onError: () => {
                setLoading(false);
            },
        });
    };

    useEffect(() => {
        if (isEdit && Mapel) {
            setData({
                nama_mapel: Mapel.nama_mapel || "",
            });
        } else {
            reset();
        }
    }, [isEdit, Mapel]);

    return (
        <FormModal
            title={isEdit ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
            show={open}
            loading={loading}
            onClose={() => setOpen(false)}
            setOpen={setOpen}
            onSubmit={submit}
        >
            <div className="space-y-3">
                <div>
                    <InputLabel
                        for="nama_mapel"
                        value="Nama Mata Pelajaran"
                        className="text-xs font-medium text-gray-700"
                    />
                    <TextInput
                        placeholder="Contoh : Matematika"
                        icon="book"
                        type="text"
                        name="nama_mapel"
                        id="nama_mapel"
                        value={data.nama_mapel}
                        onChange={(e) => setData("nama_mapel", e.target.value)}
                        className="w-full mt-1 text-xs py-1.5"
                    />
                    <InputError
                        message={errors.nama_mapel}
                        className="mt-1 text-[10px]"
                    />
                </div>
            </div>
        </FormModal>
    );
}
