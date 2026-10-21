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
import Select from "react-select";

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
    const [taAsal, setTaAsal] = useState("");
    const [kelasAsalId, setKelasAsalId] = useState("");
    const [ResultSiswaAlumni, setResultSiswaAlumni] = useState([]);
    const [taAlumniAsal, setTaAlumniAsal] = useState("all");
    const [dataTahunAjaran, setDataTahunAjaran] = useState([]);

    const columns = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Foto",
            render: (row) => (
                <div className="w-8 h-8 rounded-full overflow-hidden">
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
                        <i className="fas fa-user text-gray-400 text-sm"></i>
                    )}
                </div>
            ),
        },
        {
            header: "Nisn",
            render: (row) => (
                <p
                    className={`inline-flex items-center p-1 justify-center bg-gradient-to-br ${row.nisn ? "text-gray-700" : "text-gray-200"} font-mono rounded-full text-xs `}
                >
                    {row.nisn || "Kosong"}
                </p>
            ),
        },
        {
            header: "Nama Siswa",
            accessor: "nama_siswa",
        },
        {
            header: "Jenis Kelamin",
            render: (row) =>
                row.jenis_kelamin && row.jenis_kelamin === "Laki-laki" ? (
                    <span className="inline-flex items-center p-1 justify-center bg-gradient-to-br from-primary-400 to-primary-600 rounded-full text-xs font-semibold text-white shadow-sm">
                        {row.jenis_kelamin}
                    </span>
                ) : (
                    <span
                        className={`inline-flex items-center p-1 justify-center bg-gradient-to-br ${row.jenis_kelamin === "Perempuan" ? "from-pink-400 to-pink-600" : "from-red-400 to-red-600"} rounded-full text-xs font-semibold text-white shadow-sm`}
                    >
                        {row.jenis_kelamin}
                    </span>
                ),
        },
        {
            header: "Tempat Lahir",
            render: (row) =>
                row.tempat_lahir ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                        {row.tempat_lahir}
                    </span>
                ) : (
                    <span className="inline-flex items-center justify-center p-1 bg-gradient-to-br  rounded-full text-xs font-semibold text-gray-200 shadow-sm ">
                        --Kosong--
                    </span>
                ),
        },
        {
            header: "Tanggal Lahir",
            render: (row) => (
                <span className="">
                    {row.tanggal_lahir ? (
                        new Date(row.tanggal_lahir).toLocaleDateString(
                            "id-ID",
                            {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            },
                        )
                    ) : (
                        <span className="inline-flex items-center justify-center p-1 bg-gradient-to-br  rounded-full text-xs font-semibold text-gray-200 shadow-sm text-truncate">
                            --Kosong--
                        </span>
                    )}
                </span>
            ),
        },
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
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Nisn",
            render: (row) => (
                <p
                    className={`inline-flex items-center p-1 justify-center bg-gradient-to-br ${row.nisn ? "from-primary-400 to-primary-600" : "from-red-400 to-red-600"} rounded-full text-xs font-semibold text-white shadow-sm`}
                >
                    {row.nisn || "Kosong"}
                </p>
            ),
        },
        { header: "Nama Siswa", accessor: "label" },
        { header: "Kelas", accessor: "nama_kelas" },
        { header: "Tahun Ajaran", accessor: "tahun_ajaran" },
        {
            header: "Semester",
            render: (row) => (
                <span className="text-xs text-gray-700 uppercase tracking-wider">
                    {row.semester || "Belum Ada"}
                </span>
            ),
        },
    ];

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
        } else if (menu == "siswa_alumni") {
            getDataAlumni(taAlumniAsal);
            getTa();
        }
    }, [menu]);

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
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Nisn",
            render: (row) => (
                <p
                    className={`inline-flex items-center p-1 justify-center bg-gradient-to-br ${row.nisn ? "from-primary-400 to-primary-600" : "from-red-400 to-red-600"} rounded-full text-xs font-semibold text-white shadow-sm`}
                >
                    {row.nisn || "Belum Ada"}
                </p>
            ),
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

    // Format Opsi untuk React Select pada Filter Alumni
    const alumniOptions = [
        { value: "all", label: "[Semua Tahun Ajaran]" },
        ...(dataTahunAjaran || []).map((ta) => ({
            value: ta.id || ta.value,
            label: ta.tahun_ajaran || ta.label,
        })),
    ];

    const selectedAlumniOption =
        alumniOptions.find(
            (opt) => String(opt.value) === String(taAlumniAsal),
        ) || null;

    return (
        <AuthenticatedLayout header={"Daftar Siswa"}>
            <div className="flex flex-col md:flex-row bg-gray-50 items-start gap-3 p-3 md:p-0">
                <Menu menu={menu} setMenu={setMenu} menus={menus} />

                {/* ===== Bagian Kanan (Main Content Berpindah) ===== */}
                <div className="flex-1 min-w-0 md:p-4 w-full mt-2 md:mt-0">
                    {/* TAMPILAN 1: Jika menu yang dipilih adalah 'master_siswa' */}
                    {menu === "master_siswa" && (
                        <MasterSiswa
                            dataSiswa={dataSiswa}
                            columns={columns}
                            loading={loading}
                            show={show}
                            setShow={setShow}
                            isEdit={isEdit}
                            setIsEdit={setIsEdit}
                            selectedSiswa={selectedSiswa}
                            getSiswa={getSiswa}
                            handleTambah={handleTambah}
                        />
                    )}

                    {menu === "siswa_aktif" && (
                        <SiswaKelas
                            columnsSiswaPerKelas={columnsSiswaPerKelas}
                            loading={loading}
                            taAsal={taAsal}
                            setTaAsal={setTaAsal}
                            kelasAsalId={kelasAsalId}
                            setKelasAsalId={setKelasAsalId}
                            ShowMapping={ShowMapping}
                            setShowMapping={setShowMapping}
                            ResultSiswaPerKelas={ResultSiswaPerKelas}
                            handleKelasChange={handleKelasChange}
                            handleMappingKelas={handleMappingKelas}
                        />
                    )}
                    {menu === "siswa_alumni" && (
                        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-4">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                                ARSIP & KELULUSAN ALUMNI
                            </h3>
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 w-full mb-4">
                                {/* Filter Tahun Ajaran menggunakan React Select */}
                                <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[240px]">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        Tahun Ajaran
                                    </label>
                                    <Select
                                        value={selectedAlumniOption}
                                        onChange={(option) => {
                                            const value = option
                                                ? option.value
                                                : "all";
                                            setTaAlumniAsal(value);
                                            getDataAlumni(value);
                                        }}
                                        options={alumniOptions}
                                        placeholder="-- Pilih Tahun Ajaran --"
                                        isSearchable={true}
                                        menuPortalTarget={document.body}
                                        className="w-full text-xs"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (base, state) => ({
                                                ...base,
                                                backgroundColor: "#FFFFFF",
                                                borderColor: state.isFocused
                                                    ? "#10B981"
                                                    : "#E5E7EB",
                                                borderRadius: "0.5rem",
                                                padding: "0.05rem 0.1rem",
                                                minHeight: "32px",
                                                boxShadow: state.isFocused
                                                    ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                                                    : "none",
                                                cursor: "pointer",
                                                "&:hover": {
                                                    borderColor: "#10B981",
                                                },
                                            }),
                                            valueContainer: (base) => ({
                                                ...base,
                                                padding: "0px 6px",
                                            }),
                                            placeholder: (base) => ({
                                                ...base,
                                                color: "#9CA3AF",
                                                fontSize: "11px",
                                                fontWeight: "normal",
                                            }),
                                            singleValue: (base) => ({
                                                ...base,
                                                color: "#1F2937",
                                                fontSize: "11px",
                                                fontWeight: "600",
                                            }),
                                            option: (base, state) => ({
                                                ...base,
                                                backgroundColor:
                                                    state.isSelected
                                                        ? "#10B981"
                                                        : state.isFocused
                                                          ? "#ECFDF5"
                                                          : "white",
                                                color: state.isSelected
                                                    ? "white"
                                                    : "#1F2937",
                                                fontSize: "11px",
                                                fontWeight: "500",
                                                cursor: "pointer",
                                            }),
                                            menuPortal: (base) => ({
                                                ...base,
                                                zIndex: 9999,
                                            }),
                                        }}
                                    />
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
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
