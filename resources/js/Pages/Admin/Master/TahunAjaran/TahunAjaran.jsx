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
    const [isImporting, setImporting] = useState(false);

    const columns = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
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
            render: (row) => (row.semester == "ganjil" ? "Ganjil" : "Genap"),
        },

        {
            header: "#",
            accessor: "id",
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
                            label: "Import SK",
                            icon: "upload",
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
                event.returnValue = "";
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

        setProgress(0);
        setStatusMessage("Memulai import...");
        setOpenModalResponse(true);
        setImporting(true);

        try {
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
                    },
                },
            );

            if (!response.body) {
                throw new Error("Browser Anda tidak mendukung ReadableStream.");
            }

            const status = response.status;
            if (status !== 200) {
                setOpenModalResponse(false);
                setImporting(false);
                showAlert(
                    response.message ||
                        "Terjadi kesalahan saat memproses file.",
                    "error",
                );
                event.target.value = null;
                return;
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n\n");

                lines.forEach((line) => {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.replace("data: ", ""));
                            setProgress(data.progress);
                            setStatusMessage(data.message);

                            if (data.done) {
                                showAlert("Data berhasil diimport!", "success");
                                getTahunAjaran();
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
            setImporting(false);
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
                    setResult([]);
                } else {
                    setResult(res.data.data);
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
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
            <div className="bg-white shadow sm:rounded-lg p-4 sm:p-6">
                <div className="flex justify-end mb-3">
                    <PrimaryButton size="sm" onClick={() => cekSiswa()}>
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
                maxWidth="md"
                show={openModalResponse}
                onClose={() => {
                    if (progress === 100 || progress === 0) {
                        setOpenModalResponse(false);
                    }
                }}
                closeable={false}
            >
                <div className="p-4 sm:p-5">
                    <h3 className="text-base font-semibold text-gray-800 mb-2 text-center">
                        Proses Import SK
                    </h3>

                    <p className="text-xs text-red-600 mb-3 text-center bg-red-50 border border-red-100 p-2 rounded-md">
                        <span className="font-bold">Perhatian:</span> Mohon
                        jangan menutup jendela ini sampai proses selesai.
                    </p>

                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2 relative overflow-hidden">
                        <div
                            className="bg-green-500 h-4 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                            {progress > 0 ? `${progress}%` : "0%"}
                        </div>
                    </div>

                    <p className="text-xs text-gray-600 text-center min-h-[18px] mb-4">
                        {statusMessage ||
                            "Harap tunggu, proses sedang berjalan..."}
                    </p>

                    {progress === 100 && (
                        <div className="flex justify-center">
                            <button
                                onClick={() => setOpenModalResponse(false)}
                                className="px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded shadow hover:bg-green-700 transition-colors"
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
