import { useAlert } from "@/Components/AlertContext";
import AppSelect from "@/Components/AppSelect";
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

    const isEdit = !!selectedData;

    useEffect(() => {
        if (open) {
            if (isEdit) {
                setData({
                    name: selectedData.name || "",
                    username: selectedData.username || "",
                    role_id: selectedData.role_id || "",
                });
            } else {
                reset();
            }
        }
    }, [selectedData, open]);

    const onSubmit = (e) => {
        e.preventDefault();

        const submitRoute = isEdit
            ? route("manajemen.kelola-user.update", { id: selectedData.id })
            : route("manajemen.kelola-user.store");

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

    // Kustomisasi ukuran styling react-select agar kompak (small)

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
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-1">
                        <InputLabel
                            htmlFor="name"
                            value="Nama User"
                            className="text-xs font-semibold text-gray-700"
                        />
                        <TextInput
                            id="name"
                            type="text"
                            icon="user"
                            placeholder="Masukkan nama user"
                            className="mt-1 block w-full text-xs py-1.5 px-3 rounded-xl"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        <InputError
                            message={errors.name}
                            className="mt-1 text-[10px]"
                        />
                    </div>

                    <div className="col-span-1">
                        <InputLabel
                            htmlFor="username"
                            value="Username"
                            className="text-xs font-semibold text-gray-700"
                        />
                        <TextInput
                            id="username"
                            type="text"
                            icon="tag"
                            placeholder="Masukkan Username"
                            className="mt-1 block w-full text-xs py-1.5 px-3 rounded-xl"
                            value={data.username}
                            onChange={(e) =>
                                setData("username", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.username}
                            className="mt-1 text-[10px]"
                        />
                    </div>

                    <div className="col-span-2">
                        <InputLabel
                            htmlFor="role_id"
                            value="Peran"
                            className="text-xs font-semibold text-gray-700 mb-1"
                        />
                        <AppSelect
                            options={roleOptions}
                            value={
                                roleOptions.find(
                                    (o) => o.value === data.role_id,
                                ) || null
                            }
                            onChange={(opt) =>
                                setData("role_id", opt?.value || "")
                            }
                            placeholder="Pilih Peran..."
                            error={!!errors.role_id}
                        />
                        <InputError
                            message={errors.role_id}
                            className="mt-1 text-[10px]"
                        />
                    </div>
                </div>
            </div>
        </FormModal>
    );
}
