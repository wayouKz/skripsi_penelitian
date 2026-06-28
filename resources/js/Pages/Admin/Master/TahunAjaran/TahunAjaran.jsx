import { useAlert } from "@/Components/AlertContext";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import Add from "./Add";
import Switch from "@/Components/Switch";
import ActionDropdown from "@/Components/ActionDropdown";

export default function TahunAjaran() {
    const { showAlert, showCenterAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [Result, setResult] = useState([]);
    const [show, setShow] = useState(false);
    const [TA, setTA] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
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
            header: "Tahun Ajaran",
            accessor: "tahun_ajaran",
        },
        {
            header: "Semester",
            render: (row) => {
                if (row.semester == "ganjil") {
                    return "Ganjil";
                } else {
                    return "Genap";
                }
            },
        },
        {
            header: "Aktif",
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
                    ]}
                />
            ),
        },
    ];

    const cekSiswa = async () => {
        const response = await axios.get(route("getData.cek-siswa"));
        if (response.data.success == false) {
            showCenterAlert(response.data.message, "warning", 3000);
        } else {
            handleTambah();
        }
    };
    const getTahunAjaran = async () => {
        setLoading(true);
        await axios
            .get(route("master.tahun-ajaran.getTahunAjaran"))
            .then((res) => {
                if (res.data.status == false) {
                    seResult([]);
                } else {
                    setResult(res.data.data);
                    setLoading(false);
                }
            });
    };
    const handleStatus = () => {
        showAlert(
            "Data Akan Secara Otomatis Di Nonaktifkan Jika Ada Tahun Ajaran Yang Baru Di Tambahkan",
            "warning",
        );
    };
    useEffect(() => {
        getTahunAjaran();
    }, []);

    const handleTambah = () => {
        setShow(true);
        setIsEdit(false);
    };

    const handleEdit = (row) => {
        setShow(true);
        setIsEdit(true);
        setTA(row);
    };
    return (
        <AuthenticatedLayout header="Tahun Ajaran">
            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-end">
                    <PrimaryButton
                        className="mb-2"
                        onClick={() => {
                            cekSiswa();
                        }}
                    >
                        + Tambah Tahun Ajaran
                    </PrimaryButton>
                </div>
                <DataTable
                    columns={columns}
                    data={Result}
                    title={"TAHUN AJARAN"}
                    searchable={true}
                    loading={loading}
                />
            </div>
            <Add
                isEdit={isEdit}
                open={show}
                setOpen={setShow}
                getTahunAjaran={getTahunAjaran}
                TahunAjaran={TA}
            />
        </AuthenticatedLayout>
    );
}
