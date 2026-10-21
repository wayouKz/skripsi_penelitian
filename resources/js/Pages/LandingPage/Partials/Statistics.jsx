import DataTable from "@/Components/Datatables";
import Reveal from "./Reveal";
import Counter from "./Counter";
import { useMemo, useState } from "react";
import DaftarJadwal from "@/Pages/Admin/Master/GenerateJadwal/partials/component/DaftarJadwal";

const Kosong = () => (
    <span className="text-xs italic text-slate-400">Belum diisi</span>
);

export default function Statistics({
    totalGuru,
    totalSiswa,
    totalMapel,
    dataSiswa = [],
    dataGuru = [],
    dataJadwal = [],
    dataMapel = [],
    dataGuruMapel = [],
}) {
    const [activeTab, setActiveTab] = useState("siswa");
    console.log(dataJadwal);
    const STATS = [
        { value: totalGuru, decimals: 0, suffix: "+", label: "Total Guru" },
        { value: totalSiswa, decimals: 0, suffix: "+", label: "Total Siswa" },
        { value: totalMapel, decimals: 0, suffix: "", label: "Mata Pelajaran" },
    ];

    const TABS = [
        { id: "siswa", label: "Daftar Siswa" },
        { id: "guru", label: "Daftar Guru" },
        { id: "jadwal", label: "Jadwal Mengajar" },
    ];

    const columnsSiswa = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-50 text-xs font-semibold text-emerald-700">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Foto",
            render: (row) =>
                row.foto ? (
                    <img
                        src={`/storage/public/foto/${row.foto}`}
                        alt="Foto Siswa"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-100"
                    />
                ) : (
                    <span className="w-9 h-9 rounded-full bg-primary-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                        {(row.nama_siswa || "?").charAt(0).toUpperCase()}
                    </span>
                ),
        },
        {
            header: "NISN",
            accessor: "nisn",
            render: (row) =>
                row.nisn ? (
                    <span className="font-mono-ui text-xs text-slate-700">
                        {row.nisn}
                    </span>
                ) : (
                    <Kosong />
                ),
        },
        {
            header: "Nama Siswa",
            accessor: "nama_siswa",
            render: (row) => (
                <span className="font-medium text-slate-800">
                    {row.nama_siswa}
                </span>
            ),
        },
        {
            header: "Jenis Kelamin",
            render: (row) =>
                row.jenis_kelamin === "Laki-laki" ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-emerald-800">
                        {row.jenis_kelamin}
                    </span>
                ) : row.jenis_kelamin === "Perempuan" ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                        {row.jenis_kelamin}
                    </span>
                ) : (
                    <Kosong />
                ),
        },
        {
            header: "Tempat Lahir",
            render: (row) =>
                row.tempat_lahir ? (
                    <span className="text-sm text-slate-700">
                        {row.tempat_lahir}
                    </span>
                ) : (
                    <Kosong />
                ),
        },
        {
            header: "Tanggal Lahir",
            render: (row) =>
                row.tanggal_lahir ? (
                    <span className="text-sm text-slate-700 whitespace-nowrap">
                        {new Date(row.tanggal_lahir).toLocaleDateString(
                            "id-ID",
                            { day: "2-digit", month: "long", year: "numeric" },
                        )}
                    </span>
                ) : (
                    <Kosong />
                ),
        },
    ];
    const columnsGuru = useMemo(
        () => [
            { header: "No", render: (_, i) => i + 1 },
            {
                header: "Foto",
                render: (row) =>
                    row.foto ? (
                        <img
                            src={`/storage/public/foto/${row.foto}`}
                            alt="Foto Siswa"
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-100"
                        />
                    ) : (
                        <span className="w-9 h-9 rounded-full bg-primary-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                            {(row.nama_guru || "?").charAt(0).toUpperCase()}
                        </span>
                    ),
            },
            {
                header: "NIP",
                accessor: "nip",
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
        ],
        [],
    );

    const opsiGuru = dataGuru.map((g) => ({
        value: g.id, // Sesuaikan dengan primary key/id guru Anda
        label: g.nama_guru, // Sesuaikan dengan kolom nama guru Anda
    }));
    return (
        <>
            {/* ===== Counter ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-12">
                {STATS.map((s) => (
                    <Reveal
                        key={s.label}
                        className="py-8 px-5 text-center bg-white rounded-2xl border border-primary-200 shadow-[0_12px_30px_-18px_rgba(5,150,105,0.45)]"
                    >
                        <div className="font-serif-display text-4xl md:text-[46px] text-emerald-700 font-semibold">
                            <Counter
                                value={s.value}
                                decimals={s.decimals}
                                suffix={s.suffix}
                            />
                        </div>
                        <div className="text-sm text-emerald-900/70 mt-2 tracking-wide">
                            {s.label}
                        </div>
                    </Reveal>
                ))}
            </div>

            {/* ===== Tab ===== */}
            <div className="mt-10">
                <div
                    role="tablist"
                    className="flex w-full md:inline-flex md:w-auto gap-1 p-1 rounded-xl bg-white border border-primary-200 shadow-sm overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 md:flex-none whitespace-nowrap px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                                activeTab === tab.id
                                    ? "bg-primary-600 text-white shadow"
                                    : "text-emerald-900/70 hover:text-emerald-900 hover:bg-primary-50"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== Tabel ===== */}
            <div className="py-6 pb-14 min-h-[400px]">
                <Reveal key={activeTab}>
                    <h3 className="text-xl font-serif-display text-emerald-900 mb-4">
                        {TABS.find((t) => t.id === activeTab)?.label}
                    </h3>
                    <div className="bg-white rounded-2xl p-5 border border-primary-200 shadow-[0_20px_40px_-24px_rgba(5,150,105,0.4)] overflow-x-auto">
                        {activeTab === "siswa" && (
                            <DataTable
                                columns={columnsSiswa}
                                data={dataSiswa}
                                searchable={true}
                            />
                        )}
                        {activeTab === "guru" && (
                            <DataTable
                                columns={columnsGuru}
                                data={dataGuru}
                                searchable={true}
                            />
                        )}
                        {activeTab === "jadwal" && (
                            <DaftarJadwal
                                historyJadwal={dataJadwal}
                                selectedTahunAjaran={""}
                                selectedNamaTahunAjaran={""}
                                dataMapel={dataMapel}
                                listMapelGuru={dataGuruMapel}
                                setActiveTab={""}
                                isLanding={true}
                            />
                        )}
                    </div>
                </Reveal>
            </div>
        </>
    );
}
