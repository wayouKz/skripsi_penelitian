import {
    ClipboardCopyIcon,
    ClipboardPaste,
    Clock,
    Plus,
    Trash2,
    Check,
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
        // Pastikan slotsPerHari tidak kosong/undefined sebelum disimpan
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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="text-gray-400" size={18} />
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                        Waktu Pelajaran
                    </h4>
                </div>
                <div className="flex gap-2">
                    {/* Tombol Paste */}
                    {copiedSlots && (
                        <button
                            onClick={handlePaste}
                            type="button"
                            className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors border border-blue-200"
                        >
                            <ClipboardPaste size={14} /> Paste
                        </button>
                    )}

                    {/* Tombol Copy */}
                    <button
                        onClick={handleCopy}
                        type="button"
                        className={`text-[11px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                            isCopied
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                    >
                        {isCopied ? (
                            <Check size={14} />
                        ) : (
                            <ClipboardCopyIcon size={14} />
                        )}
                        {isCopied ? "Tercopy!" : "Copy"}
                    </button>

                    <button
                        onClick={handleAddSlot}
                        type="button"
                        className="text-[11px] text-green-600 font-bold bg-green-50 px-2 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1 transition-colors border border-green-200"
                    >
                        <Plus size={14} /> Tambah
                    </button>
                </div>
            </div>

            {/* TAB HARI */}
            <div className="w-full flex mb-2 border-b border-gray-100 pb-2 overflow-x-auto custom-scrollbar">
                {daftarHari.map((hari, index) => (
                    <div
                        key={index}
                        onClick={() => setActiveHari(hari)}
                        className={`flex-shrink-0 flex items-center justify-center me-2 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all border ${
                            activeHari === hari
                                ? "bg-green-600 text-white border-green-600 shadow-green-200"
                                : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50"
                        }`}
                    >
                        <span
                            className={`text-xs font-bold ${activeHari === hari ? "text-white" : "text-gray-500"}`}
                        >
                            {hari}
                        </span>
                    </div>
                ))}
            </div>

            {/* LIST JADWAL WAKTU BERDASARKAN HARI AKTIF */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                {currentSlots.map((slot, index) => (
                    <div
                        key={slot.id}
                        className="flex items-center gap-2 group"
                    >
                        <span className="text-xs font-black text-gray-300 w-4 text-right">
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
                            className="text-xs font-medium px-2.5 py-2 border border-gray-300 rounded-lg w-full focus:ring-green-500 focus:border-green-500"
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
                            className="text-xs font-medium px-2.5 py-2 border border-gray-300 rounded-lg w-full focus:ring-green-500 focus:border-green-500"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Hapus Sesi"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                {currentSlots.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-4 font-medium bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        Belum ada sesi waktu diatur untuk hari {activeHari}.
                    </p>
                )}
            </div>
        </>
    );
}
