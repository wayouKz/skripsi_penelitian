import { useState, useEffect, useMemo } from "react";
import { useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useAlert } from "@/Components/AlertContext";
import Offcanvas from "@/Components/Offcanvas";
import PrimaryButton from "@/Components/PrimaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import Switch from "@/Components/Switch";

export default function Add({
    open,
    setOpen,
    role = null,
    isEdit = false,
    getRoles,
}) {
    const { showAlert } = useAlert();
    const flash = usePage().props.flash;

    const [menus, setMenus] = useState([]);
    const [search, setSearch] = useState("");

    const { data, setData, processing, reset, errors } = useForm({
        id: null,
        nama_roles: "",
        activeMenu: {},
    });

    const getMenuData = () => {
        axios.get(route("getData.get-list-feature")).then((res) => {
            setMenus(res.data?.status !== false ? res.data.data || [] : []);
        });
    };

    useEffect(() => {
        if (open) getMenuData();
    }, [open]);

    useEffect(() => {
        if (!open) return;

        if (isEdit && role) {
            const activeMenu = {};
            role.list_features?.forEach((item) => {
                activeMenu[item.id] = {
                    can_view: Number(item.pivot?.can_view) === 1,
                    can_create: Number(item.pivot?.can_create) === 1,
                    can_update: Number(item.pivot?.can_update) === 1,
                    can_delete: Number(item.pivot?.can_delete) === 1,
                };
            });

            setData({
                id: role.id,
                nama_roles: role.nama_roles || "",
                activeMenu,
            });
        } else {
            reset();
        }
    }, [role, open, isEdit]);

    const filteredMenu = useMemo(() => {
        if (!search) return menus;
        return menus.filter((item) =>
            item.label?.toLowerCase().includes(search.toLowerCase()),
        );
    }, [menus, search]);

    const checkIsDashboard = (item) =>
        item.route === "dashboard" || item.label?.toLowerCase() === "dashboard";

    const submit = (e) => {
        e.preventDefault();

        const dashboardMenus = {};
        menus.forEach((item) => {
            if (checkIsDashboard(item)) {
                dashboardMenus[item.id] = {
                    can_view: true,
                    can_create: true,
                    can_update: true,
                    can_delete: true,
                };
            }
        });

        const finalActiveMenu = {
            ...data.activeMenu,
            ...dashboardMenus,
        };

        if (Object.keys(finalActiveMenu).length === 0) {
            showAlert("Minimal pilih 1 hak akses menu", "warning");
            return;
        }

        const payload = {
            id: data.id,
            nama_roles: data.nama_roles,
            activeMenu: finalActiveMenu,
        };

        const submitRoute = isEdit
            ? route("manajemen.kelola-hak-akses.update", { id: data.id })
            : route("manajemen.kelola-hak-akses.store");

        router.post(submitRoute, payload, {
            onSuccess: () => {
                getRoles();
                setOpen(false);
                reset();
                if (flash?.success) showAlert(flash.success, "success");
            },
            onError: () => {
                showAlert(
                    flash?.error ||
                        (isEdit ? "Data gagal diubah." : "Data gagal disimpan"),
                    "error",
                );
            },
        });
    };

    return (
        <Offcanvas
            open={open}
            onClose={!processing ? () => setOpen(false) : null}
            icon={<i className="fa-solid fa-shield-halved"></i>}
            title={isEdit ? "Ubah Hak Akses" : "Tambah Hak Akses"}
            staticBackdrop={true}
            width="w-1/2"
        >
            <form onSubmit={submit} className="space-y-4">
                {/* Warning Box */}
                <div className="flex items-start gap-2.5 rounded-xl border border-yellow-200 bg-yellow-50 p-3 shadow-xs">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                        <i className="fa-solid fa-triangle-exclamation text-xs"></i>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-yellow-800">
                            Perhatian
                        </h4>
                        <p className="mt-0.5 text-xs text-yellow-700 leading-normal">
                            Pastikan hak akses sudah benar sebelum disimpan.
                        </p>
                    </div>
                </div>

                {/* Top Actions */}
                <div className="flex justify-end">
                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                        loading={processing}
                        className="h-9 px-3 text-xs"
                    >
                        <i
                            className={`fa fa-${isEdit ? "pen" : "plus"} me-1.5`}
                        ></i>
                        {isEdit ? "Ubah" : "Simpan"}
                    </PrimaryButton>
                </div>

                {/* Nama Peran Input */}
                <div className="space-y-1.5">
                    <InputLabel
                        value="Nama Peran"
                        htmlFor="nama_roles"
                        className="text-xs font-medium text-gray-700"
                    />
                    <TextInput
                        id="nama_roles"
                        placeholder="Contoh: Guru Mata Pelajaran"
                        icon="shield-alt"
                        type="text"
                        value={data.nama_roles}
                        onChange={(e) => setData("nama_roles", e.target.value)}
                        error={errors.nama_roles}
                        className="text-xs py-1.5"
                    />
                    <InputError
                        message={errors.nama_roles}
                        className="text-[10px]"
                    />
                </div>

                {/* Search Menu Input */}
                <div className="space-y-1.5 border-t border-gray-100 pt-3">
                    <InputLabel
                        value="Cari Hak Akses Menu"
                        htmlFor="search"
                        className="text-xs"
                    />
                    <TextInput
                        id="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon="search"
                        placeholder="Ketik nama menu..."
                        className="text-xs py-1.5"
                    />
                </div>

                {/* Menu List */}
                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {filteredMenu.map((item) => {
                        const isDashboard = checkIsDashboard(item);
                        const isActive = isDashboard
                            ? true
                            : !!data.activeMenu?.[item.id]?.can_view;

                        return (
                            <div
                                key={item.id}
                                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                                    isActive
                                        ? "border-green-200 bg-white shadow-xs"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <div className="flex items-center justify-between p-3.5">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                                                isActive
                                                    ? "bg-green-600 text-white shadow-xs"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            <i
                                                className={`fa ${item.icon || "fa-folder"} text-sm`}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-xs font-semibold text-gray-800">
                                                    {item.label}
                                                </h3>
                                                {isDashboard ? (
                                                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[9px] font-semibold text-yellow-700">
                                                        DEFAULT
                                                    </span>
                                                ) : (
                                                    isActive && (
                                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">
                                                            ACTIVE
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500 truncate max-w-[220px]">
                                                {item.deskripsi}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        {isDashboard ? (
                                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 flex items-center gap-1">
                                                <i className="fa fa-lock text-[8px]"></i>{" "}
                                                Read-Only
                                            </span>
                                        ) : (
                                            <></>
                                            // <Switch
                                            //     checked={isActive}
                                            //     onChange={(value) => {
                                            //         setData("activeMenu", {
                                            //             ...data.activeMenu,
                                            //             [item.id]: {
                                            //                 can_view: value,
                                            //                 can_create: value,
                                            //                 can_update: value,
                                            //                 can_delete: value,
                                            //             },
                                            //         });
                                            //     }}
                                            // />
                                        )}
                                    </div>
                                </div>

                                {/* CRUD Sub-Panel */}
                                <div
                                    className={`grid transition-all duration-200 ${isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="border-t border-gray-100 bg-gray-50/50 p-3">
                                            {isDashboard ? (
                                                <div className="rounded-lg border border-green-100 bg-white p-2 text-[11px] text-green-700">
                                                    Dashboard otomatis
                                                    Read-Only.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                    {[
                                                        "can_view",
                                                        "can_create",
                                                        "can_update",
                                                        "can_delete",
                                                    ].map((action) => {
                                                        const labelMap = {
                                                            can_view: "View",
                                                            can_create:
                                                                "Create",
                                                            can_update:
                                                                "Update",
                                                            can_delete:
                                                                "Delete",
                                                        };
                                                        const iconMap = {
                                                            can_view: "eye",
                                                            can_create: "plus",
                                                            can_update: "pen",
                                                            can_delete: "trash",
                                                        };
                                                        const colorMap = {
                                                            can_view: "green",
                                                            can_create: "green",
                                                            can_update:
                                                                "yellow",
                                                            can_delete: "red",
                                                        };

                                                        return (
                                                            <div
                                                                key={action}
                                                                className="rounded-lg border border-gray-200 bg-white p-2 flex items-center justify-between shadow-2xs"
                                                            >
                                                                <div className="flex items-center gap-1.5">
                                                                    <div
                                                                        className={`text-[11px] text-${colorMap[action]}-500`}
                                                                    >
                                                                        <i
                                                                            className={`fa fa-${iconMap[action]}`}
                                                                        ></i>
                                                                    </div>
                                                                    <span className="text-[11px] font-medium text-gray-700">
                                                                        {
                                                                            labelMap[
                                                                                action
                                                                            ]
                                                                        }
                                                                    </span>
                                                                </div>
                                                                {/* <Switch
                                                                    checked={
                                                                        !!data
                                                                            .activeMenu?.[
                                                                            item
                                                                                .id
                                                                        ]?.[
                                                                            action
                                                                        ]
                                                                    }
                                                                    onChange={(
                                                                        val,
                                                                    ) => {
                                                                        setData(
                                                                            "activeMenu",
                                                                            {
                                                                                ...data.activeMenu,
                                                                                [item.id]:
                                                                                    {
                                                                                        ...data
                                                                                            .activeMenu?.[
                                                                                            item
                                                                                                .id
                                                                                        ],
                                                                                        [action]:
                                                                                            val,
                                                                                    },
                                                                            },
                                                                        );
                                                                    }}
                                                                /> */}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </form>
        </Offcanvas>
    );
}
