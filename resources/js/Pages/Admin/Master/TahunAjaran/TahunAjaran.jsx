import { useAlert } from "@/Components/AlertContext";
import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useRef, useState } from "react";
import Add from "./Add";
import Switch from "@/Components/Switch";
import ActionDropdown from "@/Components/ActionDropdown";
import Modal from "@/Components/Modal";

export default function TahunAjaran() {
    const { showAlert, showCenterAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [Result, setResult] = useState([]);
    const [show, setShow] = useState(false);
    const [TA, setTA] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [openModalResponse, setOpenModalResponse] = useState(false);
    const [selectedTA, setSelectedTA] = useState(null);
    const [isImporting, setImporting] = useState(false); // State untuk menandai proses import
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
            header: "Tahun Ajaran",
            accessor: "tahun_ajaran",
        },
        {
            header: "Semester",
            render: (row) => {
                if (row.semester == "ganjil") {
                    return "Ganjil";
                } else {
                    return "Genap";
                }
            },
        },
        {
            header: "Aktif",
            accessor: "status",
            render: (row) => (
                <Switch
                    checked={row.status == "active" ? true : false}
                    onChange={() => handleStatus(row)}
                />
            ),
        },

        {
            header: "#",
            accessor: "id", // boleh apa saja, asal ada di row
            render: (row) => (
                <ActionDropdown
                    actions={[
                        {
                            edit: true,
                            label: "Edit",
                            icon: "edit",
                            onClick: () => handleEdit(row),
                        },
                        {
                            edit: false,
                            label: "Import SK ",
                            icon: "upload",
                            // Tambahkan fungsi onClick di bawah ini
                            onClick: () => handleImportSK(row),
                        },
                    ]}
                />
            ),
        },
    ];

    const fileInputRef = useRef(null);
    const handleImportSK = (row) => {
        fileInputRef.current.click();

        setSelectedTA(row.id);
    };

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isImporting) {
                event.preventDefault();
                event.returnValue = ""; // Baris ini wajib ada untuk Chrome & Edge modern
            }
        };

        if (isImporting) {
            window.addEventListener("beforeunload", handleBeforeUnload);
        }

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isImporting]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("tahun_ajaran_id", selectedTA);
        // Opsional: Reset state progress bar di sini menjadi 0%
        setProgress(0);
        setStatusMessage("Memulai import...");
        setOpenModalResponse(true);
        setImporting(true);
        try {
            // Ambil CSRF Token jika Anda menggunakan session Laravel (Blade/Inertia)
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");

            const response = await fetch(
                route("master.tahun-ajaran.import-sk"),
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        Accept: "text/event-stream",
                        "X-CSRF-TOKEN": csrfToken || "",
                        // Catatan: Jangan set "Content-Type" secara manual saat pakai FormData
                    },
                },
            );

            if (!response.body) {
                throw new Error("Browser Anda tidak mendukung ReadableStream.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n\n"); // Memecah berdasarkan enter ganda dari PHP

                lines.forEach((line) => {
                    if (line.startsWith("data: ")) {
                        try {
                            // Parse JSON dari server
                            const data = JSON.parse(line.replace("data: ", ""));

                            // --- UPDATE UI PROGRESS DI SINI ---
                            // Contoh jika Anda pakai Vue/React state:
                            setProgress(data.progress);
                            setStatusMessage(data.message);
                            console.log(
                                `Progress: ${data.progress}% - ${data.message}`,
                            );

                            // Cek jika proses dari server sudah menyertakan status done: true
                            if (data.done) {
                                showAlert("Data berhasil diimport!", "success");
                                getGuru(); // Refresh tabel/data guru

                                // Reset input file agar bisa digunakan lagi
                                event.target.value = null;
                            }
                        } catch (e) {
                            console.error("Gagal membaca chunk data:", e);
                        }
                    }
                });
            }

            setImporting(false);
        } catch (error) {
            console.error("Gagal melakukan import:", error);
            showAlert("Terjadi kesalahan saat memproses file.", "error");
            event.target.value = null;
            setOpenModalResponse(false);
        }
    };
    const cekSiswa = async () => {
        const response = await axios.get(route("getData.cek-siswa"));
        if (response.data.success == false) {
            showCenterAlert(response.data.message, "warning", 3000);
        } else {
            handleTambah();
        }
    };
    const getTahunAjaran = async () => {
        setLoading(true);
        await axios
            .get(route("master.tahun-ajaran.getTahunAjaran"))
            .then((res) => {
                if (res.data.status == false) {
                    seResult([]);
                } else {
                    setResult(res.data.data);
                    setLoading(false);
                }
            });
    };
    const handleStatus = () => {
        showAlert(
            "Data Akan Secara Otomatis Di Nonaktifkan Jika Ada Tahun Ajaran Yang Baru Di Tambahkan",
            "warning",
        );
    };
    useEffect(() => {
        getTahunAjaran();
    }, []);

    const handleTambah = () => {
        setShow(true);
        setIsEdit(false);
    };

    const handleEdit = (row) => {
        setShow(true);
        setIsEdit(true);
        setTA(row);
    };

    return (
        <AuthenticatedLayout header="Tahun Ajaran">
            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-end">
                    <PrimaryButton
                        className="mb-2"
                        onClick={() => {
                            cekSiswa();
                        }}
                    >
                        + Tambah Tahun Ajaran
                    </PrimaryButton>
                </div>
                <DataTable
                    columns={columns}
                    data={Result}
                    title={"TAHUN AJARAN"}
                    searchable={true}
                    loading={loading}
                />
            </div>
            <Add
                isEdit={isEdit}
                open={show}
                setOpen={setShow}
                getTahunAjaran={getTahunAjaran}
                TahunAjaran={TA}
                loading={loading}
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                style={{ display: "none" }}
            />
            <Modal
                maxWidth="2xl"
                show={openModalResponse}
                // Hanya izinkan tutup modal jika belum mulai (0) atau sudah selesai (100)
                onClose={() => {
                    if (progress === 100 || progress === 0) {
                        setOpenModalResponse(false);
                    }
                }}
                closeable={false}
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                        Proses Import SK
                    </h2>
                    <small className="text-red-600 mb-4 block text-center rounded-lg bg-red-100 p-2">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Perhatian!!! <br /> Mohon jangan menutup jendela ini
                        sampai proses selesai. Proses ini mungkin memakan waktu
                        beberapa saat tergantung ukuran file!
                    </small>
                    {/* Container Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-5 mb-3 relative overflow-hidden">
                        {/* Indikator Bar */}
                        <div
                            className="bg-green-500 h-5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>

                        {/* Teks Persentase (Ditengah) */}
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                            {progress > 0 ? `${progress}%` : "0%"}
                        </div>
                    </div>

                    {/* Pesan Status */}
                    <p className="text-sm text-gray-600 text-center min-h-[20px]">
                        {statusMessage ||
                            "Harap tunggu, proses sedang berjalan...,Jangan menutup jendela ini."}
                    </p>

                    {/* Tombol Tutup (Hanya muncul saat progress sudah 100%) */}
                    {progress === 100 && (
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => setOpenModalResponse(false)}
                                className="px-6 py-2 bg-green-500 text-white text-sm font-semibold rounded-md shadow hover:bg-gray-700 transition-colors"
                            >
                                Tutup & Selesai
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
