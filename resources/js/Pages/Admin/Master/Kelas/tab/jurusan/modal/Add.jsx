import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect } from "react";

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

        const url = isEdit
            ? route("master.jurusan.update", { id: Jurusan.id })
            : route("master.jurusan.store");

        post(url, {
            onSuccess: () => {
                const message = flash.success || flash.error;
                if (message)
                    showAlert(message, flash.success ? "success" : "error");

                setOpen(false);
                getJurusan();
                reset();
            },
        });
    };

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
            <div className="space-y-3">
                <div>
                    <InputLabel
                        value="Nama Jurusan"
                        className="text-xs font-medium text-gray-700"
                    />
                    <TextInput
                        icon="tag"
                        type="text"
                        placeholder="Contoh: IPA, IPS"
                        value={data.nama_jurusan}
                        onChange={(e) =>
                            setData("nama_jurusan", e.target.value)
                        }
                        className="mt-1 w-full text-xs py-1.5"
                    />
                    <InputError
                        message={errors.nama_jurusan}
                        className="mt-1 text-[10px]"
                    />
                </div>
            </div>
        </FormModal>
    );
}
