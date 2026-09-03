import DataTable from "@/Components/Datatables";
import Reveal from "./Reveal";
import Counter from "./Counter";
import { useState } from "react";

export default function Statistics({
    totalGuru,
    totalSiswa,
    totalMapel,
    dataSiswa = [],
    dataGuru = [],
    dataJadwal = [],
}) {
    // State untuk mengatur tab yang aktif
    const [activeTab, setActiveTab] = useState("siswa");

    const STATS = [
        { value: totalGuru, decimals: 0, suffix: "+", label: "Total Guru" },
        { value: totalSiswa, decimals: 0, suffix: "+", label: "Total Siswa" },
        { value: totalMapel, decimals: 0, suffix: "", label: "Mata Pelajaran" },
    ];

    const TABS = [
        { id: "siswa", label: "Data Siswa" },
        { id: "guru", label: "Data Guru" },
        { id: "jadwal", label: "Jadwal Mengajar" },
    ];

    return (
        <>
            {/* Bagian Statistik (Counter) */}
            <div className="grid grid-cols-1 md:grid-cols-3">
                {STATS.map((s, i) => (
                    <Reveal
                        key={s.label}
                        className={`py-10 md:py-12 px-5 text-center ${
                            i !== 0
                                ? "border-t md:border-t-0 md:border-l border-white/10"
                                : ""
                        }`}
                    >
                        <div className="font-serif-display text-3xl md:text-[42px] text-[#34d399] font-semibold">
                            <Counter
                                value={s.value}
                                decimals={s.decimals}
                                suffix={s.suffix}
                            />
                        </div>
                        <div className="font-mono-ui text-xs tracking-wider text-[#9dbdba] mt-2.5 uppercase">
                            {s.label}
                        </div>
                    </Reveal>
                ))}
            </div>

            {/* Bagian Navigasi Tab */}
            <div className="mt-8 px-5 md:px-7">
                <div className="flex flex-wrap gap-2 md:gap-4 border-b border-white/10 pb-4">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                activeTab === tab.id
                                    ? "bg-[#10b981] text-[#eafaf3] shadow-md"
                                    : "bg-white/5 text-[#9dbdba] hover:bg-white/10 hover:text-[#eafaf3]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bagian Konten Tab (DataTable) */}
            <div className="p-5 md:px-7 mt-4 min-h-[400px]">
                {activeTab === "siswa" && (
                    <Reveal className="animation-fade-in">
                        <h3 className="text-xl font-serif-display text-[#eafaf3] mb-4">
                            Daftar Siswa
                        </h3>
                        {/* Sesuaikan columns dengan struktur data siswa Anda */}
                        <DataTable columns={[]} data={dataSiswa} />
                    </Reveal>
                )}

                {activeTab === "guru" && (
                    <Reveal className="animation-fade-in">
                        <h3 className="text-xl font-serif-display text-[#eafaf3] mb-4">
                            Daftar Guru
                        </h3>
                        {/* Sesuaikan columns dengan struktur data guru Anda */}
                        <DataTable columns={[]} data={dataGuru} />
                    </Reveal>
                )}

                {activeTab === "jadwal" && (
                    <Reveal className="animation-fade-in">
                        <h3 className="text-xl font-serif-display text-[#eafaf3] mb-4">
                            Jadwal Mengajar
                        </h3>
                        {/* Sesuaikan columns dengan struktur data jadwal Anda */}
                        <DataTable columns={[]} data={dataJadwal} />
                    </Reveal>
                )}
            </div>
        </>
    );
}
