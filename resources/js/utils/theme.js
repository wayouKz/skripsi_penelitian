const THEME_KEY = "app_theme_color";

export const PRESETS = {
    emerald: {
        name: "Emerald",
        primary: "16 185 129",
        dark: "5 150 105",
        light: "52 211 153",
        hex: "#10b981",
    },
    green: {
        name: "Green",
        primary: "34 197 94", // green-500 (RGB)
        dark: "22 163 74", // green-600 (RGB)
        light: "74 222 128", // green-400 (RGB)
        hex: "#22c55e",
    },
    blue: {
        name: "Biru",
        primary: "59 130 246",
        dark: "37 99 235",
        light: "96 165 250",
        hex: "#3b82f6",
    },
    violet: {
        name: "Ungu",
        primary: "139 92 246",
        dark: "124 58 237",
        light: "167 139 250",
        hex: "#8b5cf6",
    },
    rose: {
        name: "Rose",
        primary: "244 63 94",
        dark: "225 29 72",
        light: "251 113 133",
        hex: "#f43f5e",
    },
    amber: {
        name: "Amber",
        primary: "245 158 11",
        dark: "217 119 6",
        light: "251 191 36",
        hex: "#f59e0b",
    },
    slate: {
        name: "Slate",
        primary: "100 116 139",
        dark: "71 85 105",
        light: "148 163 184",
        hex: "#64748b",
    },
};
export function applyTheme(colors) {
    if (!colors) return;
    const root = document.documentElement;
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-primary-dark", colors.dark);
    root.style.setProperty("--color-primary-light", colors.light);
    // localStorage tetap boleh sebagai cache
    localStorage.setItem(THEME_KEY, JSON.stringify(colors));
}

/**
 * Prioritas: data dari DB (settings_application) > localStorage > emerald
 */
export function loadThemeFromSettings(settings) {
    if (settings?.warna_primary) {
        const colors = {
            name: settings.nama_tema || "Custom",
            primary: settings.warna_primary,
            dark: settings.warna_primary_dark || settings.warna_primary,
            light: settings.warna_primary_light || settings.warna_primary,
            hex: settings.warna_hex || "#10b981",
        };
        applyTheme(colors);
        return colors;
    }

    // fallback ke localStorage / default
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            applyTheme(parsed);
            return parsed;
        }
    } catch (e) {}

    applyTheme(PRESETS.emerald);
    return PRESETS.emerald;
}

export function getSavedTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return PRESETS.emerald;
}
