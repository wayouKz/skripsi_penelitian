import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Link } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import InformasiKelasDiAmpu from "./InformasiKelasDiAmpu";
import JurnalMengajar from "./JurnalMengajar";
import TabsMenus from "@/Components/TabMenus";
import Dropdown from "@/Components/Dropdown";
import ModalPdf from "@/Components/ModalPdf";

export default function Detail({ dataKelas }) {
    const menus = [
        {
            nama_menu: "Informasi Siswa",
            component: <InformasiKelasDiAmpu dataKelas={dataKelas} />,
        },
        {
            nama_menu: "Jurnal Mengajar",
            component: <JurnalMengajar dataKelas={dataKelas} />,
        },
    ];

    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpenDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const [openPdfModal, setOpenPdfModal] = useState({
        open: false,
        url: "",
        title: "",
    });

    const openPdf = (type, kelasID, tahunAjaranId, nama_kelas) => {
        setOpenDropdown(false);

        const pdfConfig = {
            absensi_pdf: {
                title: "Absensi " + nama_kelas,
                routeName: "pdf.absensi_pdf",
            },
            raport_pdf: {
                title: "Raport Siswa " + nama_kelas,
                routeName: "pdf.raport_pdf",
            },
            kartu_tugas_pdf: {
                title: "Jadwal Mengajar " + nama_kelas,
                routeName: "pdf.kartu_tugas_pdf",
            },
        };

        const config = pdfConfig[type];

        if (config) {
            setOpenPdfModal({
                open: true,
                pdfUrl: route(config.routeName, {
                    kelas_id: kelasID,
                    tahun_ajaran_id: tahunAjaranId,
                }),
                title: config.title,
            });
        }
    };

    return (
        <AuthenticatedLayout header={`Kelas ${dataKelas?.nama_kelas || ""}`}>
            <div className="py-6 min-h-screen bg-gray-50/50 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header & Tombol Kembali */}
                    <div className="mb-4 flex items-center gap-3">
                        <Link
                            href={route("akademik.kelas-diampu.index")}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-all shadow-2xs group"
                            title="Kembali ke Daftar Kelas"
                        >
                            <i className="fa fa-arrow-left text-xs transform group-hover:-translate-x-0.5 transition-transform"></i>
                        </Link>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                                Detail Kelas
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Informasi lengkap mengenai kelas{" "}
                                {dataKelas?.nama_kelas}
                            </p>
                        </div>
                    </div>

                    {/* Card Informasi Utama */}
                    <div className="bg-white shadow-2xs border border-gray-200 rounded-xl overflow-hidden mb-4">
                        <div className="p-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                    <i className="fa fa-info-circle text-green-500"></i>
                                    Informasi Umum Kelas
                                </h3>
                                <div
                                    className="relative inline-block text-left"
                                    ref={dropdownRef}
                                >
                                    {/* Tombol Utama */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(!openDropdown)
                                        }
                                        className="bg-red-600 hover:bg-red-700 text-white py-1 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                    >
                                        <i className="fa fa-print text-[10px]"></i>
                                        Cetak
                                        <i
                                            className={`fa fa-chevron-down text-[9px] transition-transform duration-200 ${openDropdown ? "rotate-180" : ""}`}
                                        ></i>
                                    </button>

                                    {/* Menu Dropdown */}
                                    {openDropdown && (
                                        <div className="absolute right-0 mt-1.5 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in duration-200">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    openPdf(
                                                        "raport_pdf",
                                                        dataKelas?.kelas_id,
                                                        dataKelas?.tahun_ajaran_id,
                                                        dataKelas?.nama_kelas,
                                                    );
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                                            >
                                                <i className="fa fa-file-pdf text-red-600 w-3.5"></i>
                                                Cetak Raport
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    openPdf(
                                                        "absensi_pdf",
                                                        dataKelas?.kelas_id,
                                                        dataKelas?.tahun_ajaran_id,
                                                        dataKelas?.nama_kelas,
                                                    );
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                                            >
                                                <i className="fa fa-file-pdf text-red-600 w-3.5"></i>
                                                Cetak Absensi
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    openPdf(
                                                        "kartu_tugas_pdf",
                                                        dataKelas?.kelas_id,
                                                        dataKelas?.tahun_ajaran_id,
                                                        dataKelas?.nama_kelas,
                                                    );
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                                            >
                                                <i className="fa fa-file-pdf text-red-600 w-3.5"></i>
                                                Cetak Kartu Tugas
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Item 1: Nama Kelas */}
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-2.5">
                                    <div className="bg-green-100 text-green-600 p-2 rounded-md">
                                        <i className="fa fa-chalkboard-teacher fa-fw text-xs"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                            Nama Kelas
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {dataKelas?.nama_kelas || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 2: Tahun Ajaran */}
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-2.5">
                                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-md">
                                        <i className="fa fa-calendar-alt fa-fw text-xs"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                            Tahun Ajaran
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {dataKelas?.tahun_ajaran || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 3: Semester */}
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-2.5">
                                    <div className="bg-green-100 text-green-600 p-2 rounded-md">
                                        <i className="fa fa-bookmark fa-fw text-xs"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                            Semester
                                        </p>
                                        <p className="text-sm font-bold text-gray-900 uppercase">
                                            {dataKelas?.semester || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 4: Wali Kelas */}
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-2.5">
                                    <div className="bg-amber-100 text-amber-600 p-2 rounded-md">
                                        <i className="fa fa-user-tie fa-fw text-xs"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                            Wali Kelas
                                        </p>
                                        <p className="text-xs font-bold text-gray-900">
                                            {dataKelas?.nama_perwalian || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <TabsMenus menus={menus} />
                </div>
            </div>

            <ModalPdf
                isOpen={openPdfModal.open}
                onClose={() =>
                    setOpenPdfModal({ ...openPdfModal, open: false })
                }
                pdfUrl={openPdfModal.pdfUrl}
                title={openPdfModal.title}
            />
        </AuthenticatedLayout>
    );
}
