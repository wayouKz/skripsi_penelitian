import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import InformasiKelasDiAmpu from "./InformasiKelasDiAmpu";
import JurnalMengajar from "./JurnalMengajar";
import TabsMenus from "@/Components/TabMenus";

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
                        <div>
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
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <i className="fa fa-info-circle text-green-500"></i>
                                Informasi Umum Kelas
                            </h3>

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
        </AuthenticatedLayout>
    );
}
