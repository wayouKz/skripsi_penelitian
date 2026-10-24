import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import ActionDropdown from "@/Components/ActionDropdown";
import Switch from "@/Components/Switch";
import Menu from "@/Components/Menu";
import Select from "react-select";
import { useAlert } from "@/Components/AlertContext";

// Import Modals
import Add from "./Add";
import EditWaliKelas from "./EditWaliKelas";
import MappingGuruMapel from "./MappingGuruMapel";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import ModalPdf from "@/Components/ModalPdf";
import AppSelect from "@/Components/AppSelect";

export default function Guru() {
    const { showAlert, showQuestion } = useAlert();

    // =========================================================================
    // STATE DECLARATIONS
    // =========================================================================
    const [activeMenu, setActiveMenu] = useState("master_guru");
    const [loading, setLoading] = useState(false);
    const [openPdf, setOpenPdf] = useState(false);
    const [tahunAjaran, setTahunAjaran] = useState([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);

    const [data, setData] = useState({
        guru: [],
        wali: [],
        mapel: [],
    });

    const [filter, setFilter] = useState({ kelas: null });
    const [opsiKelas, setOpsiKelas] = useState([]);

    const [modal, setModal] = useState({
        show: false,
        type: null,
        isEdit: false,
        data: null,
    });

    const [title, setTitle] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");

    const menus = [
        { value: "master_guru", nama_menu: "Master Guru" },
        { value: "wali_kelas", nama_menu: "Daftar Wali Kelas" },
        { value: "guru_mapel", nama_menu: "Daftar Guru Mata Pelajaran" },
    ];

    // =========================================================================
    // DATA FETCHING
    // =========================================================================
    const loadGuru = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(route("master.guru.getGuru"));
            setData((prev) => ({
                ...prev,
                guru: res.data.status !== false ? res.data.data : [],
            }));
        } catch {
            setData((prev) => ({ ...prev, guru: [] }));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadGuruMapel = useCallback(async (taId = null) => {
        setLoading(true);
        try {
            const params = taId ? { tahun_ajaran_id: taId } : {};
            const res = await axios.get(
                route("master.guru.getGuruMapel", params),
            );
            setData((prev) => ({
                ...prev,
                mapel: res.data.status !== false ? res.data.data : [],
            }));
        } catch {
            setData((prev) => ({ ...prev, mapel: [] }));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadKelas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(route("getData.get-kelas"));
            setOpsiKelas(res.data.status !== false ? res.data.data : []);
        } catch {
            setOpsiKelas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadWaliKelas = useCallback(async (kelasId = null) => {
        setLoading(true);
        try {
            const params = kelasId ? { kelas_id: kelasId } : {};
            const res = await axios.get(
                route("master.guru.getWaliKelas", params),
            );
            setData((prev) => ({
                ...prev,
                wali: res.data.status !== false ? res.data.data : [],
            }));
        } catch {
            setData((prev) => ({ ...prev, wali: [] }));
        } finally {
            setLoading(false);
        }
    }, []);

    const getTahunAjaran = useCallback(async () => {
        try {
            const res = await axios.get(
                route("master.tahun-ajaran.getTahunAjaran"),
            );
            const taData = res.data?.data || [];
            setTahunAjaran(taData);

            if (taData.length > 0) {
                const taAktif = taData.find((ta) => ta.status === "Aktif");
                if (taAktif) {
                    setSelectedTahunAjaran(taAktif.id);
                    loadGuruMapel(taAktif.id);
                }
            }
        } catch (error) {
            console.error("Gagal memuat tahun ajaran:", error);
            setTahunAjaran([]);
        }
    }, [loadGuruMapel]);

    // =========================================================================
    // EFFECTS
    // =========================================================================
    useEffect(() => {
        if (activeMenu === "master_guru") {
            loadGuru();
        } else if (activeMenu === "wali_kelas") {
            loadKelas();
            loadWaliKelas(filter.kelas);
        } else if (activeMenu === "guru_mapel") {
            getTahunAjaran();
        }
    }, [
        activeMenu,
        filter.kelas,
        loadGuru,
        loadWaliKelas,
        loadKelas,
        getTahunAjaran,
    ]);

    // =========================================================================
    // ACTIONS & HANDLERS
    // =========================================================================
    const closeModal = () =>
        setModal({ show: false, type: null, isEdit: false, data: null });

    const handleStatus = (row) => {
        axios
            .post(route("master.guru.update-status"), {
                nip: row.nip,
                status: row.status === "active" ? "nonactive" : "active",
            })
            .then(() => {
                loadGuru();
                showAlert("Data berhasil diubah", "success");
            });
    };

    const handleDelete = (id) => {
        showQuestion("Apakah anda yakin ingin menghapus data ini?", () => {
            axios.post(route("master.guru.destroy", { id })).then((res) => {
                if (res.data.success) {
                    showAlert(res.data.message, "success");
                    loadGuru();
                } else {
                    showAlert(res.data.message, "error");
                }
            });
        });
    };

    // =========================================================================
    // MEMOIZED OPTIONS & COLUMNS
    // =========================================================================
    const tahunAjaranOptions = useMemo(
        () =>
            tahunAjaran.map((ta) => ({
                value: ta.id,
                label: ta.tahun_ajaran,
                semester: ta.semester,
                status: ta.status,
            })),
        [tahunAjaran],
    );

    const selectStyles = {
        control: (base) => ({
            ...base,
            borderRadius: "0.5rem",
            borderColor: "#16a34a",
        }),
    };

    const columnsGuru = useMemo(
        () => [
            { header: "No", render: (_, i) => i + 1 },
            {
                header: "NIP",
                render: (row) =>
                    row.nip ? (
                        <span className="font-mono text-gray-700">
                            {row.nip}
                        </span>
                    ) : (
                        <span className="text-gray-400">Tidak tersedia</span>
                    ),
            },
            { header: "Nama Guru", accessor: "nama_guru" },
            {
                header: "Status",
                render: (row) => (
                    <Switch
                        checked={row.status === "active"}
                        onChange={() => handleStatus(row)}
                    />
                ),
            },
            {
                header: "#",
                render: (row) => (
                    <ActionDropdown
                        actions={[
                            {
                                edit: true,
                                label: "Edit",
                                icon: "edit",
                                onClick: () =>
                                    setModal({
                                        show: true,
                                        type: "add_guru",
                                        isEdit: true,
                                        data: row,
                                    }),
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
        ],
        [],
    );

    const columnsWali = useMemo(
        () => [
            { header: "No", render: (_, i) => i + 1 },
            {
                header: "Kelas",
                render: (row) => `${row.nama_kelas} ${row.nama_jurusan || ""}`,
            },
            {
                header: "Nama Guru",
                render: (row) => row.wali_kelas?.nama_guru || "Belum diatur",
            },
            {
                header: "#",
                render: (row) => (
                    <ActionDropdown
                        actions={[
                            {
                                edit: true,
                                label: "Edit",
                                onClick: () =>
                                    setModal({
                                        show: true,
                                        type: "edit_wali",
                                        isEdit: true,
                                        data: row,
                                    }),
                            },
                        ]}
                    />
                ),
            },
        ],
        [],
    );

    const columnsMapel = useMemo(
        () => [
            {
                header: "Mata Pelajaran",
                accessor: "mapel",
                render: (row) => row.mapel,
            },
            {
                header: "#",
                render: (row) => (
                    <button
                        type="button"
                        className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 p-2 rounded-md transition-colors"
                        onClick={() =>
                            setModal({
                                show: true,
                                type: "details",
                                isEdit: false,
                                data: row,
                            })
                        }
                    >
                        <i className="fa fa-eye mr-1"></i> Detail
                    </button>
                ),
            },
        ],
        [],
    );

    const openModalPdf = (type, nip, namaGuru) => {
        if (selectedTahunAjaran === null) {
            showAlert("Pilih tahun ajaran terlebih dahulu", "warning");
            return;
        }
        if (type === "guru_mapel") {
            setTitle("Daftar Guru Mata Pelajaran");
            setPdfUrl(
                route("pdf.pdfGuruMapel", {
                    tahun_ajaran: selectedTahunAjaran,
                }),
            );
            setOpenPdf(true);
        } else if (type === "guru_mapel_per_guru") {
            setTitle(`Daftar Mata Pelajaran ${namaGuru}`);
            setPdfUrl(
                route("pdf.pdfGuruMapel", {
                    tahun_ajaran: selectedTahunAjaran,
                    nip,
                }),
            );
            setOpenPdf(true);
            setModal((prev) => ({ ...prev, show: false }));
        }
    };
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? "#F3F4F6" : "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E5E7EB",
            borderRadius: "0.5rem",
            padding: "0.05rem 0.1rem",
            minHeight: "32px",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            "&:hover": {
                borderColor: state.isDisabled ? "#E5E7EB" : "#10B981",
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
            backgroundColor: state.isSelected
                ? "#10B981"
                : state.isFocused
                  ? "#ECFDF5"
                  : "white",
            color: state.isSelected ? "white" : "#1F2937",
            fontSize: "11px",
            fontWeight: "500",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

    return (
        <AuthenticatedLayout header={"Kelola Guru"}>
            <div className="flex flex-col md:flex-row bg-gray-50 items-start gap-4 p-4 md:p-0">
                <Menu menu={activeMenu} setMenu={setActiveMenu} menus={menus} />

                <div className="flex-1 min-w-0 md:p-6 w-full mt-4 md:mt-0">
                    {/* Master Guru */}
                    {activeMenu === "master_guru" && (
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <DataTable
                                columns={columnsGuru}
                                data={data.guru}
                                loading={loading}
                            />
                        </div>
                    )}

                    {/* Wali Kelas */}
                    {activeMenu === "wali_kelas" && (
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <div className="w-72 m-2">
                                <AppSelect
                                    options={opsiKelas}
                                    value={
                                        opsiKelas.find(
                                            (o) => o.value === filter.kelas,
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setFilter({
                                            kelas: opt ? opt.value : null,
                                        })
                                    }
                                    isClearable={true}
                                    placeholder="Pilih Kelas..."
                                />
                            </div>
                            <DataTable
                                columns={columnsWali}
                                data={data.wali}
                                loading={loading}
                            />
                        </div>
                    )}

                    {/* Guru Mapel */}
                    {activeMenu === "guru_mapel" && (
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <div className="flex justify-between items-end mb-4">
                                <div className="w-1/2 sm:w-1/3">
                                    <InputLabel value="Pilih Tahun Ajaran" />
                                    <AppSelect
                                        menuPortalTarget={document.body}
                                        options={tahunAjaranOptions}
                                        placeholder="Pilih Tahun Ajaran..."
                                        value={
                                            tahunAjaranOptions.find(
                                                (o) =>
                                                    o.value ===
                                                    selectedTahunAjaran,
                                            ) || null
                                        }
                                        onChange={(val) => {
                                            setSelectedTahunAjaran(val?.value);
                                            loadGuruMapel(val?.value);
                                        }}
                                        formatOptionLabel={(option) => (
                                            <div className="flex justify-between items-center">
                                                <span>
                                                    {option.label}{" "}
                                                    {option.semester
                                                        ? `- ${option.semester}`
                                                        : ""}
                                                </span>
                                                {option.status && (
                                                    <span
                                                        className={`text-xs font-semibold ${
                                                            option.status ===
                                                            "Aktif"
                                                                ? "text-primary-600"
                                                                : "text-gray-500"
                                                        }`}
                                                    >
                                                        {option.status}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <PrimaryButton
                                        onClick={() =>
                                            openModalPdf("guru_mapel")
                                        }
                                        className="h-10 bg-red-600 hover:bg-red-700 focus:bg-red-700 active:bg-red-800"
                                        disabled={!selectedTahunAjaran}
                                    >
                                        Cetak SK{" "}
                                        <i className="fa fa-print ms-2"></i>
                                    </PrimaryButton>
                                    <PrimaryButton
                                        onClick={() =>
                                            setModal({
                                                show: true,
                                                type: "map_guru_mapel",
                                                isEdit: false,
                                                data: null,
                                            })
                                        }
                                        className="h-10"
                                    >
                                        <i className="fa fa-users-cog mr-2"></i>{" "}
                                        Kelola Guru Mata Pelajaran
                                    </PrimaryButton>
                                </div>
                            </div>
                            <DataTable
                                columns={columnsMapel}
                                data={data.mapel}
                                loading={loading}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <Add
                open={modal.show && modal.type === "add_guru"}
                setOpen={closeModal}
                isEdit={modal.isEdit}
                Guru={modal.data}
                getGuru={loadGuru}
            />
            <Modal
                show={modal.show && modal.type === "details"}
                onClose={closeModal}
                maxWidth="3xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-gray-800">
                            Detail Penugasan Guru
                        </h2>
                        <p className="text-sm text-gray-500 font-medium truncate">
                            {modal.data?.mapel}{" "}
                            <span className="text-primary-600 font-bold">
                                ({modal.data?.kode_mapel})
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {modal.data?.guru?.length > 0 && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold">
                                <i className="fa fa-user-tie"></i>
                                {modal.data.guru.length} Guru
                            </span>
                        )}
                        <button
                            onClick={closeModal}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500"
                        >
                            <i className="fa fa-times text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 bg-gray-50">
                    {modal.data?.guru?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {modal.data.guru.map((g) => {
                                const totalJam = g.mengajar.reduce(
                                    (total, item) =>
                                        total + (parseInt(item.beban_jam) || 0),
                                    0,
                                );

                                return (
                                    <div
                                        key={g.value}
                                        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col"
                                    >
                                        {/* Header kartu */}
                                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 text-sm truncate">
                                                    {g.label}
                                                </h3>
                                                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5 truncate">
                                                    NIP:{" "}
                                                    {g.nip || "Tidak tersedia"}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="text-center bg-primary-50 px-2.5 py-1 rounded-lg leading-tight">
                                                    <p className="text-[9px] text-primary-600/70 uppercase font-bold tracking-wider">
                                                        Total
                                                    </p>
                                                    <span className="text-base font-black text-primary-600">
                                                        {totalJam}
                                                        <span className="text-[10px] font-bold ml-0.5">
                                                            Jam
                                                        </span>
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openModalPdf(
                                                            "guru_mapel_per_guru",
                                                            g.nip,
                                                            g.label,
                                                        )
                                                    }
                                                    className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg transition-all"
                                                    title="Cetak PDF Jadwal Guru"
                                                >
                                                    <i className="fa fa-print text-sm"></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Daftar kelas (chip) */}
                                        <div className="px-4 py-3 flex flex-wrap gap-2">
                                            {g.mengajar.map((item) => (
                                                <span
                                                    key={item.id}
                                                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700"
                                                >
                                                    {item.kelas}
                                                    <span className="bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-md text-[11px] font-bold">
                                                        {item.beban_jam} Jam
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <i className="fa fa-folder-open text-4xl mb-3 block opacity-30"></i>
                            <p className="font-medium text-sm">
                                Belum ada guru yang ditugaskan pada mata
                                pelajaran ini.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            <EditWaliKelas
                open={modal.show && modal.type === "edit_wali"}
                setOpen={closeModal}
                getKelas={() => loadWaliKelas(filter.kelas)}
                Kelas={modal.data}
            />

            <MappingGuruMapel
                open={modal.show && modal.type === "map_guru_mapel"}
                setOpen={closeModal}
                getGuruMapel={() => loadGuruMapel(selectedTahunAjaran)}
            />

            <ModalPdf
                isOpen={openPdf}
                onClose={() => setOpenPdf(false)}
                pdfUrl={pdfUrl}
                title={title}
            />
        </AuthenticatedLayout>
    );
}
