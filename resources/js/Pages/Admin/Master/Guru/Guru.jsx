import ActionDropdown from "@/Components/ActionDropdown";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import Add from "./Add";
import Switch from "@/Components/Switch";
import { useAlert } from "@/Components/AlertContext";

export default function Guru() {
    const [Result, setResult] = useState([]);
    const [show, setShow] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { showAlert, showQuestion } = useAlert();
    const [selectedGuru, setSelectedGuru] = useState(null);
    const [loading, setLoading] = useState(false);
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
            header: "Nip",
            accessor: "nip",
        },
        {
            header: "Nama Guru",
            accessor: "nama_guru",
        },
        {
            header: "Jenis Kelamin",
            accessor: "jenis_kelamin",
        },
        {
            header: "Tempat Lahir",
            accessor: "tempat_lahir",
        },
        {
            header: "Tanggal Lahir",
            accessor: "tanggal_lahir",
        },
        {
            header: "Alamat",
            accessor: "alamat",
        },
        {
            header: "No Telpon",
            accessor: "no_telp",
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
            render: (row) => (
                <>
                    <ActionDropdown
                        actions={[
                            {
                                edit: true,
                                label: "Edit",
                                icon: "edit",
                                onClick: () => {
                                    setSelectedGuru(row);
                                    setShow(true);
                                    setIsEdit(true);
                                },
                            },
                            {
                                danger: true,
                                label: "Delete",
                                icon: "trash",
                                onClick: () => {
                                    handleDelete(row);
                                },
                            },
                        ]}
                    ></ActionDropdown>
                </>
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
                axios.post(route("master.guru.destroy", { id })).then((res) => {
                    if (res.data.success == true) {
                        showAlert(res.data.msg, "success");
                        getGuru();
                    } else if (res.data.success == false) {
                        showAlert(res.data.msg, "error");
                    }
                });
            },
            () => {},
            "Hapus",
            "Batal",
        );
    };
    const handleStatus = (row) => {
        axios
            .post(route("master.guru.update-status"), {
                nip: row.nip,
                status: row.status == "active" ? "nonactive" : "active",
            })
            .then((res) => {
                if (res.data.success == true) {
                    getGuru();
                    showAlert("Data berhasil diubah", "success");
                } else if (res.data.success == false) {
                    showAlert("Data gagal diubah", "error");
                }
            });
    };
    const getGuru = async () => {
        setLoading(true);
        await axios.get(route("master.guru.getGuru")).then((res) => {
            if (res.data.status == false) {
                setResult([]);
            } else {
                setLoading(false);
                setResult(res.data.data);
            }
        });
    };

    const handleTambah = () => {
        setShow(true);
        setIsEdit(false);
    };

    useEffect(() => {
        getGuru();
    }, []);
    return (
        <AuthenticatedLayout header={"Kelola Guru"}>
            <div className="flex justify-end">
                <PrimaryButton
                    className="mb-2"
                    onClick={() => {
                        handleTambah();
                    }}
                >
                    + Tambah Guru
                </PrimaryButton>
            </div>
            <DataTable
                columns={columns}
                data={Result}
                loading={loading}
                header={"Kelola Guru"}
            />
            <Add
                open={show}
                setOpen={setShow}
                isEdit={isEdit}
                Guru={selectedGuru}
                getGuru={getGuru}
            />
        </AuthenticatedLayout>
    );
}
