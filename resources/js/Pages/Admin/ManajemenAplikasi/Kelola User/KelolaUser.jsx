import ActionDropdown from "@/Components/ActionDropdown";
import { useAlert } from "@/Components/AlertContext";
import DataTable from "@/Components/Datatables";
import Switch from "@/Components/Switch";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import Add from "./Modal/Add";
import PrimaryButton from "@/Components/PrimaryButton";

export default function KelolaUser() {
    const [data, setData] = useState([]);
    const { showAlert, showQuestion } = useAlert();
    const [open, setOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [onSubmit, setOnSubmit] = useState("");
    const [loading, setLoading] = useState(false);
    const getData = async () => {
        setLoading(true);
        await axios.get(route("manajemen.kelola-user.getUser")).then((res) => {
            if (res.data.status == false) {
                setData([]);
            } else {
                setData(res.data.data);
            }
        });
        setLoading(false);
    };
    const handleStatus = (row) => {
        if (row.id == 1) {
            showAlert("Data default tidak dapat diubah", "error");
            return;
        }
        axios
            .post(route("manajemen.kelola-user.update-status"), {
                id: row.id,
                status: row.status == "active" ? "nonactive" : "active",
            })
            .then((res) => {
                if (res.data.success == true) {
                    getData();
                    showAlert("Data berhasil diubah", "success");
                } else if (res.data.success == false) {
                    showAlert("Data gagal diubah", "error");
                }
            });
    };
    useEffect(() => {
        getData();
    }, []);

    const handleEdit = (row) => {
        setOpen(true);
        setSelectedData(row);
        setOnSubmit(route("manajemen.kelola-user.update"));
    };

    const handleReset = (row) => {
        showQuestion(
            `Anda yakin ingin mereset password ${row.name}?
            Password akan diatur ulang ke default `,
            () => {
                axios
                    .post(route("manajemen.kelola-user.reset-password"), {
                        nip: row.nip,
                    })
                    .then((res) => {
                        if (res.data.success == true) {
                            showAlert(res.data.msg, "success");
                            getData();
                        } else if (res.data.success == false) {
                            showAlert(res.data.msg, "error");
                        }
                    });
            },
            () => {},
            "Reset",
            "Batal",
        );
    };

    const handleDelete = (row) => {
        if (row == 1) {
            showAlert("Data default tidak dapat dihapus", "error");
            return;
        }
        showQuestion(
            "Anda yakin ingin menghapus data ini ?",
            () => {
                axios
                    .post(route("manajemen.kelola-user.destroy", { id: row }))
                    .then(() => {
                        getData();
                        showAlert("Data berhasil dihapus", "success");
                    });
            },
            () => {},
            "Hapus",
            "Batal",
        );
    };
    const columns = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Nama User",
            accessor: "name",
        },
        {
            header: "Username",
            accessor: "username",
        },
        {
            header: "Peran",
            render: (row) => row.role?.nama_roles ?? "-",
        },
        {
            header: "Status",
            render: (row) => (
                <Switch
                    checked={row.status == "active" ? true : false}
                    onChange={() => handleStatus(row)}
                />
            ),
        },
        {
            header: "#",
            render(row) {
                return (
                    <ActionDropdown
                        actions={[
                            {
                                label: "Edit",
                                icon: "edit",
                                permission: "edit",
                                edit: true,
                                onClick: () => handleEdit(row),
                            },
                            {
                                label: "Reset Password",
                                icon: "key",
                                edit: true,
                                onClick: () => handleReset(row),
                            },
                            {
                                label: "Hapus",
                                icon: "trash",
                                danger: true,
                                onClick: () => handleDelete(row.id),
                            },
                        ]}
                    />
                );
            },
        },
    ];
    return (
        <AuthenticatedLayout header={"Kelola User"}>
            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-end mb-4">
                    <PrimaryButton onClick={() => setOpen(true)}>
                        + Tambah User
                    </PrimaryButton>
                </div>
                <DataTable
                    loading={loading}
                    columns={columns}
                    data={data || []}
                    title={"USER"}
                />
            </div>
            <Add
                open={open}
                setOpen={setOpen}
                selectedData={selectedData}
                onSubmit={onSubmit}
                getData={getData}
            />
        </AuthenticatedLayout>
    );
}
