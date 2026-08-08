import { useEffect, useState, useCallback } from "react";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import MappingSiswaKelas from "./modals/MappingSiswaKelas";

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

    return (
        <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Rombongan Belajar (Rombel)
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-4 mb-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full">
                    {/* Filter Tahun Ajaran */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[200px]">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Tahun Ajaran
                        </label>
                        <select
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-emerald-500/20"
                            value={taAsal}
                            onChange={(e) => {
                                setTaAsal(e.target.value);
                                setKelasAsalId("");
                                loadMasterData(e.target.value); // Fetch ulang kelas berdasarkan TA baru
                            }}
                        >
                            <option value="">-- Pilih Tahun Ajaran --</option>
                            {dataTahunAjaran.map((ta) => (
                                <option
                                    key={ta.id || ta.value}
                                    value={ta.id || ta.value}
                                >
                                    {ta.tahun_ajaran || ta.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Kelas */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[160px]">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Kelas
                        </label>
                        <select
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            value={kelasAsalId}
                            disabled={!taAsal || isConfigLoading}
                            onChange={(e) => handleKelasChange(e.target.value)}
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {kelasList.map((k) => (
                                <option key={k.value} value={k.value}>
                                    {k.label}
                                </option>
                            ))}
                            {kelasList.length === 0 && (
                                <option value="">-- Belum ada kelas --</option>
                            )}
                        </select>
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
