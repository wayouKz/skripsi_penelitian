import ActionDropdown from "@/Components/ActionDropdown";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import { useEffect, useState } from "react";
import Add from "./modal/Add";
import { useAlert } from "@/Components/AlertContext";

export default function MasterJurusan() {
    const [open, setOpen] = useState(false);
    const [Jurusan, setJurusan] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const { showAlert, showQuestion } = useAlert();
    const handleTambah = () => {
        setIsEdit(false);
        setOpen(true);
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
            header: "Jurusan",
            accessor: "nama_jurusan",
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
    const [Result, setResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleDelete = (id) => {
        showQuestion("Apakah Anda yakin ingin menghapus jurusan ini?", () => {
            axios
                .post(route("master.jurusan.destroy", { id: id }))
                .then((res) => {
                    if (res.data.success == true) {
                        showAlert(res.data.message, "success");
                        getJurusan();
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
    const handleEdit = (row) => {
        setOpen(true);
        setJurusan(row);
        setIsEdit(true);
    };
    const getJurusan = async () => {
        try {
            setLoading(true);
            const res = await axios.get(route("master.jurusan.getJurusan"));
            setResult(res.data.status === "success" ? res.data.data : []);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            return [];
        }
    };

    useEffect(() => {
        getJurusan();
    }, []);
    return (
        <div className="bg-white shadow sm:rounded-lg p-6">
            <div className="flex justify-end">
                <PrimaryButton
                    className="mb-2"
                    onClick={() => {
                        handleTambah();
                    }}
                >
                    + Tambah Jurusan
                </PrimaryButton>
            </div>
            <DataTable
                columns={columns}
                data={Result}
                title={"Jurusan"}
                searchable={true}
                loading={loading}
            />
            <Add
                open={open}
                setOpen={setOpen}
                Jurusan={Jurusan}
                getJurusan={getJurusan}
                isEdit={isEdit}
            />
        </div>
    );
}
