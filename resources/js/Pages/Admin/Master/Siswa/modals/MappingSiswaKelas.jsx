import { useEffect, useState } from "react";
import FormModal from "@/Components/FormModal";
import axios from "axios";
import { useAlert } from "@/Components/AlertContext";
import TabKenaikanKelas from "../main/tab/TabKenaikanSiswa";
import TabMappingSiswa from "../main/tab/TabMappingSiswa";
import Select from "react-select";

export default function MappingSiswaKelas({ open, setOpen, getMappingData }) {
    const { showCenterAlert, showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState("baru");

    // State Global & Drag-Drop
    const [kelasList, setKelasList] = useState([]);
    const [tahunAjaran, setTahunAjaran] = useState("");
    const [siswaList, setSiswaList] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState("");

    const [dataTahunAjaran, setDataTahunAjaran] = useState([]);
    useEffect(() => {
        if (open) {
            getTahunAjaran();
        }
    }, [open]);

    useEffect(() => {
        if (open && tahunAjaran) {
            getKelasList();
            if (activeTab === "baru") {
                getSiswa();
            }
        }
    }, [open, tahunAjaran, activeTab]);

    const getTahunAjaran = async () => {
        try {
            const res = await axios.get(route("getData.get-tahun-ajaran"));
            const data = res.data.data;

            setDataTahunAjaran(data);

            if (data.length > 0 && !tahunAjaran) {
                const activeTahun = data.find(
                    (tahun) => tahun.status === "active",
                );
                if (activeTahun) {
                    setTahunAjaran(activeTahun.value);
                } else {
                    setTahunAjaran(data[0].id || data[0].value);
                }
            }
        } catch (error) {
            console.error("Gagal mengambil data tahun ajaran:", error);
        }
    };

    const getKelasList = async () => {
        try {
            const res = await axios.get(route("getData.get-kelas-siswa"), {
                params: { tahun_ajaran: tahunAjaran },
            });
            const data = res.data.data;

            setKelasList(data);
        } catch (error) {
            console.error("Gagal mengambil data kelas:", error);
        }
    };

    const getSiswa = async () => {
        try {
            const res = await axios.get(
                route("getData.get-list-siswa-unmapped"),
                {
                    params: { tahun_ajaran: tahunAjaran },
                },
            );
            if (res.data.success == false) {
                setSiswaList([]);
            } else if (res.data.success == true) {
                const data = res.data.data.map((siswa) => ({
                    value: siswa.nisn,
                    label: siswa.nama_siswa,
                }));
                setSiswaList(data);
            }
        } catch (error) {
            console.error("Gagal mengambil data siswa:", error);
        }
    };

    const removeSiswa = (kelasId, siswa) => {
        setKelasList((prev) =>
            prev.map((k) =>
                k.id === kelasId
                    ? {
                          ...k,
                          siswa: k.siswa.filter((s) => s.value !== siswa.value),
                      }
                    : k,
            ),
        );
    };

    const filteredKelas = selectedClassId
        ? kelasList?.filter((k) => k.id == selectedClassId)
        : kelasList;

    // Opsi untuk React Select Tahun Ajaran
    const tahunAjaranOptions = (dataTahunAjaran || []).map((tahun) => ({
        value: tahun.id || tahun.value,
        label: `${tahun.tahun_ajaran || tahun.label}${
            tahun.status === "active" ? " (Aktif)" : ""
        }`,
    }));

    const selectedTaOption =
        tahunAjaranOptions.find(
            (opt) => String(opt.value) === String(tahunAjaran),
        ) || null;

    // Opsi untuk React Select Kelas
    const kelasOptions = [
        { value: "", label: "[Semua]" },
        ...(kelasList || []).map((kelas) => ({
            value: kelas.id,
            label: kelas.nama_kelas,
        })),
    ];

    const selectedKelasOption =
        kelasOptions.find(
            (opt) => String(opt.value) === String(selectedClassId),
        ) || null;

    // Styling custom untuk React Select
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: "#F9FAFB",
            borderColor: state.isFocused ? "#10B981" : "#D1D5DB",
            borderRadius: "0.5rem",
            minHeight: "36px",
            padding: "0 2px",
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
            padding: "0 6px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "0.875rem",
            fontWeight: "500",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "0.875rem",
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
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

    return (
        <FormModal
            title="Kelola Rombel Siswa"
            show={open}
            setOpen={setOpen}
            onClose={() => setOpen(false)}
            maxWidth="full"
            showForm={false}
        >
            {/* --- HEADER TABS & FILTER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 mb-4 px-2">
                {/* Tab Navigation */}
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab("baru")}
                        className={`py-3 px-2 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === "baru"
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                        type="button"
                    >
                        <i className="fa fa-user-plus mr-2"></i>
                        Siswa Baru (Drag & Drop)
                    </button>
                    <button
                        onClick={() => setActiveTab("naik")}
                        className={`py-3 px-2 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === "naik"
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                        type="button"
                    >
                        <i className="fa fa-level-up-alt mr-2"></i>
                        Kenaikan / Mutasi Kelas
                    </button>
                </div>

                {/* Filter Tahun Ajaran Global */}
                {activeTab === "baru" && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-2 md:py-0">
                        {/* Filter Tahun Ajaran */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
                                <i className="fa fa-calendar-alt mr-2 text-primary-500"></i>
                                Tahun Ajaran:
                            </label>
                            <div className="w-full sm:w-[220px]">
                                <Select
                                    value={selectedTaOption}
                                    onChange={(option) =>
                                        setTahunAjaran(
                                            option ? option.value : "",
                                        )
                                    }
                                    options={tahunAjaranOptions}
                                    placeholder="[Pilih Tahun Ajaran]"
                                    isSearchable={true}
                                    menuPortalTarget={document.body}
                                    className="text-sm"
                                    classNamePrefix="react-select"
                                    styles={customSelectStyles}
                                />
                            </div>
                        </div>

                        {/* Filter Kelas */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
                                <i className="fa fa-school mr-2 text-primary-500"></i>
                                Kelas:
                            </label>
                            <div className="w-full sm:w-[160px]">
                                <Select
                                    value={selectedKelasOption}
                                    onChange={(option) =>
                                        setSelectedClassId(
                                            option ? option.value : "",
                                        )
                                    }
                                    options={kelasOptions}
                                    placeholder="[Semua]"
                                    isSearchable={true}
                                    menuPortalTarget={document.body}
                                    className="text-sm"
                                    classNamePrefix="react-select"
                                    styles={customSelectStyles}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- TAB 1: PEMETAAN SISWA BARU (DRAG & DROP) --- */}
            {activeTab === "baru" && (
                <TabMappingSiswa
                    kelasList={filteredKelas}
                    siswaList={siswaList}
                    setKelasList={setKelasList}
                    removeSiswa={removeSiswa}
                    tahunAjaran={tahunAjaran}
                />
            )}

            {/* --- TAB 2: KENAIKAN / MUTASI KELAS MASSAL --- */}
            {activeTab === "naik" && (
                <TabKenaikanKelas showCenterAlert={showCenterAlert} />
            )}
        </FormModal>
    );
}
