import { useEffect, useState, useCallback } from "react";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import MappingSiswaKelas from "./modals/MappingSiswaKelas";
import Select from "react-select";

export default function SiswaKelas({
    columnsSiswaPerKelas,
    loading,
    taAsal,
    setTaAsal,
    kelasAsalId,
    setKelasAsalId,
    ShowMapping,
    setShowMapping,
    ResultSiswaPerKelas,
    handleKelasChange,
    handleMappingKelas,
}) {
    const [kelasList, setKelasList] = useState([]);
    const [dataTahunAjaran, setDataTahunAjaran] = useState([]);
    const [isConfigLoading, setIsConfigLoading] = useState(false);

    // Load Master Data (TA & List Kelas)
    const loadMasterData = useCallback(async (tahunAjaran = null) => {
        setIsConfigLoading(true);
        try {
            // Kita fetch Tahun Ajaran di awal, dan Kelas jika TA sudah dipilih
            const [resTA, resKelas] = await Promise.all([
                axios.get(route("getData.get-tahun-ajaran")),
                tahunAjaran
                    ? axios.get(
                          route("getData.get-kelas", {
                              tahun_ajaran: tahunAjaran,
                          }),
                      )
                    : Promise.resolve({ data: { data: [] } }),
            ]);

            setDataTahunAjaran(resTA.data.data || []);
            setKelasList(resKelas.data.data || []);
        } catch (error) {
            console.error("Gagal memuat konfigurasi:", error);
        } finally {
            setIsConfigLoading(false);
        }
    }, []);

    // Load data awal saat mount
    useEffect(() => {
        loadMasterData(taAsal);
    }, [loadMasterData, taAsal]);

    // Opsi untuk React Select Tahun Ajaran
    const tahunAjaranOptions = (dataTahunAjaran || []).map((ta) => ({
        value: ta.id || ta.value,
        label: ta.tahun_ajaran || ta.label,
    }));

    const selectedTaOption =
        tahunAjaranOptions.find(
            (opt) => String(opt.value) === String(taAsal),
        ) || null;

    // Opsi untuk React Select Kelas
    const kelasOptions = (kelasList || []).map((k) => ({
        value: k.value,
        label: k.label,
    }));

    const selectedKelasOption =
        kelasOptions.find((opt) => String(opt.value) === String(kelasAsalId)) ||
        null;

    // Styling custom untuk React Select agar konsisten dan modern
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? "#F3F4F6" : "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E5E7EB",
            borderRadius: "0.5rem",
            padding: "0.1rem 0.25rem",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            "&:hover": {
                borderColor: state.isDisabled ? "#E5E7EB" : "#10B981",
            },
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontWeight: "normal",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
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
            fontWeight: "500",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

    return (
        <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Rombongan Belajar (Rombel)
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-4 mb-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full">
                    {/* Filter Tahun Ajaran */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[220px]">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Tahun Ajaran
                        </label>
                        <Select
                            value={selectedTaOption}
                            onChange={(option) => {
                                const val = option ? option.value : "";
                                setTaAsal(val);
                                setKelasAsalId("");
                                loadMasterData(val);
                            }}
                            options={tahunAjaranOptions}
                            placeholder="-- Pilih Tahun Ajaran --"
                            isSearchable={true}
                            menuPortalTarget={document.body}
                            className="w-full text-sm"
                            classNamePrefix="react-select"
                            styles={customSelectStyles}
                        />
                    </div>

                    {/* Filter Kelas */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[180px]">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Kelas
                        </label>
                        <Select
                            value={selectedKelasOption}
                            onChange={(option) => {
                                const val = option ? option.value : "";
                                setKelasAsalId(val);
                                handleKelasChange(val);
                            }}
                            options={kelasOptions}
                            placeholder={
                                !taAsal
                                    ? "-- Pilih TA Dahulu --"
                                    : kelasList.length === 0
                                      ? "-- Belum ada kelas --"
                                      : "-- Pilih Kelas --"
                            }
                            isSearchable={true}
                            isDisabled={!taAsal || isConfigLoading}
                            menuPortalTarget={document.body}
                            className="w-full text-sm"
                            classNamePrefix="react-select"
                            styles={customSelectStyles}
                        />
                    </div>
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                    <PrimaryButton
                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                        onClick={handleMappingKelas}
                        disabled={!kelasAsalId}
                    >
                        <i className="fa fa-plus text-xs" />
                        <span>Kelola Rombel</span>
                    </PrimaryButton>
                </div>
            </div>

            <DataTable
                columns={columnsSiswaPerKelas}
                data={ResultSiswaPerKelas}
                loading={loading || isConfigLoading}
                header="Siswa"
                title="Siswa"
            />

            <MappingSiswaKelas open={ShowMapping} setOpen={setShowMapping} />
        </div>
    );
}
