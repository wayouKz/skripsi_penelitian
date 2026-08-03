import DataTable from "@/Components/Datatables";
import { useEffect, useState } from "react";

export default function Perwalian({ selectedTahunAjaran }) {
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
        { header: "Jenis Kelamin", accessor: "jenis_kelamin" },
        { header: "Tempat Lahir", accessor: "tempat_lahir" },
        { header: "Tanggal Lahir", accessor: "tanggal_lahir" },
    ];
    const getSiswa = () => {
        setLoading(true);
        axios
            .get(
                route("getData.get-siswa-perwalian", {
                    tahun_ajaran_id: selectedTahunAjaran,
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
    }, [selectedTahunAjaran]);
    return (
        <div className="space-y-12">
            {dataSiswa.length === 0 && !loading && (
                <div className="flex justify-center py-2">
                    <div className="text-center">
                        <i className="fas fa-user-friends text-4xl text-gray-300"></i>
                        <p className="mt-2 text-gray-500">
                            Tidak ada siswa yang menjadi perwalian anda.
                        </p>
                    </div>
                </div>
            )}
            {dataSiswa.length > 0 && (
                <DataTable
                    title={"Perwalian"}
                    columns={columns}
                    data={dataSiswa}
                    loading={loading}
                />
            )}
        </div>
    );
}
