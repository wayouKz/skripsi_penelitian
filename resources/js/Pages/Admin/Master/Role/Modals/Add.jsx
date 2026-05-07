import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Offcanvas from "@/Components/Offcanvas";
import Switch from "@/Components/Switch";
import TextInput from "@/Components/TextInput";
import { useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function Add({
    open,
    setOpen,
    role = null,
    isEdit = false,
    getRoles,
}) {
    const { showAlert } = useAlert();
    const { data, setData, post, put, processing, reset, errors } = useForm({
        nama_roles: "",
        status: "active",
    });
    const [activeSwitch, setActiveSwitch] = useState(true);
    // isi form saat edit, reset saat add
    useEffect(() => {
        if (open) {
            if (isEdit) {
                setData({
                    nama_roles: role.nama_roles,
                    status: role.status,
                });
            } else {
                reset();
            }
        }
    }, [role, open, isEdit]);

    const submit = (e) => {
        e.preventDefault();

        if (isEdit) {
            post(
                route("master.role.update", {
                    id: role.id,
                }),
                {
                    onSuccess: () => {
                        setOpen(false);
                        showAlert("Data berhasil diubah", "success");
                        reset();
                        getRoles();
                    },
                    onError: () => {
                        showAlert("Data gagal diubah", "error");
                    },
                },
            );
        } else {
            post(route("master.role.store"), {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    getRoles();
                },
            });
        }
    };

    return (
        <Offcanvas
            open={open}
            onClose={!processing ? () => setOpen(false) : null}
            icon={<i className="fa-solid fa-shield-halved"></i>}
            title="Tambah Hak Akses"
            staticBackdrop={true}
            width="w-1/3"
        >
            <div className="overflow-auto h-auto">
                <form>
                    <div className="space-y-1 mb-5">
                        <InputLabel
                            value="Nama Peran"
                            htmlFor="status"
                            className="block text-sm font-medium text-gray-700"
                        />
                        <TextInput
                            placeholder="Contoh: Guru Mata Pelajaran"
                            icon="shield-alt    "
                            label="Nama Role"
                            type="text"
                            value={data.nama_roles}
                            onChange={(e) =>
                                setData("nama_roles", e.target.value)
                            }
                            error={errors.nama_roles}
                        />
                        <p className="text-gray-500 text-sm ">
                            Isi dengan nama peran fungsional dalam institusi.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <div className="flex">
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 ">
                                    <i className="fa-solid fa-table-cells-large text-lg"></i>
                                </span>
                                <span className="ms-4 mt-2">Dashboard</span>
                            </div>
                            <Switch
                                checked={activeSwitch}
                                onChange={(value) => setActiveSwitch(value)}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </Offcanvas>
    );
}
