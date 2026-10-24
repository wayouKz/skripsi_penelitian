/**
 * Ambil warna primary dari CSS variable (--color-primary = "R G B")
 * Fallback ke emerald jika belum di-set.
 */
function getPrimaryRgb() {
    if (typeof document === "undefined") return "16 185 129";
    const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim();
    return v || "16 185 129";
}

function getPrimaryDarkRgb() {
    if (typeof document === "undefined") return "5 150 105";
    const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary-dark")
        .trim();
    return v || "5 150 105";
}

function rgb(cssRgb, alpha) {
    if (alpha === undefined) return `rgb(${cssRgb})`;
    return `rgba(${cssRgb.replace(/\s+/g, ", ")}, ${alpha})`;
}

/**
 * @param {object} options
 * @param {boolean} [options.isEmpty] - border kuning jika kosong (opsional)
 * @param {boolean} [options.error] - border merah error
 * @param {"sm"|"md"} [options.size="sm"]
 */
export function getSelectStyles(options = {}) {
    const { isEmpty = false, error = false, size = "sm" } = options;

    const primary = getPrimaryRgb();
    const primaryDark = getPrimaryDarkRgb();
    // hover option: primary sangat transparan
    const primarySoft = rgb(primary, 0.12);
    const primaryFocusRing = rgb(primary, 0.15);

    const sizes = {
        sm: {
            minHeight: "32px",
            fontSize: "0.75rem", // 12px
            optionFontSize: "0.75rem",
            padding: "0 6px",
            borderRadius: "0.5rem",
        },
        md: {
            minHeight: "36px",
            fontSize: "0.875rem",
            optionFontSize: "0.875rem",
            padding: "0 8px",
            borderRadius: "0.75rem",
        },
    };
    const s = sizes[size] || sizes.sm;

    return {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled
                ? "#F3F4F6"
                : isEmpty
                  ? "#FFFFFF"
                  : "#FFFFFF",
            borderColor: error
                ? "#EF4444"
                : state.isFocused
                  ? rgb(primary)
                  : isEmpty
                    ? "#FCD34D"
                    : "#E5E7EB",
            borderRadius: s.borderRadius,
            minHeight: s.minHeight,
            height: size === "sm" ? s.minHeight : undefined,
            padding: "0 2px",
            boxShadow: state.isFocused
                ? `0 0 0 3px ${primaryFocusRing}`
                : "none",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            fontSize: s.fontSize,
            "&:hover": {
                borderColor: state.isDisabled
                    ? "#E5E7EB"
                    : error
                      ? "#EF4444"
                      : rgb(primary),
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: s.padding,
            minHeight: size === "sm" ? s.minHeight : undefined,
        }),
        input: (base) => ({
            ...base,
            margin: 0,
            padding: 0,
            fontSize: s.fontSize,
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: size === "sm" ? s.minHeight : undefined,
        }),
        dropdownIndicator: (base) => ({
            ...base,
            padding: "4px",
        }),
        clearIndicator: (base) => ({
            ...base,
            padding: "4px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: s.fontSize,
            fontWeight: 500,
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: s.fontSize,
            fontWeight: 600,
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: primarySoft,
            borderRadius: "0.375rem",
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: rgb(primaryDark),
            fontSize: s.fontSize,
            fontWeight: 600,
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: rgb(primaryDark),
            ":hover": {
                backgroundColor: rgb(primary, 0.25),
                color: rgb(primaryDark),
            },
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? rgb(primary)
                : state.isFocused
                  ? primarySoft
                  : "white",
            color: state.isSelected ? "white" : "#1F2937",
            fontSize: s.optionFontSize,
            fontWeight: 500,
            cursor: "pointer",
            ":active": {
                backgroundColor: state.isSelected
                    ? rgb(primary)
                    : rgb(primary, 0.2),
            },
        }),
        menu: (base) => ({
            ...base,
            borderRadius: s.borderRadius,
            overflow: "hidden",
            zIndex: 50,
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };
}
