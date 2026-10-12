import { useAlert } from "@/Components/AlertContext";
import DataTable from "@/Components/Datatables";
import { useEffect, useState } from "react";

export default function InformasiKelasDiAmpu({ dataKelas, activeTab }) {
    console.log(dataKelas);
    const { showAlert } = useAlert();
    const [dataSiswa, setDataSiswa] = useState([]);
    const [loading, setLoading] = useState(false);
    const columns = [
        // ... (Kolom tabel tetap sama seperti kode Anda sebelumnya)
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Foto",
            render: (row) => (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                    {row.foto != null ? (
                        <img
                            src={
                                row.foto
                                    ? `/storage/public/foto/${row.foto}`
                                    : "/default-avatar.png"
                            }
                            alt="Foto Siswa"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <i className="fas fa-user text-gray-400 text-xl"></i>
                    )}
                </div>
            ),
        },
        { header: "Nisn", accessor: "nisn" },
        { header: "Nama Siswa", accessor: "nama_siswa" },
    ];
    const getSiswa = () => {
        setLoading(true);
        axios
            .get(
                route("getData.getSiswaPerKelas", {
                    kelas_id: dataKelas.kelas_id,
                    tahun_ajaran_id: dataKelas.tahun_ajaran_id,
                    type: "informasi",
                }),
            )
            .then((res) => {
                setLoading(false);
                if (res.data.success == true) {
                    setDataSiswa(res.data.data);
                } else if (res.data.success == false) {
                    showAlert(res.data.msg, "info");
                }
            });
    };
    useEffect(() => {
        getSiswa();
    }, []);
    return (
        <div className="p-6">
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-800">
                    <i className="fa fa-users mr-2"></i> List Siswa{" "}
                    {dataKelas.nama_kelas}
                </h2>
            </div>
            <DataTable loading={loading} columns={columns} data={dataSiswa} />
        </div>
    );
}
