import { CalendarDays, History } from "lucide-react";
import DaftarJadwal from "./component/DaftarJadwal";

export default function HistoryJadwal({
    selectedTahunAjaran,
    historyJadwal,
    selectedNamaTahunAjaran,
}) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border-b border-gray-100 pb-5">
                <h3 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                    <History className="text-green-600" size={24} /> Riwayat
                    Jadwal Aktif
                </h3>
            </div>
            {!selectedTahunAjaran ? (
                <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <CalendarDays
                        className="mx-auto text-gray-300 mb-4"
                        size={48}
                    />
                    <p className="text-gray-500 font-semibold">
                        Silakan pilih Tahun Ajaran di Tab Konfigurasi terlebih
                        dahulu.
                    </p>
                </div>
            ) : historyJadwal.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <p className="text-gray-500 font-semibold">
                        Belum ada jadwal yang tersimpan untuk tahun ajaran ini.
                    </p>
                </div>
            ) : (
                <DaftarJadwal
                    historyJadwal={historyJadwal}
                    selectedTahunAjaran={selectedTahunAjaran}
                    selectedNamaTahunAjaran={selectedNamaTahunAjaran}
                />
            )}
        </div>
    );
}
