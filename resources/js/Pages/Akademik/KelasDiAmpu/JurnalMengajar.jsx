import DataTable from "@/Components/Datatables";
import Menu from "@/Components/Menu";
import { useState } from "react";
import JadwalMengajar from "./tab/JadwalMengajar";
import Absensi from "./tab/Absensi";

export default function JurnalMengajar({ dataKelas }) {
    const [menus, setMenu] = useState("jadwal");
    const columns = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Hari",
            render: (row) => <span>{row.hari}</span>,
        },
        {
            header: "Jam",
            render: (row) => <span>{row.jam}</span>,
        },
    ];

    const menu = [
        {
            value: "jadwal",
            nama_menu: "Jadwal Mengajar",
        },
        {
            value: "absensi",
            nama_menu: "Absensi",
        },
        {
            value: "penilaian",
            nama_menu: "Penilaian",
        },
    ];
    return (
        <div className="flex flex-col md:flex-row  items-start  md:p-0">
            <Menu menus={menu} setMenu={setMenu} menu={menus} />
            <div className="flex-1 min-w-0 md:ml-4 w-full mt-4 md:mt-0">
                <div className="bg-white rounded-lg shadow overflow-hidden p-2">
                    {menus === "jadwal" && (
                        <JadwalMengajar dataKelas={dataKelas} />
                    )}
                    {menus === "absensi" && <Absensi dataKelas={dataKelas} />}
                </div>
            </div>
        </div>
    );
}
