import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TabMenus from "@/Components/TabMenus";
import KelasDiAmpu from "./KelasDiAmpu/KelasDiAmpu";
import JadwalMengajarAnda from "./Jadwal/JadwalMengajar";
import Perwalian from "./Perwalian/Perwalian";
import { useEffect, useState } from "react";
import InputLabel from "@/Components/InputLabel";

export default function Akademik() {
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("");
    const [namaTahunAjaran, setNamaTahunAjaran] = useState("");
    const [tahunAjaran, setTahunAjaran] = useState([]);

    const fetchTahunAjaran = async () => {
        try {
            const response = await axios.get(route("getData.get-tahun-ajaran"));
            if (response.data.success === true) {
                const dataTahun = response.data.data;
                setTahunAjaran(dataTahun);

                const activeTahun = dataTahun.find(
                    (t) => t.status === "active",
                );

                if (activeTahun) {
                    setSelectedTahunAjaran(activeTahun.value);
                    // Set initial namaTahunAjaran so it isn't blank on load
                    setNamaTahunAjaran(activeTahun.label);
                }
            } else {
                setTahunAjaran([]);
            }
        } catch (error) {
            console.error("Gagal mengambil data tahun ajaran:", error);
            setTahunAjaran([]);
        }
    };

    useEffect(() => {
        fetchTahunAjaran();
    }, []);

    const menus = [
        {
            value: "kelas-diampu",
            nama_menu: "Kelas Diampu",
            component: (
                <KelasDiAmpu
                    selectedTahunAjaran={selectedTahunAjaran}
                    setSelectedTahunAjaran={setSelectedTahunAjaran}
                    tahunAjaran={tahunAjaran}
                />
            ),
            icon: "door-open",
        },
        {
            value: "jadwal-mengajar",
            nama_menu: "Jadwal Mengajar Anda",
            component: (
                <JadwalMengajarAnda
                    selectedNamaTahunAjaran={namaTahunAjaran}
                    selectedTahunAjaran={selectedTahunAjaran}
                />
            ),
            icon: "calendar-alt",
        },
        {
            value: "kelas-perwalian",
            nama_menu: "Kelas Perwalian",
            component: <Perwalian selectedTahunAjaran={selectedTahunAjaran} />,
            icon: "users",
        },
    ];

    return (
        <AuthenticatedLayout header="Akademik">
            <div className="flex justify-end mb-2">
                <div className="w-52">
                    <InputLabel value="Tahun Ajaran" />
                    <select
                        value={selectedTahunAjaran}
                        onChange={(e) => {
                            setSelectedTahunAjaran(e.target.value);
                            setNamaTahunAjaran(
                                e.target.options[e.target.selectedIndex].text,
                            );
                        }}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                    >
                        <option value="">[Pilih Tahun Ajaran]</option>
                        {tahunAjaran?.map((tahun) => (
                            <option key={tahun.value} value={tahun.value}>
                                {tahun.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <TabMenus menus={menus} />
        </AuthenticatedLayout>
    );
}
