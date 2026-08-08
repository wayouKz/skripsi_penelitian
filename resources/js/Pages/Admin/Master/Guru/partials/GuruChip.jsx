import React from "react";
import Avatar from "./Avatar";
// Pastikan import Avatar sesuai dengan path project kamu, contoh:
// import Avatar from "@/Components/Avatar";

export default function GuruChip({
    guru = {},
    mapelId,
    kelasList = [],
    takenKelasIds = [],
    onRemove,
    onChangeData,
}) {
    // Pengaman jika properti guru belum terisi
    const errorKelas = !guru.kelas_id || guru.kelas_id === "";
    const errorJam = guru.beban_jam === "" || Number(guru.beban_jam) <= 0;
    const hasError = errorKelas || errorJam;

    return (
        <div
            className={`inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${
                hasError
                    ? "bg-white border-amber-300 ring-1 ring-amber-200/60"
                    : "bg-white border-gray-200 shadow-sm"
            }`}
        >
            <Avatar name={guru?.label || "Guru"} size="sm" color="green" />
            <span
                className="text-xs font-semibold text-gray-700 max-w-[100px] truncate"
                title={guru?.label}
            >
                {guru?.label || "-"}
            </span>
            <span className="w-px h-4 bg-gray-200 flex-shrink-0" />

            {/* Dropdown Kelas */}
            <select
                value={guru?.kelas_id || ""}
                onChange={(e) =>
                    onChangeData(
                        mapelId,
                        guru.unique_id,
                        "kelas_id",
                        e.target.value,
                    )
                }
                className={`w-24 h-7 text-xs rounded border bg-gray-50 focus:ring-2 focus:outline-none transition px-1 ${
                    errorKelas
                        ? "border-amber-300 text-amber-700"
                        : "border-gray-200"
                }`}
            >
                <option value="">-- Kelas --</option>
                {(kelasList || [])
                    .filter((k) => String(k.value).toLowerCase() !== "all")
                    .map((k) => {
                        const isTaken = (takenKelasIds || []).includes(
                            String(k.value),
                        );
                        const isCurrent =
                            String(guru?.kelas_id) === String(k.value);

                        const isDisabled = isTaken && !isCurrent;

                        return (
                            <option
                                key={k.value}
                                value={k.value}
                                disabled={isDisabled}
                                className={
                                    isDisabled
                                        ? "bg-gray-100 text-gray-400"
                                        : ""
                                }
                            >
                                {k.label} {isDisabled ? " (Terpakai)" : ""}
                            </option>
                        );
                    })}
            </select>

            {/* Input Beban Jam */}
            <div className="flex items-center gap-1">
                <input
                    type="number"
                    min="1"
                    value={guru?.beban_jam ?? ""}
                    onChange={(e) =>
                        onChangeData(
                            mapelId,
                            guru.unique_id,
                            "beban_jam",
                            e.target.value,
                        )
                    }
                    placeholder="Jam"
                    className={`w-14 h-7 text-xs text-center rounded border bg-gray-50 focus:ring-2 focus:outline-none px-1 ${
                        errorJam ? "border-amber-300" : "border-gray-200"
                    }`}
                />
            </div>

            {/* Tombol Hapus */}
            <button
                type="button"
                onClick={() => onRemove(mapelId, guru.unique_id)}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
            >
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    );
}
