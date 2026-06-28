import ActionDropdown from "@/Components/ActionDropdown";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import Add from "./Add";
import Switch from "@/Components/Switch";
import { useAlert } from "@/Components/AlertContext";
import Menu from "@/Components/Menu";
import Select from "react-select";
import EditWaliKelas from "./EditWaliKelas";
import MappingGuruMapel from "./MappingGuruMapel";
export default function Guru() {
    const [Result, setResult] = useState([]);
    const [ResultWaliKelas, setResultWaliKelas] = useState([]);
    const [ResultGuruMapel, setResultGuruMapel] = useState([]);
    const [showEditWali, setShowEditWali] = useState(false);
    const [IseditWali, setIsEditWali] = useState(null);
    const [show, setShow] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { showAlert, showQuestion } = useAlert();
    const [menu, setMenu] = useState("master_guru");
    const [selectedKelas, setSelectedKelas] = useState(null);
    const [opsiKelas, setOpsiKelas] = useState([]);
    const [showMappingGuruMapel, setShowMappingGuruMapel] = useState(false);
    const menus = [
        {
            value: "master_guru",
            nama_menu: "Master Guru",
        },
        {
            value: "wali_kelas",
            nama_menu: "Daftar Wali Kelas",
        },
        {
            value: "guru_mapel",
            nama_menu: "Daftar Guru Mata Pelajaran",
        },
    ];
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

    const columnsWaliKelas = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Kelas",
            // Menggunakan fungsi render untuk masuk ke dalam nested object kelas
            render: (row) => (
                <span>{row.nama_kelas + " " + (row.nama_jurusan || "")}</span>
            ),
        },
        {
            header: "Nip",
            render: (row) => (
                <span className="">
                    {row.wali_kelas ? (
                        row.wali_kelas.nip
                    ) : (
                        <span className="text-gray-400 italic">
                            Belum diatur
                        </span>
                    )}
                </span>
            ),
        },
        {
            header: "Nama Guru",
            render: (row) => (
                <span className="">
                    {row.wali_kelas ? (
                        row.wali_kelas.nama_guru
                    ) : (
                        <span className="text-gray-400 italic">
                            Belum diatur
                        </span>
                    )}
                </span>
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
                                    setShowEditWali(true);
                                    setIsEditWali(row);
                                },
                            },
                        ]}
                    ></ActionDropdown>
                </>
            ),
        },
    ];

    const columnsGuruMapel = [
        {
            header: "Kode ",
            render: (row) => <span className="p-5">{row.kode_mapel}</span>,
        },
        {
            header: "Mata Pelajaran",
            render: (row) => (
                <span className="p-5">
                    <i className="fa fa-book text-green-400 text-xs me-2"></i>
                    {row.mapel}
                </span>
            ),
        },
        {
            header: "Nama Guru Dan Beban Jam",
            render: (row) => (
                <div className="flex flex-wrap gap-2">
                    {row.guru.map((g) => (
                        <div
                            key={g.value}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-50 border border-green-100 text-green-700 text-sm transition-colors hover:bg-green-100"
                        >
                            <i className="fa fa-user text-green-400 text-xs"></i>
                            <span className="font-medium">{g.label}</span>

                            {/* Opsional: Jika Anda ingin menampilkan beban jam sekalian */}
                            {g.beban_jam > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-white text-green-600 border border-green-100 shadow-sm">
                                    <i className="fa fa-clock"></i>{" "}
                                    {g.beban_jam} Jam
                                </span>
                            )}
                        </div>
                    ))}

                    {/* Jika belum ada guru yang di-mapping */}
                    {(!row.guru || row.guru.length === 0) && (
                        <span className="text-xs text-red-400 italic">
                            Belum ada guru yang di tetapkan
                        </span>
                    )}
                </div>
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

    const getWaliKelas = async (kelas_id) => {
        setLoading(true);
        setSelectedKelas(kelas_id);
        if (kelas_id?.value != null) {
            await axios
                .get(
                    route("master.guru.getWaliKelas", {
                        kelas_id: kelas_id.value,
                    }),
                )
                .then((res) => {
                    if (res.data.status == false) {
                        setResultWaliKelas([]);
                    } else {
                        setLoading(false);
                        setResultWaliKelas(res.data.data);
                    }
                });
            return;
        } else if (kelas_id == null) {
            await axios.get(route("master.guru.getWaliKelas")).then((res) => {
                if (res.data.status == false) {
                    setResultWaliKelas([]);
                } else {
                    setLoading(false);
                    setResultWaliKelas(res.data.data);
                }
            });
        }
    };
    const getKelas = async () => {
        setLoading(true);
        await axios.get(route("getData.get-kelas")).then((res) => {
            if (res.data.status == false) {
                setOpsiKelas([]);
            } else {
                setLoading(false);
                setOpsiKelas(res.data.data);
            }
        });
    };

    const getGuruMapel = async () => {
        setLoading(true);
        await axios.get(route("master.guru.getGuruMapel")).then((res) => {
            if (res.data.status == false) {
                setResultGuruMapel([]);
            } else {
                setLoading(false);
                setResultGuruMapel(res.data.data);
            }
        });
        setLoading(false);
    };
    const handleMappingGuruMapel = () => {
        setShowMappingGuruMapel(true);
    };
    useEffect(() => {
        if (menu == "master_guru") {
            getGuru();
        } else if (menu == "wali_kelas") {
            getKelas();
            getWaliKelas(null);
        } else if (menu == "guru_mapel") {
            getGuruMapel();
        }
    }, [menu]);

    return (
        <AuthenticatedLayout header={"Kelola Guru"}>
            <div className="flex flex-col md:flex-row bg-gray-50 items-start gap-4 p-4 md:p-0">
                <Menu menu={menu} setMenu={setMenu} menus={menus} />
                <div className="flex-1 min-w-0 md:p-6 w-full mt-4 md:mt-0">
                    {menu === "master_guru" && (
                        <>
                            <div className="bg-white shadow sm:rounded-lg p-6">
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
                                    title="GURU"
                                />
                            </div>
                            <Add
                                open={show}
                                setOpen={setShow}
                                isEdit={isEdit}
                                Guru={selectedGuru}
                                getGuru={getGuru}
                            />
                        </>
                    )}

                    {menu === "wali_kelas" && (
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            {/* Wadah Filter: Diberi margin bottom (mb-6) agar ada jarak dengan tabel di bawahnya */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                {/* Label Filter dengan Icon */}
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 shrink-0">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-green-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                        />
                                    </svg>
                                    Filter Kelas :
                                </label>

                                {/* Dropdown Select2 */}
                                <div className="w-full sm:w-72">
                                    {" "}
                                    {/* Lebar diatur agar pas (tidak terlalu panjang/pendek) */}
                                    <Select
                                        options={opsiKelas}
                                        value={selectedKelas}
                                        onChange={(pilihan) =>
                                            getWaliKelas(pilihan)
                                        }
                                        placeholder="Cari atau pilih kelas..."
                                        isSearchable={true}
                                        isClearable={true}
                                        styles={{
                                            // 1. Gaya Kotak Utama
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                backgroundColor: "white",
                                                borderRadius: "0.5rem", // rounded-lg
                                                padding: "2px", // Sedikit padding ekstra agar lega
                                                borderColor: state.isFocused
                                                    ? "#818cf8"
                                                    : "#e5e7eb", // border-green-400 / border-gray-200
                                                boxShadow: state.isFocused
                                                    ? "0 0 0 3px rgba(165, 180, 252, 0.4)" // ring-green-300
                                                    : "none",
                                                "&:hover": {
                                                    borderColor: state.isFocused
                                                        ? "#818cf8"
                                                        : "#d1d5db",
                                                },
                                            }),
                                            // 2. Gaya Kotak Dropdown (List Menu)
                                            menu: (baseStyles) => ({
                                                ...baseStyles,
                                                borderRadius: "0.5rem",
                                                boxShadow:
                                                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", // shadow-lg
                                                border: "1px solid #f3f4f6", // border-gray-100
                                                overflow: "hidden",
                                            }),
                                            // 3. Gaya Tiap Item Pilihan
                                            option: (baseStyles, state) => ({
                                                ...baseStyles,
                                                backgroundColor:
                                                    state.isSelected
                                                        ? "#6366f1" // bg-green-500 (Jika dipilih)
                                                        : state.isFocused
                                                          ? "#e0e7ff" // bg-green-50 (Saat di-hover)
                                                          : "white",
                                                color: state.isSelected
                                                    ? "white"
                                                    : state.isFocused
                                                      ? "#4338ca" // text-green-700
                                                      : "#4b5563", // text-gray-600
                                                cursor: "pointer",
                                                padding: "10px 14px",
                                                fontSize: "0.875rem", // text-sm
                                                "&:active": {
                                                    backgroundColor: "#c7d2fe", // bg-green-200 saat diklik
                                                },
                                            }),
                                            // 4. Gaya Teks yang Terpilih & Placeholder
                                            singleValue: (baseStyles) => ({
                                                ...baseStyles,
                                                color: "#374151", // text-gray-700
                                                fontWeight: "500",
                                            }),
                                            placeholder: (baseStyles) => ({
                                                ...baseStyles,
                                                color: "#9ca3af", // text-gray-400
                                                fontSize: "0.875rem", // text-sm
                                            }),
                                        }}
                                    />
                                </div>
                            </div>
                            <DataTable
                                columns={columnsWaliKelas}
                                data={ResultWaliKelas}
                                loading={loading}
                                header={"Wali Kelas"}
                                title="Wali Kelas"
                            />
                            <EditWaliKelas
                                open={showEditWali}
                                setOpen={setShowEditWali}
                                getKelas={getWaliKelas}
                                Kelas={IseditWali}
                            />
                        </div>
                    )}

                    {menu === "guru_mapel" && (
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <div className="flex justify-end">
                                <PrimaryButton
                                    className="mb-2"
                                    onClick={() => {
                                        handleMappingGuruMapel();
                                    }}
                                >
                                    <i className="fa fa-plus mr-2"></i> Kelola
                                    Guru Mata Pelajaran
                                </PrimaryButton>
                            </div>
                            <DataTable
                                columns={columnsGuruMapel}
                                data={ResultGuruMapel}
                                loading={loading}
                                header={" Mata Pelajaran"}
                                title=" Mata Pelajaran"
                            />
                        </div>
                    )}
                    <MappingGuruMapel
                        open={showMappingGuruMapel}
                        setOpen={setShowMappingGuruMapel}
                        getGuruMapel={getGuruMapel}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
