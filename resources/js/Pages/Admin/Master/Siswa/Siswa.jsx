import ActionDropdown from "@/Components/ActionDropdown";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAlert } from "@/Components/AlertContext";
import MasterSiswa from "./main/MasterSiswa";
import Menu from "@/Components/Menu";
import PrimaryButton from "@/Components/PrimaryButton";
import DataTable from "@/Components/Datatables";
import SiswaKelas from "./SiswaKelas";

export default function Siswa() {
    const [show, setShow] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { showAlert, showQuestion } = useAlert();
    const [selectedSiswa, setSelectedSiswa] = useState([]);
    const [dataSiswa, setDataSiswa] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ResultSiswaPerKelas, setResultSiswaPerKelas] = useState([]);
    const [ShowMapping, setShowMapping] = useState(false);
    // State untuk mengontrol tab/menu yang aktif
    const [menu, setMenu] = useState("master_siswa");
    const [dataTahunAjaran, setDataTahunAjaran] = useState([]);
    const [taAsal, setTaAsal] = useState("");
    const [kelasAsalId, setKelasAsalId] = useState("");
    const [kelasList, setKelasList] = useState([]);
    const [ResultSiswaAlumni, setResultSiswaAlumni] = useState([]);
    const [taAlumniAsal, setTaAlumniAsal] = useState("all");
    const columns = [
        // ... (Kolom tabel tetap sama seperti kode Anda sebelumnya)
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Foto",
            render: (row) => (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                    {row.foto != null ? (
                        <img
                            src={
                                row.foto
                                    ? `/storage/public/foto/${row.foto}`
                                    : "/default-avatar.png"
                            }
                            alt="Foto Siswa"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <i className="fas fa-user text-gray-400 text-xl"></i>
                    )}
                </div>
            ),
        },
        { header: "Nisn", accessor: "nisn" },
        { header: "Nama Siswa", accessor: "nama_siswa" },
        { header: "Jenis Kelamin", accessor: "jenis_kelamin" },
        { header: "Tempat Lahir", accessor: "tempat_lahir" },
        { header: "Tanggal Lahir", accessor: "tanggal_lahir" },
        {
            header: "#",
            accessor: "id",
            render: (row) => (
                <ActionDropdown
                    actions={[
                        {
                            label: "Edit",
                            icon: "edit",
                            edit: true,
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
    const columnsSiswaPerKelas = [
        // ... (Kolom tabel tetap sama seperti kode Anda sebelumnya)
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },

        { header: "Nisn", accessor: "value" },
        { header: "Nama Siswa", accessor: "label" },
        { header: "Kelas", accessor: "nama_kelas" },
        { header: "Tahun Ajaran", accessor: "tahun_ajaran" },
        { header: "Semester", accessor: "semester" },
    ];

    // Struktur jika berada di bawah satu kategori (misal: Kesiswaan)
    const menus = [
        {
            nama_menu: "Data Profil & Biodata",
            value: "master_siswa",
        },
        {
            nama_menu: "Rombongan Belajar (Rombel)",
            value: "siswa_aktif",
        },
        {
            nama_menu: "Arsip & Kelulusan Alumni",
            value: "siswa_alumni",
        },
    ];

    // ... (Fungsi handleDelete, handleEdit, getSiswa, handleTambah tetap sama)
    const handleDelete = (id) => {
        showQuestion("Apakah anda yakin ingin menghapus data ini?", () => {
            axios
                .post(route("master.siswa.destroy", { id: id }))
                .then((res) => {
                    if (res.data.success == true) {
                        showAlert(res.data.message, "success");
                        getSiswa();
                    } else if (res.data.success == false) {
                        showAlert(res.data.message, "error");
                    }
                });
        });
    };

    const handleEdit = (row) => {
        setSelectedSiswa(row);
        setShow(true);
        setIsEdit(true);
    };

    const getSiswa = () => {
        setLoading(true);
        axios.get(route("master.siswa.getSiswa")).then((res) => {
            setLoading(false);
            if (res.data.success == true) {
                setDataSiswa(res.data.data);
            } else if (res.data.success == false) {
                showAlert("Gagal mengambil data siswa", "error");
            }
        });
    };

    const handleTambah = () => {
        setShow(true);
        setIsEdit(false);
    };
    const handleMappingKelas = () => {
        setShowMapping(true);
    };

    useEffect(() => {
        if (menu == "master_siswa") {
            getSiswa();
        } else if (menu == "siswa_aktif") {
            loadData();
        } else if (menu == "siswa_alumni") {
            getDataAlumni(taAlumniAsal);
            getTa();
        }
    }, [menu]);

    const loadData = async () => {
        try {
            // 1. Jalankan ketiga fungsi GET secara bersamaan (Paralel)
            const [resTahunAjaran, resKelas, resKelasSiswa] = await Promise.all(
                [
                    axios.get(route("getData.get-tahun-ajaran")),
                    axios.get(route("getData.get-kelas")),
                    axios.get(
                        route("getData.get-kelas-siswa", {
                            tahun_ajaran: taAsal,
                        }),
                    ),
                ],
            );

            // 2. Set ke masing-masing state secara spesifik agar aman dari error .map()
            setDataTahunAjaran(resTahunAjaran.data.data || []);
            setKelasList(resKelas.data.data || []);
            // Jika kamu punya state untuk list relasi kelas siswa, masukkan ke sini:
            // setKelasSiswaList(resKelasSiswa.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data inisialisasi:", error);
            if (typeof showCenterAlert === "function") {
                showCenterAlert(
                    "Gagal memuat data awal dari server",
                    "error",
                    2000,
                );
            }
        }
    };

    const getTa = async () => {
        try {
            const res = await axios.get(route("getData.get-tahun-ajaran"));
            setDataTahunAjaran(res.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data tahun ajaran:", error);
        }
    };
    const getDataAlumni = async (e) => {
        try {
            const res = await axios.get(
                route("getData.get-siswa-alumni", {
                    tahun_ajaran: e,
                }),
            );
            const data = res.data.data;
            setResultSiswaAlumni(res.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data alumni:", error);
        }
    };
    const handleKelasChange = async (e) => {
        setKelasAsalId(e);
        const res = await axios.get(
            route("getData.siswa-in-kelas", {
                kelas_id: e,
                Ta: taAsal,
            }),
        );
        if (res.data.success == false) {
            setResultSiswaPerKelas([]);
        } else {
            setResultSiswaPerKelas(res.data.data || []);
        }
    };

    const columnsSiswaAlumni = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Nisn",
            accessor: "nisn",
        },
        {
            header: "Nama",
            accessor: "nama_siswa",
        },

        {
            header: "Tahun Ajaran",
            accessor: "tahun_ajaran",
        },
    ];
    return (
        <AuthenticatedLayout header={"Daftar Siswa"}>
            <div className="flex flex-col md:flex-row bg-gray-50 items-start gap-4 p-4 md:p-0">
                <Menu menu={menu} setMenu={setMenu} menus={menus} />

                {/* ===== Bagian Kanan (Main Content Berpindah) ===== */}
                <div className="flex-1 min-w-0 md:p-6 w-full mt-4 md:mt-0">
                    {/* TAMPILAN 1: Jika menu yang dipilih adalah 'master_siswa' */}
                    {menu === "master_siswa" && (
                        <>
                            <MasterSiswa
                                dataSiswa={dataSiswa}
                                columns={columns}
                                loading={loading}
                                show={show}
                                setShow={setShow}
                                isEdit={isEdit}
                                selectedSiswa={selectedSiswa}
                                handleTambah={handleTambah}
                            />
                        </>
                    )}

                    {menu === "siswa_aktif" && (
                        <SiswaKelas
                            columnsSiswaPerKelas={columnsSiswaPerKelas}
                            dataTahunAjaran={dataTahunAjaran}
                            loading={loading}
                            taAsal={taAsal}
                            setTaAsal={setTaAsal}
                            kelasAsalId={kelasAsalId}
                            setKelasAsalId={setKelasAsalId}
                            ShowMapping={ShowMapping}
                            setShowMapping={setShowMapping}
                            ResultSiswaPerKelas={ResultSiswaPerKelas}
                            kelasList={kelasList}
                            handleKelasChange={handleKelasChange}
                            handleMappingKelas={handleMappingKelas}
                        />
                    )}
                    {menu === "siswa_alumni" && (
                        <>
                            <div className="bg-white shadow sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    ARSIP & KELULUSAN ALUMNI
                                </h3>
                                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full">
                                    {/* Filter Tahun Ajaran */}
                                    <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[200px]">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Tahun Ajaran
                                        </label>
                                        <select
                                            className="w-full text-sm border border-gray-200 rounded-lg px-8 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            value={taAlumniAsal}
                                            onChange={(e) => {
                                                setTaAlumniAsal(e.target.value);
                                                getDataAlumni(e.target.value);
                                            }}
                                        >
                                            {console.log(dataTahunAjaran)}
                                            <option value="all">
                                                Semua Tahun Ajaran
                                            </option>
                                            {dataTahunAjaran?.map((ta) => (
                                                <option
                                                    key={ta.id || ta.value}
                                                    value={ta.id || ta.value}
                                                >
                                                    {ta.tahun_ajaran ||
                                                        ta.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <DataTable
                                    columns={columnsSiswaAlumni}
                                    data={ResultSiswaAlumni}
                                    loading={loading}
                                    header={"Data Siswa Alumni"}
                                    title="Siswa"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
