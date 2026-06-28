import { useAlert } from "@/Components/AlertContext";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router } from "@inertiajs/react";
import { useMemo, useState } from "react";

export default function KelolaFiturAplikasi({ list_fiture, roles }) {
    const [selectedMenu, setSelectedMenu] = useState(list_fiture[0]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({});
    const [showIconPicker, setShowIconPicker] = useState(false);

    const menus = list_fiture ?? [];
    const { showAlert } = useAlert();
    /* ================= ICON LIST ================= */
    const iconList = [
        "fa-solid fa-house",
        "fa-solid fa-dashboard",
        "fa-solid fa-users",
        "fa-solid fa-gear",
        "fa-solid fa-book",
        "fa-solid fa-chart-line",
        "fa-solid fa-layer-group",
        "fa-solid fa-folder",
        "fa-solid fa-database",
        "fa-solid fa-graduation-cap",
        "fa-solid fa-building",
        "fa-solid fa-shield-halved",
        "fa-solid fa-file",
    ];

    /* ================= FILTER ================= */
    const filteredMenus = useMemo(() => {
        return menus.filter((menu) => {
            const matchSearch = menu.label
                ?.toLowerCase()
                .includes(search.toLowerCase());

            const matchRole = roleFilter
                ? menu.roles?.some((r) => r.id == roleFilter)
                : true;

            return matchSearch && matchRole;
        });
    }, [menus, search, roleFilter]);

    const startEdit = () => {
        setEditMode(true);

        const uniqueRoleIds = [
            ...new Set(selectedMenu.roles?.map((r) => String(r.id)) || []),
        ];

        setForm({
            ...selectedMenu,
            roles_id: uniqueRoleIds,
        });
    };

    const cancelEdit = () => {
        setEditMode(false);
        setForm({});
    };

    const saveEdit = () => {
        axios
            .post(
                route("manajemen-aplikasi.kelola-fitur-aplikasi.update"),
                form,
            )
            .then((res) => {
                if (res.data.success == false) {
                    showAlert(res.data.message, "error");
                    return;
                } else if (res.data.success == true) {
                    if (res.data.message) {
                        showAlert(res.data.message, "success");
                        router.reload();
                        return;
                    }
                }
            });
        setSelectedMenu(form);
        setEditMode(false);
    };

    return (
        <AuthenticatedLayout>
            {/* HEADER */}
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Cari menu..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border px-3 py-2 rounded-lg text-sm"
                    >
                        <option value="">Semua Role</option>
                        {roles?.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.nama_roles}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL */}
                <div className="w-1/3 bg-white border-r overflow-y-auto">
                    {filteredMenus.map((menu) => (
                        <div
                            key={menu.id}
                            onClick={() => {
                                setSelectedMenu(menu);
                                setEditMode(false);
                            }}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                                selectedMenu?.id === menu.id
                                    ? "bg-emerald-50"
                                    : ""
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <i className={`${menu.icon} text-gray-600`} />
                                <p className="font-medium">{menu.label}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                                {menu.deskripsi}
                            </p>
                        </div>
                    ))}
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {selectedMenu ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            {/* HEADER DETAIL */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <i
                                        className={`${
                                            editMode
                                                ? form.icon
                                                : selectedMenu.icon
                                        } text-xl`}
                                    />

                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={form.label}
                                            readOnly
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    label: e.target.value,
                                                })
                                            }
                                            className="border px-3 py-2 rounded-lg"
                                        />
                                    ) : (
                                        <h2 className="text-xl font-semibold">
                                            {selectedMenu.label}
                                        </h2>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {!editMode ? (
                                        <button
                                            onClick={startEdit}
                                            className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
                                        >
                                            <i className="fa-solid fa-pen"></i>
                                            Edit
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={cancelEdit}
                                                className="border px-3 py-2 rounded-lg text-sm"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={saveEdit}
                                                className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm"
                                            >
                                                Simpan
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div className="mt-6 space-y-6">
                                {/* DESKRIPSI */}
                                <div>
                                    <p className="text-xs text-gray-400">
                                        Deskripsi
                                    </p>
                                    {editMode ? (
                                        <textarea
                                            value={form.deskripsi}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    deskripsi: e.target.value,
                                                })
                                            }
                                            className="border px-3 py-2 rounded-lg w-full"
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-600">
                                            {selectedMenu.deskripsi}
                                        </p>
                                    )}
                                </div>

                                {/* ICON PICKER */}
                                {editMode && (
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Icon
                                        </p>

                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="w-10 h-10 flex items-center justify-center border rounded-lg bg-gray-50">
                                                <i
                                                    className={`${form.icon} text-lg`}
                                                />
                                            </div>

                                            <button
                                                onClick={() =>
                                                    setShowIconPicker(true)
                                                }
                                                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-100"
                                            >
                                                Pilih Icon
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ROLES */}
                                <div>
                                    <p className="text-xs text-gray-400">
                                        Roles
                                    </p>

                                    {editMode ? (
                                        <div className="flex flex-wrap gap-3 mt-2">
                                            {roles?.map((role) => {
                                                const checked =
                                                    form.roles_id?.includes(
                                                        String(role.id),
                                                    );

                                                return (
                                                    <label
                                                        key={role.id}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => {
                                                                let updated = [
                                                                    ...(form.roles_id ||
                                                                        []),
                                                                ];
                                                                const id =
                                                                    String(
                                                                        role.id,
                                                                    );

                                                                if (
                                                                    updated.includes(
                                                                        id,
                                                                    )
                                                                ) {
                                                                    updated =
                                                                        updated.filter(
                                                                            (
                                                                                item,
                                                                            ) =>
                                                                                item !==
                                                                                id,
                                                                        );
                                                                } else {
                                                                    updated.push(
                                                                        id,
                                                                    );
                                                                }

                                                                setForm({
                                                                    ...form,
                                                                    roles_id:
                                                                        updated,
                                                                });
                                                            }}
                                                        />
                                                        {role.nama_roles}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {selectedMenu.roles?.map(
                                                (role, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-sm px-3 py-1 bg-gray-100 rounded-full"
                                                    >
                                                        {role.nama_roles}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 text-center mt-20">
                            Pilih menu untuk melihat detail
                        </div>
                    )}
                </div>
            </div>

            {/* ICON GRID MODAL */}
            {showIconPicker && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-[600px] max-h-[500px] rounded-xl shadow-xl p-6 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">
                                Pilih Icon
                            </h3>
                            <button onClick={() => setShowIconPicker(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-6 gap-4 overflow-y-auto">
                            {iconList.map((icon, index) => {
                                const isSelected = form.icon === icon;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setForm({
                                                ...form,
                                                icon,
                                            });
                                            setShowIconPicker(false);
                                        }}
                                        className={`cursor-pointer p-4 rounded-lg border flex items-center justify-center transition
                                            ${
                                                isSelected
                                                    ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                                                    : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <i className={`${icon} text-xl`} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
