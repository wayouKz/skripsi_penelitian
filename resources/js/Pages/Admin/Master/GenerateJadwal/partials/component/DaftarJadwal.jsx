import ModalPdf from "@/Components/ModalPdf";
import React, { useState } from "react";
import Select from "react-select";

export default function DaftarJadwal({
    historyJadwal,
    selectedTahunAjaran,
    selectedNamaTahunAjaran,
}) {
    // State untuk menyimpan kelas yang difilter. null atau "" = tampilkan semua
    const [selectedKelas, setSelectedKelas] = useState(null);
    const [openPdfModal, setOpenPdfModal] = useState(false);
    const daftarHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    if (!historyJadwal || historyJadwal.length === 0) return null;

    const groupedByKelas = historyJadwal.reduce((acc, curr) => {
        if (!acc[curr.nama_kelas]) acc[curr.nama_kelas] = [];
        acc[curr.nama_kelas].push(curr);
        return acc;
    }, {});

    // Array opsi untuk Select dengan tambahan "Semua Kelas" di urutan teratas
    const kelasList = [
        { value: "", label: "Semua Kelas" },
        ...Object.keys(groupedByKelas)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            .map((kelas) => ({
                value: kelas,
                label: kelas,
            })),
    ];

    // Filter daftar kelas berdasarkan pilihan user
    const filteredKelasList = selectedKelas
        ? kelasList.filter((item) => item.value === selectedKelas)
        : kelasList.filter((item) => item.value !== ""); // Jika null/kosong, tampilkan SEMUA kelas asli

    const params = {
        tahun_ajaran_id: historyJadwal[0]?.tahun_ajaran_id || null,
        kelas_id: selectedKelas || "all",
    };

    const pdfUrl = route("pdf.jadwal", params);

    const titlePdf = `Jadwal Pelajaran - ${selectedNamaTahunAjaran}  ${selectedKelas && selectedKelas !== "" ? ` - Kelas ${selectedKelas}` : " - Semua Kelas"}`;
    return (
        <>
            <div className="space-y-8">
                {/* BAGIAN FILTER KELAS */}
                <div className="max-w-full pb-3">
                    <div className="flex justify-between items-center gap-2 cursor-pointer">
                        {/* Dropdown React-Select */}
                        <div className="min-w-[220px]">
                            <Select
                                options={kelasList || []}
                                value={
                                    kelasList?.find(
                                        (opt) =>
                                            opt.value === (selectedKelas || ""),
                                    ) || null
                                }
                                onChange={(option) =>
                                    setSelectedKelas(
                                        option && option.value !== ""
                                            ? option.value
                                            : null,
                                    )
                                }
                                isSearchable={true}
                                isClearable={true}
                                placeholder="Pilih Kelas..."
                            />
                        </div>
                        <button
                            type="button"
                            className="mt-2 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                            onClick={() => setOpenPdfModal(true)}
                        >
                            <i className="fa fa-print"></i>
                        </button>
                    </div>
                </div>

                {/* BAGIAN RENDER JADWAL BERDASARKAN KELAS & HARI */}
                <div className="space-y-12">
                    <div className="min-h-[300px] overflow-y-auto space-y-6">
                        {filteredKelasList.map((itemKelas) => {
                            const namaKelas = itemKelas.value;
                            const dataKelas = groupedByKelas[namaKelas] || [];

                            return (
                                <div
                                    key={namaKelas}
                                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500"
                                >
                                    {/* Header Kelas */}
                                    <div className="bg-green-600 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-lg font-black text-white tracking-wide">
                                            JADWAL KELAS {namaKelas}
                                        </h3>
                                    </div>

                                    {/* Konten Grid Hari (List ke bawah per kolom) */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-gray-50/30">
                                        {daftarHari.map((hari) => {
                                            // Ambil dan urutkan jadwal untuk hari ini berdasarkan jam mulai
                                            const jadwalHariIni = dataKelas
                                                .filter(
                                                    (j) =>
                                                        j.hari.toLowerCase() ===
                                                        hari.toLowerCase(),
                                                )
                                                .sort((a, b) =>
                                                    a.jam_mulai.localeCompare(
                                                        b.jam_mulai,
                                                    ),
                                                );

                                            return (
                                                <div
                                                    key={hari}
                                                    className="p-4 flex flex-col h-full"
                                                >
                                                    {/* Header Hari */}
                                                    <h4 className="text-center font-extrabold text-green-800 uppercase text-sm mb-4 pb-2 border-b-2 border-green-200">
                                                        {hari}
                                                    </h4>

                                                    {/* List Jadwal */}
                                                    <div className="flex flex-col gap-3 flex-grow">
                                                        {jadwalHariIni.length >
                                                        0 ? (
                                                            jadwalHariIni.map(
                                                                (
                                                                    jadwal,
                                                                    idx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="flex flex-col bg-white border border-green-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                                                                    >
                                                                        <span className="inline-block bg-green-50 text-green-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-green-200 mb-1.5 w-max">
                                                                            {jadwal.jam_mulai.substring(
                                                                                0,
                                                                                5,
                                                                            )}{" "}
                                                                            -{" "}
                                                                            {jadwal.jam_selesai.substring(
                                                                                0,
                                                                                5,
                                                                            )}
                                                                        </span>
                                                                        <span className="font-bold text-gray-800 text-sm leading-tight mb-1">
                                                                            {
                                                                                jadwal.nama_mapel
                                                                            }
                                                                        </span>
                                                                        <span className="text-[11px] font-semibold text-green-600 mt-1 flex items-center gap-1.5">
                                                                            <i className="fa fa-user-circle text-green-400"></i>
                                                                            {
                                                                                jadwal.nama_guru
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full min-h-[100px]">
                                                                <span className="text-gray-300 font-medium text-xs uppercase tracking-widest text-center">
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
            <ModalPdf
                isOpen={openPdfModal}
                onClose={() => setOpenPdfModal(false)}
                pdfUrl={pdfUrl}
                title={titlePdf}
            />
        </>
    );
}
