import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Offcanvas from "@/Components/Offcanvas";
import PrimaryButton from "@/Components/PrimaryButton";
import Switch from "@/Components/Switch";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import axios from "axios";
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
        activeMenu: {},
    });
    const flash = usePage().props.flash;
    const [Menu, setMenu] = useState([]);
    const GetMenu = () => {
        axios.get(route("getData.get-list-feature")).then((res) => {
            if (res.data.status == false) {
                setMenu([]);
            } else {
                setMenu(res.data.data);
            }
        });
    };

    useEffect(() => {
        GetMenu();
    }, [open]);
    // isi form saat edit, reset saat add
    useEffect(() => {
        if (open) {
            if (isEdit) {
                const activeMenu = {};

                role?.list_features?.forEach((item) => {
                    activeMenu[item.id] = true;
                });

                setData({
                    id: role.id,
                    nama_roles: role.nama_roles,
                    activeMenu: activeMenu,
                });
            } else {
                reset();
            }
        }
    }, [role, open, isEdit]);

    const submit = (e) => {
        e.preventDefault();

        if (isEdit) {
            post(route("manajemen.hak-akses.update", { data }), {
                onSuccess: () => {
                    if (flash?.success) {
                        getRoles();
                        setOpen(false);
                        reset();
                        showAlert(flash.success, "success");
                        flash.success = null;
                    }
                    if (flash?.error) {
                        console.log(flash.error);
                        getRoles();
                        setOpen(false);
                        reset();
                        showAlert(flash.error, "error");
                        flash.error = null;
                    }
                },

                onError: () => {
                    showAlert("Data gagal diubah", "error");
                },
            });
        } else {
            post(route("manajemen.hak-akses.store"), {
                onSuccess: () => {
                    console.log(flash.success);
                    getRoles();
                    setOpen(false);
                    reset();
                    showAlert(flash.success, "success");
                    flash.success = null;
                },

                onError: () => {
                    showAlert(flash.error, "error");
                },
            });
        }
    };
    const [search, setSearch] = useState("");

    const filteredMenu = Menu?.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()),
    );
    return (
        <Offcanvas
            open={open}
            onClose={!processing ? () => setOpen(false) : null}
            icon={<i className="fa-solid fa-shield-halved"></i>}
            title={isEdit ? "Ubah Hak Akses" : "Tambah Hak Akses"}
            staticBackdrop={true}
            width="w-1/3"
        >
            <div className="overflow-auto h-auto">
                <form onSubmit={submit}>
                    <div className="space-y-1 mb-5">
                        <div className="flex justify-end p-2 ">
                            <PrimaryButton
                                className="mb-2"
                                type="submit"
                                disabled={processing}
                                loading={processing}
                            >
                                {isEdit ? (
                                    <i className="fa fa-pen me-2"></i>
                                ) : (
                                    <i className="fa fa-plus me-2"></i>
                                )}{" "}
                                {isEdit ? "Ubah" : "Simpan"}
                            </PrimaryButton>
                        </div>
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
                        <InputError
                            message={errors.nama_roles}
                            className="mt-1"
                        />
                        <p className="text-gray-500 text-sm ">
                            Isi dengan nama peran fungsional dalam institusi.
                        </p>
                    </div>
                    <InputLabel value="Search" htmlFor="search" />
                    <TextInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon="search"
                        placeholder="Cari"
                        width="w-50"
                    />
                    <div className="h-50">
                        <div className="space-y-4">
                            {filteredMenu?.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 py-3"
                                >
                                    {/* LEFT */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50">
                                            <i
                                                className={`fa ${item.icon} text-lg`}
                                            />
                                        </div>

                                        <div className="leading-tight">
                                            <p className="text-sm font-medium text-gray-800">
                                                {item.label}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.deskripsi}
                                            </p>
                                        </div>
                                    </div>

                                    {/* RIGHT */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-6 w-px bg-gray-200" />

                                        <Switch
                                            checked={
                                                !!data.activeMenu?.[item.id]
                                            }
                                            onChange={(value) => {
                                                const updated = {
                                                    ...data.activeMenu,
                                                };

                                                if (value) {
                                                    updated[item.id] = true;
                                                } else {
                                                    delete updated[item.id];
                                                }

                                                setData("activeMenu", updated);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </div>
        </Offcanvas>
    );
}
