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
import Menu from "@/Components/Menu";
import { useAlert } from "@/Components/AlertContext";
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

    const { showCenterAlert } = useAlert();

    const fetchDataTa = async () => {
        try {
            const response = await axios.get(route("getData.get-tahun-ajaran"));
            setTahunAjaranList(response.data.data);
        } catch (error) {
            console.log(error);
        }
    };
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
    return (
        <AuthenticatedLayout header="Generate Jadwal Mengajar (Algoritma Genetika)">
            <Head title="Generate Jadwal" />

            <div className="">
                <div className="flex gap-2">
                    <div className="m-2">
                        <Menu
                            menus={menu}
                            setMenu={setActiveTab}
                            menu={activeTab}
                        />
                    </div>
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
                        {activeTab === "konfigurasi" && (
                            <Configurasi
                                tahunAjaranList={tahunAjaranList}
                                selectedTahunAjaran={selectedTahunAjaran}
                                selectedNamaTahunAjaran={
                                    selectedNamaTahunAjaran
                                }
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
                                    terbaik. Silakan cek tab History untuk
                                    melihat detailnya.
                                </p>
                            </div>
                        )}
                        {activeTab === "history" && (
                            <HistoryJadwal
                                selectedTahunAjaran={selectedTahunAjaran}
                                historyJadwal={historyJadwal}
                                selectedNamaTahunAjaran={
                                    selectedNamaTahunAjaran
                                }
                                listMapelGuru={listMapelGuru}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
