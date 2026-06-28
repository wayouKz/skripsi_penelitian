import { useEffect, useState } from "react";
import FormModal from "@/Components/FormModal";

import axios from "axios";
import { useAlert } from "@/Components/AlertContext";
import TabKenaikanKelas from "../main/tab/TabKenaikanSiswa";
import TabMappingSiswa from "../main/tab/TabMappingSiswa";

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

            if (data.length > 0 && tahunAjaran) {
                // Sesuaikan properti 'status' dan nilainya ('Aktif' / 1 / 'Active') dengan yang ada di database Anda
                const activeTahun = data.find(
                    (tahun) => tahun.status === "active",
                );
                if (activeTahun) {
                    setTahunAjaran(activeTahun.value);
                } else {
                    // Fallback: Jika tidak ada yang aktif, pilih urutan pertama saja
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

    // 2. Di bagian render, tampilkan berdasarkan filter
    const filteredKelas = selectedClassId
        ? kelasList?.filter((k) => k.id == selectedClassId)
        : kelasList;
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
                                ? "border-green-600 text-green-600"
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
                                ? "border-green-600 text-green-600"
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
                    <div className="flex items-center gap-3 py-2 md:py-0">
                        <label className="text-sm font-bold text-gray-700">
                            <i className="fa fa-calendar-alt mr-2 text-green-500"></i>
                            Tahun Ajaran:
                        </label>
                        <select
                            value={tahunAjaran}
                            onChange={(e) => setTahunAjaran(e.target.value)}
                            className="border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 font-medium bg-gray-50 py-1.5 px-9 outline-none cursor-pointer"
                        >
                            <option value="">[Pilih Tahun Ajaran]</option>
                            {dataTahunAjaran?.length === 0 && (
                                <option value="" disabled>
                                    Tidak ada data tahun ajaran
                                </option>
                            )}
                            {dataTahunAjaran?.map((tahun) => (
                                <option
                                    key={tahun.id || tahun.value}
                                    value={tahun.id || tahun.value}
                                >
                                    {tahun.tahun_ajaran || tahun.label}

                                    {/* Tambahkan penanda jika ini adalah tahun ajaran aktif */}
                                    {tahun.status === "active"
                                        ? " (Aktif)"
                                        : ""}
                                </option>
                            ))}
                        </select>
                        <label className="text-sm font-bold text-gray-700">
                            <i className="fa fa-school mr-2 text-green-500"></i>
                            Kelas:
                        </label>
                        <select
                            className="border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 font-medium bg-gray-50 py-1.5 px-8 outline-none cursor-pointer"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            <option value="">[Semua]</option>
                            {kelasList?.map((kelas) => (
                                <option key={kelas.id} value={kelas.id}>
                                    {kelas.nama_kelas}
                                </option>
                            ))}
                        </select>
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
