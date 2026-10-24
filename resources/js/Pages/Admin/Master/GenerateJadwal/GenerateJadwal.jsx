import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import {
    Settings,
    Cpu,
    Calendar,
    CheckCircle2,
    Play,
    Sliders,
    Search,
    Sun,
    History,
    AlertCircle,
    CalendarDays,
    BookOpen,
    Library,
    Clock,
    Plus,
    Trash2,
} from "lucide-react";
import axios from "axios";
import Configurasi from "./partials/Configurasi";
import Proses from "./partials/Proses";
import HistoryJadwal from "./partials/HistoryJadwal";
import Menu from "@/Components/Menu";
import { useAlert } from "@/Components/AlertContext";
import AppSelect from "@/Components/AppSelect";
// Fungsi darurat untuk menebak slot urutan jam ke-berapa
// berdasarkan jam_mulai dan hari.
// SILAKAN SESUAIKAN JAM-JAM DI BAWAH INI DENGAN BEL SEKOLAH ANDA!

export default function GenerateJadwal() {
    // 1. State Data Master
    const [listMapelGuru, setListMapelGuru] = useState([]);

    // 2. State Tahun Ajaran & History
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);
    const [historyJadwal, setHistoryJadwal] = useState([]);
    const [selectedNamaTahunAjaran, setSelectedNamaTahunAjaran] = useState("");

    const [resetButton, setResetButton] = useState(false);
    // 3. State UI & GA
    const [activeTab, setActiveTab] = useState("konfigurasi");
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    // 4. State Kustomisasi Guru & Prioritas Kelas
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPrioritas, setSelectedPrioritas] = useState([]); // Menyimpan NIP_KelasID
    const [generation, setGeneration] = useState(0);
    const [fitness, setFitness] = useState(0);
    const [logs, setLogs] = useState([]);

    const [openView, setOpenView] = useState(false);

    const { showCenterAlert, showAlert } = useAlert();
    const [newKromosom, setNewKromosom] = useState({});

    const fetchDataTa = async () => {
        try {
            const response = await axios.get(route("getData.get-tahun-ajaran"));
            setTahunAjaranList(response.data.data);
        } catch (error) {
            showAlert("Terjadi Kesalahan", "error");
        }
    };
    useEffect(() => {
        if (progress != 0) {
            const handleBeforeUnload = (e) => {
                e.preventDefault();
                e.returnValue =
                    "Proses penjadwalan sedang berjalan. Jangan refresh atau pindah menu agar data tidak rusak!";
                return e.returnValue;
            };

            window.addEventListener("beforeunload", handleBeforeUnload);
            return () => {
                window.removeEventListener("beforeunload", handleBeforeUnload);
            };
        }
    }, []);
    // 5. Fetch Data API Awal
    const fetchDataAwal = async () => {
        try {
            const [dataGuru, DataJadwal] = await Promise.all([
                axios.get(route("getData.get-mapel-guru"), {
                    params: { tahun_ajaran_id: selectedTahunAjaran },
                }),
                axios.get(route("getData.get-history-jadwal"), {
                    params: { tahun_ajaran_id: selectedTahunAjaran },
                }),
            ]);

            setListMapelGuru(dataGuru.data.data);
            setHistoryJadwal(DataJadwal.data.data || []);

            const guruList = dataGuru.data.data;

            guruList.forEach((data) => {
                if (data.guru.length < 0) {
                    showCenterAlert(
                        "Tidak ada data guru pada tahun ajaran ini! Silahkan Kelola guru mata pelajaran terlebih dahulu.",
                        "warning",
                        4000,
                    );
                }
            });
        } catch (error) {
            showCenterAlert(
                "Gagal mengambil data inisial. Silakan coba lagi.",
                "error",
                2000,
            );
        }
    };

    useEffect(() => {
        fetchDataTa();
    }, [activeTab]);

    useEffect(() => {
        if (selectedTahunAjaran) {
            fetchDataAwal();
        }
    }, [selectedTahunAjaran]);

    useEffect(() => {
        if (selectedTahunAjaran && tahunAjaranList) {
            const found = tahunAjaranList.find(
                (ta) => String(ta.value) === String(selectedTahunAjaran),
            );
            if (found) {
                setSelectedNamaTahunAjaran(found.label);
            }
        }
    }, [selectedTahunAjaran, tahunAjaranList]);

    const menu = [
        {
            nama_menu: "Konfigurasi",
            value: "konfigurasi",
        },
        {
            nama_menu: "History",
            value: "history",
        },
    ];
    const onMaximize = () => {
        setActiveTab("konfigurasi");
        setOpenView(true);
    };
    const filteredTahunAjaranOptions = [
        // 1. Tambahkan opsi default di indeks pertama (paling atas)
        {
            value: "",
            label: "[Pilih Tahun Ajaran]",
        },
        // 2. Masukkan sisa data yang sudah di-filter
        ...tahunAjaranList.filter(
            (ta) => String(ta.value).toLowerCase() !== "all",
        ),
    ];

    const selectedTahunAjaranOption =
        filteredTahunAjaranOptions.find(
            (opt) => String(opt.value) === String(selectedTahunAjaran),
        ) || null;
    const showMinimizedWidget = isGenerating && activeTab !== "proses";
    console.log(isGenerating, activeTab);
    return (
        <AuthenticatedLayout header="Generate Jadwal Mengajar (Algoritma Genetika)">
            <Head title="Generate Jadwal" />

            <div className="">
                {/* <div className="flex gap-2"> */}
                {/* <div className="m-2">
                    <Menu
                        menus={menu}
                        setMenu={setActiveTab}
                        menu={activeTab}
                    />
                </div> */}
                {/* {selectedTahunAjaran && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-3xl shadow-sm p-4 sm:p-8 flex flex-col sm:flex-row items-start gap-4">
                        <div className="flex-shrink-0 bg-yellow-100 p-2 rounded-full">
                            <svg
                                className="w-6 h-6 text-yellow-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <div>
                            <h4 className="text-base font-semibold text-yellow-800 mb-1">
                                Peringatan Penting
                            </h4>
                            <p className="text-sm text-yellow-700 leading-relaxed">
                                Pastikan semua guru mata pelajaran sudah
                                dikonfigurasi dengan benar agar jadwal yang
                                dihasilkan sesuai dengan harapan.
                            </p>
                        </div>
                    </div>
                )} */}

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-8 min-h-[500px] w-full">
                    <div className="relative mb-2 overflow-hidden bg-gradient-to-br from-primary-50 to-white border border-primary-100 p-4 rounded-xl shadow-sm">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-100 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between relative z-10">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 mb-0.5">
                                    Tahun Ajaran & Semester
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Tentukan periode aktif untuk jadwal yang
                                    akan digenerate.
                                </p>
                            </div>
                            <div className="w-full md:w-72 flex gap-2 items-center">
                                <AppSelect
                                    value={selectedTahunAjaranOption}
                                    onChange={(option) => {
                                        setSelectedTahunAjaran(
                                            option ? option.value : "",
                                        );
                                        setSelectedNamaTahunAjaran(
                                            option ? option.label : "",
                                        );
                                    }}
                                    options={filteredTahunAjaranOptions}
                                    placeholder="-- Pilih Tahun Ajaran --"
                                    isSearchable={true}
                                    menuPortalTarget={document.body}
                                    className="w-full text-xs"
                                    classNamePrefix="react-select"
                                />
                                <button
                                    type="button"
                                    onClick={setActiveTab.bind(null, "history")}
                                    className={
                                        "py-2 px-2 bg-primary-500 text-xs text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 " +
                                        (activeTab === "history"
                                            ? "hidden"
                                            : "")
                                    }
                                >
                                    <i className="fa fa-history"></i> Jadwal
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeTab === "konfigurasi" && (
                        <Configurasi
                            tahunAjaranList={tahunAjaranList}
                            selectedTahunAjaran={selectedTahunAjaran}
                            selectedNamaTahunAjaran={selectedNamaTahunAjaran}
                            setSelectedTahunAjaran={setSelectedTahunAjaran}
                            setSelectedNamaTahunAjaran={
                                setSelectedNamaTahunAjaran
                            }
                            selectedPrioritas={selectedPrioritas}
                            setSelectedPrioritas={setSelectedPrioritas}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            listMapelGuru={listMapelGuru}
                            setListMapelGuru={setListMapelGuru}
                            historyJadwal={historyJadwal}
                            progress={progress}
                            setProgress={setProgress}
                            setIsGenerating={setIsGenerating}
                            isGenerating={isGenerating}
                            setActiveTab={setActiveTab}
                            activeTab={activeTab}
                            setGeneration={setGeneration}
                            setFitness={setFitness}
                            setLogs={setLogs}
                            fetchDataAwal={fetchDataAwal}
                            openView={openView}
                            setOpenView={setOpenView}
                            setNewKromosom={setNewKromosom}
                            newKromosom={newKromosom}
                        />
                    )}

                    {activeTab === "proses" && (
                        <Proses
                            progress={progress}
                            setProgress={setProgress}
                            resetButton={resetButton}
                            generation={generation}
                            fitness={fitness}
                            logs={logs}
                            isGenerating={isGenerating}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            openView={openView}
                            setOpenView={setOpenView}
                        />
                    )}
                    {activeTab === "hasil" && (
                        <div className="space-y-6 text-center py-20 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-100">
                                <CheckCircle2
                                    className="text-primary-500"
                                    size={56}
                                    strokeWidth={2.5}
                                />
                            </div>
                            <h3 className="text-3xl font-black text-gray-800 mb-2">
                                Yeay! Jadwal Berhasil Dikunci
                            </h3>
                            <p className="text-gray-500 font-medium max-w-md mx-auto">
                                Algoritma Genetika telah menemukan kombinasi
                                terbaik. Silakan cek tab History untuk melihat
                                detailnya.
                            </p>
                        </div>
                    )}
                    {activeTab === "history" && (
                        <HistoryJadwal
                            selectedTahunAjaran={selectedTahunAjaran}
                            historyJadwal={historyJadwal}
                            selectedNamaTahunAjaran={selectedNamaTahunAjaran}
                            listMapelGuru={listMapelGuru}
                            setActiveTab={setActiveTab}
                        />
                    )}
                </div>
                {/* </div> */}
            </div>
            {showMinimizedWidget && (
                <div className="fixed bottom-4 right-4 z-50 ">
                    <button
                        onClick={onMaximize}
                        type="button"
                        className="flex items-center gap-2.5 bg-white  text-black px-4 py-2.5 rounded-2xl shadow-lg border shadow-xl border-secondary-300 text-xs font-medium transition-all cursor-pointer"
                    >
                        <i className="fa fa-spinner fa-spin text-primary-400 text-[12px]"></i>
                        <div className="flex flex-col text-left">
                            <span className="font-bold">
                                Memproses Penjadwalan...
                            </span>
                            <span className="text-[10px] text-primary-400 font-mono">
                                {progress}% selesai
                            </span>
                        </div>
                        <i className="fa fa-expand text-primary-400 ml-1"></i>
                    </button>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
