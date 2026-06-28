import { useAlert } from "@/Components/AlertContext";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import Add from "./tab/kelas/modal/Add";
import Switch from "@/Components/Switch";
import ActionDropdown from "@/Components/ActionDropdown";
import { Link, router } from "@inertiajs/react";
import Menu from "@/Components/Menu";
import MasterKelas from "./tab/kelas/MasterKelas";
import MasterJurusan from "./tab/jurusan/MasterJurusan";

export default function Kelas() {
    const { showAlert, showQuestion } = useAlert();
    const [loading, setLoading] = useState(false);
    const [Result, setResult] = useState([]);
    const [show, setShow] = useState(false);
    const [Kelas, setKelas] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [menu, setMenu] = useState("master_kelas");
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
            header: "Nama Kelas",
            accessor: "nama_kelas",
        },
        {
            header: "Jurusan",
            render(row) {
                return (
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                        {row.nama_jurusan || "-"}
                    </span>
                );
            },
        },
        {
            header: "Tingkat",
            accessor: "tingkat",
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
                        {
                            label: "Mapping Siswa",
                            icon: "user-tie",
                            onClick: () => handleLink(row.nama_kelas),
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
        showQuestion("Apakah Anda yakin ingin menghapus kelas ini?", () => {
            axios
                .post(route("master.kelas.destroy", { id: id }))
                .then((res) => {
                    if (res.data.success == true) {
                        showAlert(res.data.message, "success");
                        getKelas();
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
    const getKelas = async () => {
        setLoading(true);
        await axios.get(route("master.kelas.getKelas")).then((res) => {
            if (res.data.success == false) {
                setResult([]);
                setLoading(false);
            } else if (res.data.success == true) {
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
        getKelas();
    }, []);

    const handleTambah = () => {
        setShow(true);
        setIsEdit(false);
    };
    const handleEdit = (row) => {
        setShow(true);
        setIsEdit(true);
        setKelas(row);
    };

    const handleLink = (row) => {
        router.visit("kelas/mapping-kelas/" + row);
    };

    const menus = [
        {
            value: "master_kelas",
            nama_menu: "Master Kelas",
        },
        {
            value: "master_jurusan",
            nama_menu: "Master Jurusan",
        },
    ];

    return (
        <AuthenticatedLayout header="Daftar Kelas">
            <div className="flex flex-col md:flex-row bg-gray-50 items-start gap-4 p-4 md:p-0">
                <Menu menu={menu} setMenu={setMenu} menus={menus} />
                <div className="flex-1 min-w-0 md:p-6 w-full mt-4 md:mt-0">
                    {menu == "master_jurusan" && <MasterJurusan />}
                    {menu == "master_kelas" && (
                        <MasterKelas
                            handleTambah={handleTambah}
                            Result={Result}
                            columns={columns}
                            loading={loading}
                            show={show}
                            setShow={setShow}
                            isEdit={isEdit}
                            Kelas={Kelas}
                            getKelas={getKelas}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
