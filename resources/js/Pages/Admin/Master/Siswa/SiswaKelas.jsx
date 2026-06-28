import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import MappingSiswaKelas from "./modals/MappingSiswaKelas";

export default function SiswaKelas({
    columnsSiswaPerKelas,
    dataTahunAjaran,
    loading,
    taAsal,
    setTaAsal,
    kelasAsalId,
    setKelasAsalId,
    ShowMapping,
    setShowMapping,
    ResultSiswaPerKelas,
    kelasList,
    handleKelasChange,
    handleMappingKelas,
}) {
    return (
        <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Rombongan Belajar (Rombel)
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-4 mb-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                {/* --- SISI KIRI: INPUT FILTER --- */}
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full">
                    {/* Filter Tahun Ajaran */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[200px]">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Tahun Ajaran
                        </label>
                        <select
                            className="w-full text-sm border border-gray-200 rounded-lg px-8 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            value={taAsal}
                            onChange={(e) => {
                                setTaAsal(e.target.value);
                                setKelasAsalId(""); // Reset kelas saat TA berubah
                            }}
                        >
                            <option value="">Semua Tahun Ajaran</option>
                            {dataTahunAjaran?.map((ta) => (
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
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            value={kelasAsalId}
                            disabled={!taAsal}
                            onChange={(e) => handleKelasChange(e.target.value)}
                        >
                            {kelasList?.map((k) => (
                                <option key={k.value} value={k.value}>
                                    {k.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* --- SISI KANAN: TOMBOL AKSI --- */}
                <div className="w-full sm:w-auto flex-shrink-0 flex justify-end">
                    <PrimaryButton
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                        onClick={handleMappingKelas}
                    >
                        <i className="fa fa-plus text-xs" />
                        <span>Kelola Rombel</span>
                    </PrimaryButton>
                </div>
            </div>
            <DataTable
                columns={columnsSiswaPerKelas}
                data={ResultSiswaPerKelas}
                loading={loading}
                header={"Siswa"}
                title="Siswa "
            />
            <MappingSiswaKelas open={ShowMapping} setOpen={setShowMapping} />
        </div>
    );
}
