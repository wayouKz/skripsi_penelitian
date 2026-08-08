import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Link } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import InformasiKelasDiAmpu from "./InformasiKelasDiAmpu";
import JurnalMengajar from "./JurnalMengajar";
import TabsMenus from "@/Components/TabMenus";
<<<<<<< HEAD
=======
import Dropdown from "@/Components/Dropdown";
import ModalPdf from "@/Components/ModalPdf";
>>>>>>> main

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
<<<<<<< HEAD
=======

    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Menutup dropdown ketika pengguna mengklik di luar area komponen
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
        setOpenDropdown(false); // Menutup dropdown secara pasti saat opsi diklik

        const pdfConfig = {
            absensi_pdf: {
                title: "Absensi" + " " + nama_kelas,
                routeName: "pdf.absensi_pdf",
            },
            raport_pdf: {
                title: "Raport Siswa" + " " + nama_kelas,
                routeName: "pdf.raport_pdf",
            },
            kartu_tugas_pdf: {
                title: "Jadwal Mengajar" + " " + nama_kelas,
                routeName: "pdf.kartu_tugas_pdf",
            },
        };

        const config = pdfConfig[type];

        if (config) {
            setOpenPdfModal({
                open: true, // Sesuaikan dengan properti ModalPdf Anda (bisa 'show' atau 'open')
                pdfUrl: route(config.routeName, {
                    kelas_id: kelasID,
                    tahun_ajaran_id: tahunAjaranId,
                }),
                title: config.title,
            });
        }
    };

>>>>>>> main
    return (
        <AuthenticatedLayout header={`Kelas ` + dataKelas?.nama_kelas}>
            <div className=" min-h-screen bg-gray-50/50">
                <div className="max-w-7xl mx-auto ">
                    {/* Header & Tombol Kembali */}
                    <div className="mb-8 flex items-center gap-4">
                        <Link
                            href={route("akademik.kelas-diampu.index")}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-all shadow-sm group"
                            title="Kembali ke Daftar Kelas"
                        >
                            <i className="fa fa-arrow-left transform group-hover:-translate-x-1 transition-transform"></i>
                        </Link>
                        <div className="flex-1">
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                Detail Kelas
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Informasi lengkap mengenai kelas{" "}
                                {dataKelas?.nama_kelas}
                            </p>
                        </div>
                    </div>

                    {/* Card Informasi Utama */}
                    <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden mb-6">
                        <div className="p-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
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
                                        className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                                    >
                                        <i className="fa fa-print"></i>
                                        Cetak
                                        <i
                                            className={`fa fa-chevron-down text-[10px] transition-transform duration-200 ${openDropdown ? "rotate-180" : ""}`}
                                        ></i>
                                    </button>

                                    {/* Menu Dropdown */}
                                    {openDropdown && (
                                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in duration-200">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Logika cetak PDF di sini
                                                    openPdf(
                                                        "raport_pdf",
                                                        dataKelas?.kelas_id,
                                                        dataKelas?.tahun_ajaran_id,
                                                        dataKelas?.nama_kelas,
                                                    );
                                                }}
                                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition-colors"
                                            >
                                                <i className="fa fa-file-pdf text-red-600 w-4"></i>{" "}
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
                                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition-colors"
                                            >
                                                <i className="fa fa-file-pdf text-red-600 w-4"></i>{" "}
                                                Cetak Absensi
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Logika cetak Excel di sini
                                                    openPdf(
                                                        "kartu_tugas_pdf",
                                                        dataKelas?.kelas_id,
                                                        dataKelas?.tahun_ajaran_id,
                                                        dataKelas?.nama_kelas,
                                                    );
                                                }}
                                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition-colors"
                                            >
                                                <i className="fa fa-file-pdf text-red-600 w-4"></i>{" "}
                                                Cetak Kartu Tugas
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Item 1: Nama Kelas */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                                    <div className="bg-green-100 text-green-600 p-2.5 rounded-lg">
                                        <i className="fa fa-chalkboard-teacher fa-fw"></i>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Nama Kelas
                                        </p>
                                        <p className="text-lg font-extrabold text-gray-900">
                                            {dataKelas?.nama_kelas || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 2: Tahun Ajaran */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                                    <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-lg">
                                        <i className="fa fa-calendar-alt fa-fw"></i>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Tahun Ajaran
                                        </p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {dataKelas?.tahun_ajaran || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 3: Semester */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                                    <div className="bg-green-100 text-green-600 p-2.5 rounded-lg">
                                        <i className="fa fa-bookmark fa-fw"></i>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Semester
                                        </p>
                                        <p className="text-lg font-bold text-gray-900 uppercase">
                                            {dataKelas?.semester || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 4: Wali Kelas */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                                    <div className="bg-amber-100 text-amber-600 p-2.5 rounded-lg">
                                        <i className="fa fa-user-tie fa-fw"></i>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Wali Kelas
                                        </p>
                                        <p className="text-md font-bold text-gray-900">
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
