import {
    ClipboardCopyIcon,
    ClipboardPaste,
    Clock,
    Plus,
    Trash2,
    Check,
    Wand2, // Tambahkan ikon ini dari lucide-react jika ingin mempercantik tombol generator
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SlotWaktu({
    daftarHari,
    slotsPerHari,
    setSlotsPerHari,
}) {
    const [activeHari, setActiveHari] = useState("Senin");
    const [copiedSlots, setCopiedSlots] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    // State untuk Generator Otomatis
    const [genJamMulai, setGenJamMulai] = useState("07:00");
    const [genJumlahJam, setGenJumlahJam] = useState(12);
    const [genDurasiMenit, setGenDurasiMenit] = useState(35);
    const [terapkanSemuaHari, setTerapkanSemuaHari] = useState(true);

    const STORAGE_KEY = "slots_per_hari_data";

    // 1. Load data dari localStorage saat komponen pertama kali dimuat (Mount)
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                setSlotsPerHari(parsedData);
            } catch (error) {
                console.error(
                    "Gagal memparsing data dari localStorage:",
                    error,
                );
            }
        }
    }, [setSlotsPerHari]);

    // 2. Simpan data ke localStorage setiap kali slotsPerHari berubah
    useEffect(() => {
        if (slotsPerHari && Object.keys(slotsPerHari).length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slotsPerHari));
        }
    }, [slotsPerHari]);

    // Ambil jadwal khusus untuk hari yang sedang aktif
    const currentSlots = slotsPerHari[activeHari] || [];

    const handleAddSlot = () => {
        const newId =
            currentSlots.length > 0
                ? Math.max(...currentSlots.map((s) => s.id)) + 1
                : 1;
        setSlotsPerHari((prev) => ({
            ...prev,
            [activeHari]: [
                ...(prev[activeHari] || []),
                { id: newId, mulai: "00:00", selesai: "00:00" },
            ],
        }));
    };

    const handleRemoveSlot = (id) => {
        setSlotsPerHari((prev) => ({
            ...prev,
            [activeHari]: prev[activeHari].filter((slot) => slot.id !== id),
        }));
    };

    const handleSlotChange = (id, field, value) => {
        setSlotsPerHari((prev) => ({
            ...prev,
            [activeHari]: prev[activeHari].map((slot) =>
                slot.id === id ? { ...slot, [field]: value } : slot,
            ),
        }));
    };

    // Fungsi Generate Jam Otomatis
    const handleGenerateSlots = () => {
        if (!genJamMulai || genJumlahJam <= 0 || genDurasiMenit <= 0) return;

        let [hours, minutes] = genJamMulai.split(":").map(Number);
        let generated = [];

        for (let i = 1; i <= genJumlahJam; i++) {
            // Format waktu mulai
            const mulaiStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

            // Tambahkan menit
            minutes += Number(genDurasiMenit);
            while (minutes >= 60) {
                hours += 1;
                minutes -= 60;
            }

            // Format waktu selesai
            const selesaiStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

            generated.push({
                id: Date.now() + i,
                mulai: mulaiStr,
                selesai: selesaiStr,
            });
        }

        setSlotsPerHari((prev) => {
            let updated = { ...prev };
            if (terapkanSemuaHari) {
                daftarHari.forEach((hari) => {
                    updated[hari] = generated;
                });
            } else {
                updated[activeHari] = generated;
            }
            return updated;
        });
    };

    // Fungsi Copy
    const handleCopy = () => {
        setCopiedSlots([...currentSlots]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Fungsi Paste
    const handlePaste = () => {
        if (!copiedSlots) return;

        const pastedSlots = copiedSlots.map((slot, index) => ({
            ...slot,
            id: Date.now() + index,
        }));

        setSlotsPerHari((prev) => ({
            ...prev,
            [activeHari]: pastedSlots,
        }));
    };

    return (
        <>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    <Clock className="text-gray-400" size={16} />
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Waktu Pelajaran
                    </h4>
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={handleAddSlot}
                        type="button"
                        className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-1 rounded-lg hover:bg-primary-100 flex items-center gap-1 transition-colors border border-primary-200"
                    >
                        <Plus size={12} /> Tambah
                    </button>
                </div>
            </div>

            {/* UI GENERATOR OTOMATIS */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
                <span className="text-[11px] font-bold text-gray-700 block mb-2 flex items-center gap-1">
                    <Wand2 size={12} className="text-primary-600" /> Generator
                    Jam Otomatis
                </span>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">
                            Jam Mulai
                        </label>
                        <input
                            type="time"
                            value={genJamMulai}
                            onChange={(e) => setGenJamMulai(e.target.value)}
                            className="text-xs font-medium px-2 py-1 border border-gray-300 rounded-lg w-full bg-white"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">
                            Jumlah Jam
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={genJumlahJam}
                            onChange={(e) =>
                                setGenJumlahJam(Number(e.target.value))
                            }
                            className="text-xs font-medium px-2 py-1 border border-gray-300 rounded-lg w-full bg-white"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">
                            Durasi (Menit)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="120"
                            value={genDurasiMenit}
                            onChange={(e) =>
                                setGenDurasiMenit(Number(e.target.value))
                            }
                            className="text-xs font-medium px-2 py-1 border border-gray-300 rounded-lg w-full bg-white"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-600">
                        <input
                            type="checkbox"
                            checked={terapkanSemuaHari}
                            onChange={(e) =>
                                setTerapkanSemuaHari(e.target.checked)
                            }
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
                        />
                        Terapkan ke semua hari (Senin - Jumat)
                    </label>
                    <button
                        type="button"
                        onClick={handleGenerateSlots}
                        className="text-[10px] bg-primary-600 hover:bg-primary-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                        Generate
                    </button>
                </div>
            </div>

            <div className="flex justify-end gap-1.5 mb-2">
                {/* Tombol Paste */}
                {copiedSlots && (
                    <button
                        onClick={handlePaste}
                        type="button"
                        className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-1 rounded-lg hover:bg-primary-100 flex items-center gap-1 transition-colors border border-primary-200"
                    >
                        <ClipboardPaste size={12} /> Paste
                    </button>
                )}

                {/* Tombol Copy */}
                <button
                    onClick={handleCopy}
                    type="button"
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                        isCopied
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                >
                    {isCopied ? (
                        <Check size={12} />
                    ) : (
                        <ClipboardCopyIcon size={12} />
                    )}
                    {isCopied ? "Tercopy!" : "Copy"}
                </button>
            </div>

            {/* TAB HARI */}
            <div className="w-full flex mb-2 border-b border-gray-100 pb-1.5 overflow-x-auto">
                {daftarHari.map((hari, index) => (
                    <div
                        key={index}
                        onClick={() => setActiveHari(hari)}
                        className={`flex-shrink-0 flex items-center me-1 px-2 py-1 justify-center rounded-lg shadow-sm cursor-pointer transition-all border ${
                            activeHari === hari
                                ? "bg-primary-600 text-white border-primary-600 shadow-primary-200"
                                : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                        }`}
                    >
                        <span
                            className={`text-[11px] font-bold ${
                                activeHari === hari
                                    ? "text-white"
                                    : "text-gray-500"
                            }`}
                        >
                            {hari}
                        </span>
                    </div>
                ))}
            </div>

            {/* LIST JADWAL WAKTU BERDASARKAN HARI AKTIF */}
            <div className="space-y-2 max-h-full overflow-y-auto custom-scrollbar pr-1">
                {currentSlots.map((slot, index) => (
                    <div
                        key={slot.id}
                        className="flex items-center gap-2 group"
                    >
                        <span className="text-[11px] font-black text-gray-300 w-4 text-right">
                            {index + 1}.
                        </span>
                        <input
                            type="time"
                            value={slot.mulai}
                            onChange={(e) =>
                                handleSlotChange(
                                    slot.id,
                                    "mulai",
                                    e.target.value,
                                )
                            }
                            className="text-xs font-medium px-2 py-1.5 border border-gray-300 rounded-lg w-full focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="text-gray-300">-</span>
                        <input
                            type="time"
                            value={slot.selesai}
                            onChange={(e) =>
                                handleSlotChange(
                                    slot.id,
                                    "selesai",
                                    e.target.value,
                                )
                            }
                            className="text-xs font-medium px-2 py-1.5 border border-gray-300 rounded-lg w-full focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Hapus Sesi"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}

                {currentSlots.length === 0 && (
                    <p className="text-[11px] text-center text-gray-400 py-3 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Belum ada sesi waktu diatur untuk hari {activeHari}.
                    </p>
                )}
            </div>
        </>
    );
}
