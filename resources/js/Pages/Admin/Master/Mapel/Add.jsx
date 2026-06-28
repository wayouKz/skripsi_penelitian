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
    Mapel = null, // Mengubah dari Kelas menjadi Mapel
    isEdit = false,
    getMapel, // Mengubah dari getKelas menjadi getMapel
}) {
    // Hanya butuh nama_mapel di useForm
    const { data, post, reset, errors, setData } = useForm({
        nama_mapel: "",
    });

    const { showAlert } = useAlert();
    const flash = usePage().props.flash;

    const submit = (e) => {
        e.preventDefault();

        if (isEdit) {
            post(
                // Pastikan route ini sesuai dengan route di Laravel Anda
                route("master.mapel.update", {
                    id: Mapel.id,
                }),
                {
                    onSuccess: () => {
                        if (flash.success) {
                            showAlert(flash.success, "success");
                        } else if (flash.error) {
                            showAlert(flash.error, "error");
                        }

                        setOpen(false);
                        getMapel(); // Panggil ulang data mapel
                        reset();
                    },
                },
            );
        } else {
            // Pastikan route ini sesuai dengan route di Laravel Anda
            post(route("master.mapel.store"), {
                onSuccess: () => {
                    if (flash.success) {
                        showAlert(flash.success, "success");
                    } else if (flash.error) {
                        showAlert(flash.error, "error");
                    }

                    setOpen(false);
                    getMapel(); // Panggil ulang data mapel
                    reset();
                },
            });
        }
    };

    // Mengatur nilai input jika sedang dalam mode Edit
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
            onClose={() => setOpen(false)}
            setOpen={setOpen}
            onSubmit={submit}
        >
            <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                    <InputLabel for="nama_mapel" value="Nama Mata Pelajaran" />
                    <TextInput
                        placeholder="Contoh : Matematika"
                        icon="book" // Mengubah icon menjadi buku (opsional, sesuaikan dengan library icon Anda)
                        type="text"
                        name="nama_mapel"
                        id="nama_mapel"
                        value={data.nama_mapel}
                        onChange={(e) => {
                            setData("nama_mapel", e.target.value);
                        }}
                        className="w-full mt-1"
                    />
                    <InputError message={errors.nama_mapel} />
                </div>
            </div>
        </FormModal>
    );
}
