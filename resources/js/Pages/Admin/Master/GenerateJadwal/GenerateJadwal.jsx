import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
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

    // 5. Fetch Data API Awal
    const fetchDataAwal = async () => {
        try {
            const [dataGuru, DataTA, DataJadwal] = await Promise.all([
                axios.get(route("getData.get-mapel-guru"), {
                    params: { tahun_ajaran_id: selectedTahunAjaran },
                }),
                axios.get(route("getData.get-tahun-ajaran")),
                axios.get(route("getData.get-history-jadwal"), {
                    params: { tahun_ajaran_id: selectedTahunAjaran },
                }),
            ]);

            setTahunAjaranList(DataTA.data.data);
            setListMapelGuru(dataGuru.data.data);
            setHistoryJadwal(DataJadwal.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data inisial:", error);
        }
    };

    useEffect(() => {
        fetchDataAwal();
    }, [selectedTahunAjaran, activeTab]);

    // Data Mapping & Grouping (Berdasarkan NIP, lalu mengumpulkan Kelas)

    // FUNGSI MANIPULASI JAM PELAJARAN

    // 6. Fungsi Handle Start GA

    // Fungsi Render Matriks Jadwal History
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
    return (
        <AuthenticatedLayout header="Generate Jadwal Mengajar (Algoritma Genetika)">
            <Head title="Generate Jadwal" />

            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-gray-200/60 rounded-2xl">
                    <button
                        onClick={() =>
                            !isGenerating && setActiveTab("konfigurasi")
                        }
                        className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === "konfigurasi"
                                ? "bg-white text-green-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/80"
                        } ${isGenerating ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                        <Settings size={18} />
                        <span className="hidden sm:inline">1. Konfigurasi</span>
                    </button>
                    <button
                        className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === "proses"
                                ? "bg-white text-green-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                : "text-gray-500"
                        } cursor-default`}
                    >
                        <Cpu size={18} />
                        <span className="hidden sm:inline">
                            2. Proses Algoritma
                        </span>
                    </button>
                    <button
                        onClick={() =>
                            !isGenerating &&
                            progress === 100 &&
                            setActiveTab("hasil")
                        }
                        className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === "hasil"
                                ? "bg-white text-green-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                : "text-gray-500"
                        } ${progress < 100 ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                        <Calendar size={18} />
                        <span className="hidden sm:inline">
                            3. Hasil Jadwal
                        </span>
                    </button>
                    <button
                        onClick={() => !isGenerating && setActiveTab("history")}
                        className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === "history"
                                ? "bg-white text-green-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/80"
                        } ${isGenerating ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                        <History size={18} />
                        <span className="hidden sm:inline">
                            4. Riwayat Jadwal
                        </span>
                    </button>
                </div>
                {selectedTahunAjaran && (
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
                )}

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-8 min-h-[500px]">
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
                            setGeneration={setGeneration}
                            setFitness={setFitness}
                            setLogs={setLogs}
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
                        />
                    )}
                    {activeTab === "hasil" && (
                        <div className="space-y-6 text-center py-20 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                                <CheckCircle2
                                    className="text-emerald-500"
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
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
