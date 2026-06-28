import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Offcanvas from "@/Components/Offcanvas";
import PrimaryButton from "@/Components/PrimaryButton";
import Switch from "@/Components/Switch";
import TextInput from "@/Components/TextInput";
import { router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState, useMemo } from "react";

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

    // 1. Definisikan bentuk form awal
    const { data, setData, post, put, processing, reset, errors } = useForm({
        id: null,
        nama_roles: "",
        activeMenu: {},
    });

    // Fetch daftar fitur dari database
    const getMenuData = () => {
        axios.get(route("getData.get-list-feature")).then((res) => {
            if (res.data?.status !== false) {
                setMenus(res.data.data || []);
            } else {
                setMenus([]);
            }
        });
    };

    useEffect(() => {
        if (open) getMenuData();
    }, [open]);

    // 2. Sinkronisasi data saat edit atau tambah baru
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

    // 3. Optimasi pencarian menggunakan useMemo agar tidak re-render berat
    const filteredMenu = useMemo(() => {
        if (!search) return menus;
        return menus.filter((item) =>
            item.label?.toLowerCase().includes(search.toLowerCase()),
        );
    }, [menus, search]);

    // Helper untuk mengecek apakah menu tersebut adalah Dashboard
    const checkIsDashboard = (item) => {
        return (
            item.route === "dashboard" ||
            item.label?.toLowerCase() === "dashboard"
        );
    };

    // // 4. Submit Handler (Perbaikan Payload Inertia)
    // const submit = (e) => {
    //     e.preventDefault();

    //     // Otomatis aktifkan view untuk semua menu Dashboard yang tersedia
    //     const dashboardMenus = {};
    //     menus.forEach((item) => {
    //         if (checkIsDashboard(item)) {
    //             dashboardMenus[item.id] = {
    //                 can_view: true,
    //                 can_create: false,
    //                 can_update: false,
    //                 can_delete: false,
    //             };
    //         }
    //     });

    //     const finalActiveMenu = {
    //         ...data.activeMenu,
    //         ...dashboardMenus,
    //     };

    //     if (Object.keys(finalActiveMenu).length === 0) {
    //         showAlert("Minimal pilih 1 hak akses menu", "warning");
    //         return;
    //     }

    //     // Tentukan method dan rute tujuan
    //     const submitRoute = isEdit
    //         ? route("manajemen.kelola-hak-akses.update", { id: data.id })
    //         : route("manajemen.kelola-hak-akses.store");

    //     // MEMPERBAIKI CARA KIRIM DATA DI INERTIA
    //     // Karena activeMenu diperbarui tepat sebelum dikirim, kita lakukan manual bypass payload
    //     const payload = {
    //         ...data,
    //         activeMenu: finalActiveMenu,
    //     };

    //     router.post(submitRoute, payload, {
    //         onSuccess: () => {
    //             getRoles();
    //             setOpen(false);
    //             reset();
    //             if (flash?.success) {
    //                 showAlert(flash.success, "success");
    //             }
    //         },
    //         onError: () => {
    //             showAlert(
    //                 flash?.error ||
    //                     (isEdit ? "Data gagal diubah" : "Data gagal disimpan"),
    //                 "error",
    //             );
    //         },
    //     });
    // };
    const submit = (e) => {
        e.preventDefault();

        // 1. Ambil semua menu dashboard otomatis
        const dashboardMenus = {};
        menus.forEach((item) => {
            if (checkIsDashboard(item)) {
                dashboardMenus[item.id] = {
                    can_view: true,
                    can_create: false,
                    can_update: false,
                    can_delete: false,
                };
            }
        });

        // 2. Gabungkan dengan menu aktif pilihan user
        const finalActiveMenu = {
            ...data.activeMenu,
            ...dashboardMenus,
        };

        if (Object.keys(finalActiveMenu).length === 0) {
            showAlert("Minimal pilih 1 hak akses menu", "warning");
            return;
        }

        // 3. Siapkan payload utuh yang ter-flat dengan benar
        const payload = {
            id: data.id,
            nama_roles: data.nama_roles,
            activeMenu: finalActiveMenu,
            // _method: isEdit ? "PUT" : "POST" // Aktifkan ini jika Route di Laravel Anda menggunakan Route::put()
        };

        const submitRoute = isEdit
            ? route("manajemen.kelola-hak-akses.update", { id: data.id })
            : route("manajemen.kelola-hak-akses.store");

        // 4. Kirim menggunakan router.post secara eksplisit dengan payload bersih
        router.post(submitRoute, payload, {
            onSuccess: () => {
                getRoles();
                setOpen(false);
                reset();
                if (flash?.success) {
                    showAlert(flash.success, "success");
                }
            },
            onError: (errors) => {
                console.log("Error detail dari Laravel:", errors); // Untuk mempermudah debug di inspect element
                showAlert(
                    flash?.error ||
                        (isEdit
                            ? "Data gagal diubah. Periksa kembali inputan."
                            : "Data gagal disimpan"),
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
            <form onSubmit={submit} className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-100">
                        <i className="fa-solid fa-triangle-exclamation text-yellow-600"></i>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-yellow-800">
                            Perhatian
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-yellow-700">
                            Jika Sudah Selesai Klik Simpan Untuk Menyimpan
                            Perubahan Hak Akses. Pastikan Hak Akses Sudah Benar
                            Sebelum Di {isEdit ? "Ubah" : "Simpan"}.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                        loading={processing}
                    >
                        <i
                            className={`fa fa-${isEdit ? "pen" : "plus"} me-2`}
                        ></i>
                        {isEdit ? "Ubah" : "Simpan"}
                    </PrimaryButton>
                </div>

                <div className="space-y-2">
                    <InputLabel
                        value="Nama Peran"
                        htmlFor="nama_roles"
                        className="block text-sm font-medium text-gray-700"
                    />
                    <TextInput
                        id="nama_roles"
                        placeholder="Contoh: Guru Mata Pelajaran"
                        icon="shield-alt"
                        type="text"
                        value={data.nama_roles}
                        onChange={(e) => setData("nama_roles", e.target.value)}
                        error={errors.nama_roles}
                    />
                    <InputError message={errors.nama_roles} className="mt-1" />
                    <p className="text-gray-400 text-xs">
                        Isi dengan nama peran fungsional dalam institusi.
                    </p>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                    <InputLabel value="Cari Hak Akses Menu" htmlFor="search" />
                    <TextInput
                        id="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon="search"
                        placeholder="Ketik nama menu..."
                    />
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredMenu.map((item) => {
                        const isDashboard = checkIsDashboard(item);
                        const isActive = isDashboard
                            ? true
                            : !!data.activeMenu?.[item.id]?.can_view;

                        return (
                            <div
                                key={item.id}
                                className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
                                    isActive
                                        ? "border-green-200 bg-white shadow-lg shadow-green-100/40"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                            >
                                {/* HEADER MENU CARD */}
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
                                                isActive
                                                    ? "bg-gradient-to-br from-green-500 to-green-700 text-white shadow-md"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            <i
                                                className={`fa ${item.icon || "fa-folder"} text-lg`}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-gray-800">
                                                    {item.label}
                                                </h3>
                                                {isDashboard ? (
                                                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                                                        DEFAULT
                                                    </span>
                                                ) : (
                                                    isActive && (
                                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                                            ACTIVE
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                                                {item.deskripsi}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        {isDashboard ? (
                                            <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                                <i className="fa fa-lock text-[10px]"></i>{" "}
                                                Default Access
                                            </div>
                                        ) : (
                                            <Switch
                                                checked={isActive}
                                                onChange={(value) => {
                                                    setData("activeMenu", {
                                                        ...data.activeMenu,
                                                        [item.id]: {
                                                            can_view: value,
                                                            can_create: value,
                                                            can_update: value,
                                                            can_delete: value,
                                                        },
                                                    });
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* PERMISSION CRUD PANEL */}
                                <div
                                    className={`grid transition-all duration-300 ${isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Aktivasi Aksi Wewenang
                                                </p>
                                            </div>

                                            {isDashboard ? (
                                                <div className="rounded-xl border border-green-100 bg-white p-3 flex items-center gap-3 text-green-700">
                                                    <i className="fa fa-eye"></i>
                                                    <span className="text-xs font-medium">
                                                        Dashboard dikonfigurasi
                                                        otomatis sebagai
                                                        Read-Only (Hanya Lihat).
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                                                                className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between shadow-sm"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={`text-xs text-${colorMap[action]}-500`}
                                                                    >
                                                                        <i
                                                                            className={`fa fa-${iconMap[action]}`}
                                                                        ></i>
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-700">
                                                                        {
                                                                            labelMap[
                                                                                action
                                                                            ]
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <Switch
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
                                                                />
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
