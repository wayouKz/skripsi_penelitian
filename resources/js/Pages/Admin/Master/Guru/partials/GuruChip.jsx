import React, { useState, useEffect, useMemo } from "react";
import Avatar from "./Avatar";
import Select from "react-select";

function GuruChip({
    guru = {},
    mapelId,
    kelasList = [],
    takenKelasIds = [],
    onRemove,
    onChangeData,
}) {
    // STATE LOKAL UNTUK MENCEGAH LAG SAAT MENGETIK
    const [localJam, setLocalJam] = useState(guru?.beban_jam ?? "");

    // Sinkronisasi state lokal jika ada perubahan dari luar
    useEffect(() => {
        setLocalJam(guru?.beban_jam ?? "");
    }, [guru?.beban_jam]);

    const errorKelas = !guru.kelas_id || guru.kelas_id === "";
    const errorJam = localJam === "" || Number(localJam) <= 0;
    const hasError = errorKelas || errorJam;

    // Gunakan useMemo agar opsi kelas tidak dikalkulasi ulang tiap ngetik
    const kelasOptions = useMemo(() => {
        return (kelasList || [])
            .filter((k) => String(k.value).toLowerCase() !== "all")
            .map((k) => {
                const isTaken = (takenKelasIds || []).includes(String(k.value));
                const isCurrent = String(guru?.kelas_id) === String(k.value);
                const isDisabled = isTaken && !isCurrent;

                return {
                    value: k.value,
                    label: `${k.label}${isDisabled ? " (Terpakai)" : ""}`,
                    isDisabled: isDisabled,
                };
            });
    }, [kelasList, takenKelasIds, guru?.kelas_id]);

    const selectedKelasOption =
        kelasOptions.find(
            (opt) => String(opt.value) === String(guru?.kelas_id),
        ) || null;

    // Styling custom untuk React Select
    const customSelectStyles = useMemo(
        () => ({
            control: (base, state) => ({
                ...base,
                backgroundColor: errorKelas ? "#FEF3C7" : "#F9FAFB",
                borderColor: state.isFocused
                    ? "#10B981"
                    : errorKelas
                      ? "#FCD34D"
                      : "#E5E7EB",
                borderRadius: "0.375rem",
                minHeight: "28px",
                height: "28px",
                padding: "0 2px",
                boxShadow: state.isFocused
                    ? "0 0 0 2px rgba(16, 185, 129, 0.15)"
                    : "none",
                cursor: "pointer",
                "&:hover": { borderColor: "#10B981" },
            }),
            valueContainer: (base) => ({
                ...base,
                padding: "0 4px",
                height: "28px",
            }),
            indicatorsContainer: (base) => ({
                ...base,
                height: "28px",
            }),
            dropdownIndicator: (base) => ({
                ...base,
                padding: "2px",
            }),
            clearIndicator: (base) => ({
                ...base,
                padding: "2px",
            }),
            placeholder: (base) => ({
                ...base,
                color: "#9CA3AF",
                fontSize: "0.75rem",
                fontWeight: "normal",
            }),
            singleValue: (base) => ({
                ...base,
                color: errorKelas ? "#B45309" : "#1F2937",
                fontSize: "0.75rem",
                fontWeight: "600",
            }),
            option: (base, state) => ({
                ...base,
                backgroundColor: state.isDisabled
                    ? "#F3F4F6"
                    : state.isSelected
                      ? "#10B981"
                      : state.isFocused
                        ? "#ECFDF5"
                        : "white",
                color: state.isDisabled
                    ? "#9CA3AF"
                    : state.isSelected
                      ? "white"
                      : "#1F2937",
                fontSize: "0.75rem",
                fontWeight: "500",
                cursor: state.isDisabled ? "not-allowed" : "pointer",
            }),
            menuPortal: (base) => ({
                ...base,
                zIndex: 9999,
            }),
        }),
        [errorKelas],
    );

    // Handle saat user selesai mengetik (kursor pindah)
    const handleJamBlur = () => {
        if (localJam !== guru?.beban_jam) {
            onChangeData(mapelId, guru.unique_id, "beban_jam", localJam);
        }
    };

    return (
        <div
            className={`inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${
                hasError
                    ? "bg-white border-amber-300 ring-1 ring-amber-200/60"
                    : "bg-white border-gray-200 shadow-sm"
            }`}
        >
            <Avatar name={guru?.label || "Guru"} size="sm" color="primary" />
            <span
                className="text-xs font-semibold text-gray-700 max-w-[100px] truncate"
                title={guru?.label}
            >
                {guru?.label || "-"}
            </span>
            <span className="w-px h-4 bg-gray-200 flex-shrink-0" />

            {/* Dropdown Kelas (React Select) */}
            <div className="w-32">
                <Select
                    value={selectedKelasOption}
                    onChange={(option) =>
                        onChangeData(
                            mapelId,
                            guru.unique_id,
                            "kelas_id",
                            option ? option.value : "",
                        )
                    }
                    options={kelasOptions}
                    isOptionDisabled={(option) => option.isDisabled}
                    placeholder="-- Kelas --"
                    isSearchable={true}
                    menuPortalTarget={document.body}
                    className="text-xs"
                    classNamePrefix="react-select"
                    styles={customSelectStyles}
                />
            </div>

            {/* Input Beban Jam */}
            <div className="flex items-center gap-1">
                <input
                    type="number"
                    min="1"
                    value={localJam}
                    onChange={(e) => setLocalJam(e.target.value)}
                    onBlur={handleJamBlur}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.target.blur(); // Trigger blur saat enter ditekan
                        }
                    }}
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

// BUNGKUS DENGAN REACT.MEMO
export default React.memo(GuruChip, (prevProps, nextProps) => {
    // Hanya re-render jika data guru ini sendiri yang berubah, atau list kelas berubah
    return (
        prevProps.guru === nextProps.guru &&
        prevProps.takenKelasIds.length === nextProps.takenKelasIds.length
    );
});
