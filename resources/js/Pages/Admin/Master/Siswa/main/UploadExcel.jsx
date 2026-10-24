import { useAlert } from "@/Components/AlertContext";
import AppSelect from "@/Components/AppSelect";
import PrimaryButton from "@/Components/PrimaryButton";
import { useEffect, useRef, useState } from "react";
import Select from "react-select";

export default function UploadExcel({ openImport, setOpenImport, getSiswa }) {
    const { showCenterAlert } = useAlert();
    const [dataTahunAjaran, setDataTahunAjaran] = useState([]);
    const [tahunAjaran, setTahunAjaran] = useState(null);
    const uploadExcel = useRef(null);
    const [prosessImport, setProsessImport] = useState(false);
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [streamMessage, setStreamMessage] = useState(
        "Sedang memproses data Excel...",
    );
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: "#F9FAFB",
            borderColor: state.isFocused ? "#10B981" : "#D1D5DB",
            borderRadius: "0.5rem",
            minHeight: "36px",
            padding: "0 2px",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: "pointer",
            "&:hover": {
                borderColor: "#10B981",
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 6px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "0.875rem",
            fontWeight: "500",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "0.875rem",
            fontWeight: "600",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#10B981"
                : state.isFocused
                  ? "#ECFDF5"
                  : "white",
            color: state.isSelected ? "white" : "#1F2937",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

    const handleClick = () => {
        uploadExcel.current.click();
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile); // Simpan objek file
            setFileName(selectedFile.name); // Simpan nama file untuk tampilan UI
        }
    };
    // Pastikan state ini sudah ditambahkan di awal komponen
    // const [progress, setProgress] = useState(0);

    const handleImport = async () => {
        if (!file) {
            showCenterAlert("Pilih file terlebih dahulu", "warning");
            return;
        }

        setProsessImport(true);
        setStreamMessage("Memulai proses unggah...");
        setProgress(0); // Reset progress ke 0 setiap kali mulai

        const formData = new FormData();
        formData.append("fileExcel", file);
        formData.append("tahun_ajaran_id", tahunAjaran);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");

            const response = await fetch(route("master.siswa.import-siswa"), {
                method: "POST",
                body: formData,
                headers: {
                    Accept: "application/json, text/plain, */*",
                    ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
                },
            });

            if (!response.ok) throw new Error("Gagal merespons dari server");
            if (!response.body)
                throw new Error("ReadableStream tidak didukung");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    const chunk = decoder.decode(value, { stream: true });

                    // Pisahkan data berdasarkan baris baru (\n) karena chunk bisa berisi gabungan beberapa respons
                    const lines = chunk.split("\n");

                    lines.forEach((line) => {
                        if (line.trim()) {
                            try {
                                // Mencoba mem-parsing data stream sebagai JSON
                                const data = JSON.parse(line);
                                if (data.status === "error") {
                                    showCenterAlert(data.message, "error");
                                } else if (data.status === "success") {
                                    setStreamMessage(data.message);
                                }
                                if (data.progress !== undefined)
                                    setProgress(data.progress);
                            } catch (e) {
                                // Jika gagal di-parse sebagai JSON, anggap sebagai plain text biasa
                                setStreamMessage(line);
                            }
                        }
                    });
                }
            }
            getSiswa();
            setOpenImport(false);
            setFile(null);
            setFileName("");
        } catch (error) {
            console.error("Gagal import:", error);
            showCenterAlert(error.message, "error");
        } finally {
            setProsessImport(false);
            setProgress(0); // Bersihkan progress setelah selesai
        }
    };
    const [fileName, setFileName] = useState("");
    useEffect(() => {
        if (openImport) {
            getTahunAjaran();
        }
    }, [openImport]);
    const getTahunAjaran = async () => {
        try {
            const res = await axios.get(route("getData.get-tahun-ajaran"));
            const data = res.data.data;

            setDataTahunAjaran(data);

            if (data.length > 0 && !tahunAjaran) {
                const activeTahun = data.find(
                    (tahun) => tahun.status === "active",
                );
                if (activeTahun) {
                    setTahunAjaran(activeTahun.value);
                } else {
                    setTahunAjaran(data[0].id || data[0].value);
                }
            }
        } catch (error) {
            console.error("Gagal mengambil data tahun ajaran:", error);
        }
    };
    const tahunAjaranOptions = (dataTahunAjaran || []).map((tahun) => ({
        value: tahun.id || tahun.value,
        label: `${tahun.tahun_ajaran || tahun.label}${
            tahun.status === "active" ? " (Aktif)" : ""
        }`,
    }));
    const selectedTaOption =
        tahunAjaranOptions.find(
            (opt) => String(opt.value) === String(tahunAjaran),
        ) || null;
    return (
        <div className="p-2 space-y-2">
            <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
                <i className="fa fa-calendar-alt mr-2 text-primary-500"></i>
                Tahun Ajaran:
            </label>
            <div className="w-full ">
                <AppSelect
                    value={selectedTaOption}
                    onChange={(option) =>
                        setTahunAjaran(option ? option.value : "")
                    }
                    options={tahunAjaranOptions}
                    placeholder="[Pilih Tahun Ajaran]"
                    isSearchable={true}
                    menuPortalTarget={document.body}
                    className="text-sm"
                    classNamePrefix="react-select"
                />
            </div>
            {prosessImport == false ? (
                <div className="w-full">
                    {/* Input disembunyikan menggunakan class 'hidden' */}
                    <input
                        type="file"
                        accept=".xls, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        className="hidden"
                        ref={uploadExcel}
                        onChange={handleFileChange}
                    />

                    {/* Tampilan UI yang bisa diklik */}
                    <div
                        onClick={handleClick}
                        className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <svg
                            className="w-12 h-12 text-primary-600 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                        </svg>

                        <span className="text-gray-700 font-medium">
                            {fileName
                                ? fileName
                                : "Klik untuk memilih file Excel"}
                        </span>

                        {!fileName && (
                            <span className="text-sm text-gray-500 mt-1">
                                Format yang didukung: .xls, .xlsx
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <svg
                        className="animate-spin h-8 w-8 text-primary-600 mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>

                    {/* Komponen Progress Bar */}
                    <div className="w-full max-w-xs mt-4">
                        <div className="flex justify-between text-xs font-semibold text-primary-600 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end m-2">
                <PrimaryButton onClick={() => handleImport()}>
                    Import
                </PrimaryButton>
            </div>
        </div>
    );
}
