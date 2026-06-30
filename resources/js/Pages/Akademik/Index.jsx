import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import TabMenus from "@/Components/TabMenus";
import KelasDiAmpu from "./KelasDiAmpu/KelasDiAmpu";
import JadwalMengajarAnda from "./Jadwal/JadwalMengajar";
export default function Akademik() {
    const [menu, setMenu] = useState();

    const menus = [
        {
            value: "kelas-diampu",
            nama_menu: "Kelas Diampu",
            component: <KelasDiAmpu />,
        },
        {
            value: "jadwal-mengajar",
            nama_menu: "Jadwal Mengajar Anda",
            component: <JadwalMengajarAnda />,
        },
    ];
    return (
        <AuthenticatedLayout header="Akademik">
            <TabMenus menus={menus} />
        </AuthenticatedLayout>
    );
}
