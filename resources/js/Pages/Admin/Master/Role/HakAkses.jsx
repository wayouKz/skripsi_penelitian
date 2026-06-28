import ActionDropdown from "@/Components/ActionDropdown";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import Switch from "@/Components/Switch";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Add from "./Modals/Add";
import { useAlert } from "@/Components/AlertContext";

export default function HakAkeses() {
    const [Result, setResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const { showAlert, showQuestion } = useAlert();
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
            header: "Nama Role",
            accessor: "nama_roles",
        },
        {
            header: "Status",
            accessor: "status",
            render: (row) => (
                <Switch
                    checked={row.status == "active" ? true : false}
                    onChange={() => handleStatus(row)}
                />
            ),
        },

        {
            header: "#",
            accessor: "id", // boleh apa saja, asal ada di row
            render: (row) => (
                <ActionDropdown
                    actions={[
                        {
                            edit: true,
                            label: "Edit",
                            icon: "edit",
                            onClick: () => handleEdit(row),
                        },
                        {
                            label: "Hapus",
                            icon: "trash",
                            danger: true,
                            onClick: () => handleDelete(row.id),
                        },
                    ]}
                />
            ),
        },
    ];

    const handleDelete = (id) => {
        if (id == 1) {
            showAlert("Data default tidak dapat dihapus", "error");
            return;
        }
        showQuestion(
            "Anda yakin ingin menghapus data ini ?",
            () => {
                axios
                    .post(route("manajemen.kelola-hak-akses.destroy", { id }))
                    .then(() => {
                        getRoles();
                        showAlert("Data berhasil dihapus", "success");
                    });
            },
            () => {},
            "Hapus",
            "Batal",
        );
    };
    const handleStatus = (row) => {
        axios
            .post(route("manajemen.kelola-hak-akses.update-status"), {
                id: row.id,
                status: row.status == "active" ? "nonactive" : "active",
            })
            .then((res) => {
                if (res.data.success == true) {
                    getRoles();
                    showAlert("Data berhasil diubah", "success");
                } else if (res.data.success == false) {
                    showAlert("Data gagal diubah", "error");
                }
            });
    };
    const getRoles = async () => {
        setLoading(true);
        await axios
            .get(route("manajemen.kelola-hak-akses.getHakAkses"))
            .then((res) => {
                if (res.data.status == false) {
                    seResult([]);
                } else {
                    setResult(res.data.data);
                    setLoading(false);
                }
            });
    };

    const handleTambah = () => {
        setShow(true);
        setIsEdit(false);
    };
    const handleEdit = (row) => {
        setSelectedRole(row);
        setShow(true);
        setIsEdit(true);
    };
    useEffect(() => {
        getRoles();
    }, []);
    return (
        <AuthenticatedLayout header={"Hak Akses"}>
            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-end">
                    <PrimaryButton
                        className="mb-2"
                        onClick={() => {
                            handleTambah();
                        }}
                    >
                        + Tambah Hak Akses
                    </PrimaryButton>
                </div>
                <DataTable
                    title="PERAN"
                    columns={columns}
                    data={Result}
                    searchable={true}
                    loading={loading}
                />
            </div>
            <Add
                open={show}
                setOpen={setShow}
                role={selectedRole}
                isEdit={isEdit}
                getRoles={getRoles}
            />
        </AuthenticatedLayout>
    );
}
