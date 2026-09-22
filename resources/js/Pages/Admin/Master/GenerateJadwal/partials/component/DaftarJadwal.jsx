import ModalPdf from "@/Components/ModalPdf";
import React, { useState, useMemo } from "react";
import Select from "react-select";

// ==========================================
// 1. EXTRAKSI STYLE & KONSTANTA
// ==========================================
const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

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
    valueContainer: (base) => ({ ...base, padding: "0px 6px" }),
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
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

// ==========================================
// 2. SUB-KOMPONEN UNTUK ITEM JADWAL (KARTU)
// ==========================================
const JadwalCard = ({ jadwal }) => (
    <div className="flex flex-col bg-white border border-green-100 rounded-md p-2 shadow-sm hover:shadow-md transition-shadow border-l-[3px] border-l-green-500">
        <span className="inline-block bg-green-50 text-green-700 text-[9px] font-extrabold px-1 py-0.5 rounded border border-green-200 mb-1 w-max">
            {jadwal.jam_mulai.substring(0, 5)} -{" "}
            {jadwal.jam_selesai.substring(0, 5)}
        </span>
        <span className="font-bold text-gray-800 text-xs leading-tight mb-0.5">
            {jadwal.nama_mapel}
        </span>
        <span className="text-[10px] font-semibold text-green-600 mt-0.5 flex items-center gap-1">
            <i className="fa fa-user-circle text-green-400"></i>
            {jadwal.nama_guru}
        </span>
    </div>
);

// ==========================================
// 3. KOMPONEN UTAMA
// ==========================================
export default function DaftarJadwal({
    historyJadwal,
    selectedTahunAjaran,
    selectedNamaTahunAjaran,
    dataMapel,
    listMapelGuru,
}) {
    // --- States ---
    const [selectedKelas, setSelectedKelas] = useState(null);
    const [selectedMapel, setSelectedMapel] = useState(null);
    const [selectedGuru, setSelectedGuru] = useState(null);
    const [openPdfModal, setOpenPdfModal] = useState(false);

    // --- Pemrosesan Data (Memoized agar tidak berulang kali dikalkulasi) ---
    const groupedByKelas = useMemo(() => {
        if (!historyJadwal) return {};
        return historyJadwal.reduce((acc, curr) => {
            if (!acc[curr.nama_kelas]) acc[curr.nama_kelas] = [];
            acc[curr.nama_kelas].push(curr);
            return acc;
        }, {});
    }, [historyJadwal]);

    const dataGuruOptions = useMemo(() => {
        const guruMap = new Map();

        listMapelGuru.forEach((mapel) => {
            // Jika ada filter mapel, lewati mapel yang tidak sesuai
            if (
                selectedMapel &&
                selectedMapel !== "all" &&
                String(mapel.id) !== String(selectedMapel)
            ) {
                return;
            }

            if (mapel.guru && Array.isArray(mapel.guru)) {
                mapel.guru.forEach((guru) => {
                    const id = String(guru.guru_id || guru.id);
                    const nama = guru.nama || guru.nama_guru;
                    if (id && nama && !guruMap.has(id)) {
                        guruMap.set(id, { value: id, label: nama });
                    }
                });
            }
        });

        return [
            { value: "all", label: "Semua Guru" },
            ...Array.from(guruMap.values()),
        ];
    }, [listMapelGuru, selectedMapel]);

    const filteredKelasList = useMemo(() => {
        const baseList = [
            { value: "", label: "Semua Kelas" },
            ...Object.keys(groupedByKelas)
                .sort((a, b) =>
                    a.localeCompare(b, undefined, { numeric: true }),
                )
                .map((kelas) => ({ value: kelas, label: kelas })),
        ];

        return selectedKelas
            ? baseList.filter((item) => item.value === selectedKelas)
            : baseList.filter((item) => item.value !== "");
    }, [groupedByKelas, selectedKelas]);

    // --- Handler Functions ---
    const handleMapelChange = (option) => {
        const newMapel =
            option && option.value !== "" && option.value !== "all"
                ? option.value
                : null;
        setSelectedMapel(newMapel);
        setSelectedGuru(null); // Reset guru jika mapel berubah
    };

    const handleGuruChange = (option) => {
        setSelectedGuru(
            option && option.value !== ""
                ? { value: option.value, label: option.label }
                : null,
        );
    };

    // --- Konfigurasi PDF ---
    const pdfUrl = route("pdf.jadwal", {
        tahun_ajaran_id: historyJadwal?.[0]?.tahun_ajaran_id || null,
        kelas_id: selectedKelas || "all",
        mapel_id: selectedMapel || "all",
        guru_id: selectedGuru?.value || "all",
    });

    const titlePdf = `Jadwal Pelajaran - ${selectedNamaTahunAjaran} ${selectedKelas ? ` - Kelas ${selectedKelas}` : " - Semua Kelas"}`;

    if (!historyJadwal || historyJadwal.length === 0) return null;

    // --- Render Component ---
    return (
        <>
            <div>
                {/* 1. BAGIAN FILTER */}
                <div className="max-w-full pb-3">
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex gap-2 flex-wrap">
                            {/* Select Kelas */}
                            <div className="min-w-[200px]">
                                <Select
                                    options={filteredKelasList}
                                    value={
                                        filteredKelasList?.find(
                                            (opt) =>
                                                opt.value ===
                                                (selectedKelas || ""),
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setSelectedKelas(
                                            opt && opt.value !== ""
                                                ? opt.value
                                                : null,
                                        )
                                    }
                                    styles={customSelectStyles}
                                    isSearchable
                                    isClearable
                                    placeholder="Pilih Kelas..."
                                />
                            </div>

                            {/* Select Mapel */}
                            <div className="min-w-[200px]">
                                <Select
                                    options={dataMapel || []}
                                    value={
                                        dataMapel?.find(
                                            (opt) =>
                                                opt.value ===
                                                (selectedMapel || ""),
                                        ) || null
                                    }
                                    onChange={handleMapelChange}
                                    styles={customSelectStyles}
                                    isSearchable
                                    isClearable
                                    placeholder="Pilih Mapel..."
                                />
                            </div>

                            {/* Select Guru */}
                            <div className="min-w-[200px]">
                                <Select
                                    options={dataGuruOptions}
                                    value={
                                        dataGuruOptions?.find(
                                            (opt) =>
                                                opt.value ===
                                                (selectedGuru?.value || ""),
                                        ) || null
                                    }
                                    onChange={handleGuruChange}
                                    styles={customSelectStyles}
                                    isSearchable
                                    isClearable
                                    placeholder="Pilih Guru..."
                                />
                            </div>
                        </div>

                        {/* Tombol Cetak PDF */}
                        <button
                            type="button"
                            className="mt-2 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                            onClick={() => setOpenPdfModal(true)}
                        >
                            <span className="mr-1 text-xs">Cetak PDF</span>
                            <i className="fa fa-print"></i>
                        </button>
                    </div>
                </div>

                {/* 2. BAGIAN GRID JADWAL */}
                <div className="space-y-6 h-[80vh] overflow-y-auto">
                    <div className="min-h-[300px] overflow-y-auto space-y-4">
                        {filteredKelasList.map((itemKelas) => {
                            const namaKelas = itemKelas.value;
                            const dataKelas = groupedByKelas[namaKelas] || [];

                            return (
                                <div
                                    key={namaKelas}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500"
                                >
                                    {/* Header Kelas */}
                                    <div className="bg-green-600 px-4 py-2.5">
                                        <h3 className="text-sm font-black text-white tracking-wide">
                                            JADWAL KELAS {namaKelas}
                                        </h3>
                                    </div>

                                    {/* Kolom Hari */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-gray-50/30">
                                        {DAFTAR_HARI.map((hari) => {
                                            // Filter jadwal spesifik untuk hari, mapel, dan guru ini
                                            const jadwalHariIni = dataKelas
                                                .filter((j) => {
                                                    const matchHari =
                                                        (
                                                            j.hari || ""
                                                        ).toLowerCase() ===
                                                        hari.toLowerCase();
                                                    const matchMapel =
                                                        selectedMapel &&
                                                        selectedMapel !== "all"
                                                            ? String(
                                                                  j.mapel_id,
                                                              ) ===
                                                              String(
                                                                  selectedMapel,
                                                              )
                                                            : true;
                                                    const matchGuru =
                                                        selectedGuru &&
                                                        selectedGuru.value !==
                                                            "all"
                                                            ? String(
                                                                  j.nama_guru,
                                                              ) ===
                                                              String(
                                                                  selectedGuru.label,
                                                              )
                                                            : true;

                                                    return (
                                                        matchHari &&
                                                        matchMapel &&
                                                        matchGuru
                                                    );
                                                })
                                                .sort((a, b) =>
                                                    a.jam_mulai.localeCompare(
                                                        b.jam_mulai,
                                                    ),
                                                );

                                            return (
                                                <div
                                                    key={hari}
                                                    className="p-2.5 flex flex-col h-full"
                                                >
                                                    <h4 className="text-center font-extrabold text-green-800 uppercase text-xs mb-2 pb-1.5 border-b-2 border-green-200">
                                                        {hari}
                                                    </h4>

                                                    <div className="flex flex-col gap-1.5 flex-grow">
                                                        {jadwalHariIni.length >
                                                        0 ? (
                                                            jadwalHariIni.map(
                                                                (
                                                                    jadwal,
                                                                    idx,
                                                                ) => (
                                                                    <JadwalCard
                                                                        key={
                                                                            idx
                                                                        }
                                                                        jadwal={
                                                                            jadwal
                                                                        }
                                                                    />
                                                                ),
                                                            )
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full min-h-[60px]">
                                                                <span className="text-gray-300 font-medium text-[10px] uppercase tracking-widest">
                                                                    - Kosong -
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MODAL PDF */}
            <ModalPdf
                isOpen={openPdfModal}
                onClose={() => setOpenPdfModal(false)}
                pdfUrl={pdfUrl}
                title={titlePdf}
            />
        </>
    );
}
