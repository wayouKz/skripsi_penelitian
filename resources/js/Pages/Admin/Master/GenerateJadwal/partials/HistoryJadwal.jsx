import { CalendarDays, History } from "lucide-react";
import DaftarJadwal from "./component/DaftarJadwal";

export default function HistoryJadwal({
    selectedTahunAjaran,
    historyJadwal,
    selectedNamaTahunAjaran,
    listMapelGuru,
}) {
    const mapelList = listMapelGuru.filter(
        (mapel) => mapel.guru && mapel.guru.length > 0,
    );

    const dataMapel = [
        // 1. Tambahkan opsi default "Semua Mapel" di indeks paling atas
        { value: "all", label: "Semua Mapel" },

        // 2. Map data listMapelGuru dan gabungkan (spread) ke dalam array ini
        ...listMapelGuru.map((mapel) => ({
            value: mapel.id,
            label: mapel.mapel,
        })),
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                    <History className="text-green-600" size={18} /> Riwayat
                    Jadwal Aktif
                </h3>
            </div>
            {!selectedTahunAjaran ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <CalendarDays
                        className="mx-auto text-gray-300 mb-2.5"
                        size={32}
                    />
                    <p className="text-xs text-gray-500 font-semibold">
                        Silakan pilih Tahun Ajaran di Tab Konfigurasi terlebih
                        dahulu.
                    </p>
                </div>
            ) : historyJadwal.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 font-semibold">
                        Belum ada jadwal yang tersimpan untuk tahun ajaran ini.
                    </p>
                </div>
            ) : (
                <DaftarJadwal
                    historyJadwal={historyJadwal}
                    selectedTahunAjaran={selectedTahunAjaran}
                    selectedNamaTahunAjaran={selectedNamaTahunAjaran}
                    dataMapel={dataMapel}
                    listMapelGuru={listMapelGuru}
                />
            )}
        </div>
    );
}
