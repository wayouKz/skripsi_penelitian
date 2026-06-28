import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import Add from "./Add";
import ActionDropdown from "@/Components/ActionDropdown";
import { useAlert } from "@/Components/AlertContext";

export default function MataPelajaran() {
    const { showAlert, showQuestion } = useAlert();

    const [loading, setLoading] = useState(false);
    const [mapel, setMapel] = useState([]);
    const [show, setShow] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedMapel, setSelectedMapel] = useState(null);
    const getMapel = async () => {
        setLoading(true);
        const res = await axios.get(route("master.mapel.getMapel"));
        if (res.data.status == false) {
            setMapel([]);
        } else {
            setMapel(res.data.data);
        }
        setLoading(false);
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
            header: "Kode Mapel",
            accessor: "kode_mapel",
        },
        {
            header: "Mata Pelajaran",
            accessor: "nama_mapel",
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

    const handleTambah = () => {
        setShow(true);
        setIsEdit(false);
    };

    const handleEdit = (row) => {
        setSelectedMapel(row);
        setShow(true);
        setIsEdit(true);
    };

    const handleDelete = (id) => {
        showQuestion("Apakah Anda yakin ingin menghapus mapel ini?", () => {
            axios
                .post(route("master.mapel.destroy", { id: id }))
                .then((res) => {
                    if (res.data.success == true) {
                        showAlert(res.data.message, "success");
                        getMapel();
                    } else if (res.data.success == false) {
                        showAlert(res.data.message, "error");
                    }
                })
                .catch((err) => {
                    showAlert(
                        "Terjadi kesalahan saat menghapus data.",
                        "error",
                    );
                });
        });
    };
    useEffect(() => {
        getMapel();
    }, []);
    return (
        <AuthenticatedLayout header={"Mata Pelajaran"}>
            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-end">
                    <PrimaryButton
                        className="mb-2"
                        onClick={() => {
                            handleTambah();
                        }}
                    >
                        + Tambah Mata Pelajaran
                    </PrimaryButton>
                </div>
                <DataTable
                    columns={columns}
                    data={mapel}
                    title={"Mata Pelajaran"}
                    searchable={true}
                    loading={loading}
                />
            </div>
            <Add
                open={show}
                setOpen={setShow}
                isEdit={isEdit}
                Mapel={selectedMapel}
                getMapel={getMapel}
            />
        </AuthenticatedLayout>
    );
}
