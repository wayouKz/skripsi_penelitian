import { useEffect, useState, useCallback } from "react";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import MappingSiswaKelas from "./modals/MappingSiswaKelas";
import Select from "react-select";
import AppSelect from "@/Components/AppSelect";

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
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Rombongan Belajar (Rombel)
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-3 mb-3 bg-gray-50/50 border border-gray-100 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 w-full">
                    {/* Filter Tahun Ajaran */}
                    <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[200px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Tahun Ajaran
                        </label>
                        <AppSelect
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
                            className="w-full text-xs"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Filter Kelas */}
                    <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[160px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Kelas
                        </label>
                        <AppSelect
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
                            className="w-full text-xs"
                            classNamePrefix="react-select"
                        />
                    </div>
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                    <PrimaryButton
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-xl shadow-sm"
                        onClick={handleMappingKelas}
                        disabled={!kelasAsalId}
                    >
                        <i className="fa fa-plus text-[10px]" />
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
