import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";
import Select from "react-select";

export default function Add({ open, setOpen, selectedData = null, getData }) {
    const { data, setData, errors, processing, post, reset } = useForm({
        name: "",
        username: "",
        role_id: "",
    });

    const [role, setRole] = useState([]);
    const flash = usePage().props.flash;
    const { showAlert } = useAlert();

    // Mengecek apakah komponen berjalan dalam mode Edit atau Tambah Baru
    const isEdit = !!selectedData;

    // 1. Isi form saat edit, reset form saat tambah baru
    useEffect(() => {
        if (open) {
            if (isEdit) {
                setData({
                    name: selectedData.name || "",
                    username: selectedData.username || "",
                    role_id: selectedData.role_id || "",
                });
            } else {
                reset(); // Bersihkan form jika mode tambah data
            }
        }
    }, [selectedData, open]);

    // 2. Handler submit untuk mengarahkan ke rute store atau update
    const onSubmit = (e) => {
        e.preventDefault();

        const submitRoute = isEdit
            ? route("manajemen.kelola-user.update", { id: selectedData.id })
            : route("manajemen.kelola-user.store"); // Rute simpan data baru

        post(submitRoute, {
            onSuccess: () => {
                setOpen(false);
                reset();
                showAlert(flash.success, "success");
                getData();
            },
            onError: () => {
                showAlert(flash.error, "error");
            },
        });
    };

    // 3. Mengambil daftar peran (roles) untuk pilihan dropdown
    const getRole = async () => {
        try {
            const response = await axios.get(
                route("manajemen.kelola-hak-akses.getHakAkses"),
            );
            setRole(response.data?.data || []);
        } catch (error) {
            console.error("Gagal memuat data peran:", error);
        }
    };

    const roleOptions =
        role?.map((item) => ({
            value: item.id,
            label: item.nama_roles,
        })) || [];

    useEffect(() => {
        if (open) {
            getRole();
        }
    }, [open]);

    return (
        <FormModal
            onSubmit={onSubmit}
            show={open}
            loading={processing}
            onClose={() => setOpen(false)}
            title={
                isEdit
                    ? "Edit User: " + (selectedData?.name || "")
                    : "Tambah Akun Pengguna Baru"
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <InputLabel htmlFor="name" value="Nama User" />
                        <TextInput
                            id="name"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="col-span-1">
                        <InputLabel htmlFor="username" value="Username" />
                        <TextInput
                            id="username"
                            type="text"
                            icon="tag"
                            className="mt-1 block w-full"
                            value={data.username}
                            onChange={(e) =>
                                setData("username", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.username}
                            className="mt-2"
                        />
                    </div>

                    <div className="col-span-2">
                        <InputLabel htmlFor="role_id" value="Peran" />
                        <Select
                            options={roleOptions}
                            value={
                                roleOptions.find(
                                    (option) => option.value === data.role_id,
                                ) || null
                            }
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            placeholder="Pilih Peran..."
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                            }}
                            onChange={(selectedOption) =>
                                setData("role_id", selectedOption?.value || "")
                            }
                        />
                        <InputError message={errors.role_id} className="mt-2" />
                    </div>
                </div>
            </div>
        </FormModal>
    );
}
