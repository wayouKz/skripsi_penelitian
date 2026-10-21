const THEME_KEY = "app_theme_color";

export const PRESETS = {
    emerald: {
        name: "Emerald",
        primary: "16 185 129",
        dark: "5 150 105",
        light: "52 211 153",
        hex: "#10b981",
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
    const root = document.documentElement;
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-primary-dark", colors.dark);
    root.style.setProperty("--color-primary-light", colors.light);
    localStorage.setItem(THEME_KEY, JSON.stringify(colors));
}

export function loadTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) {
            applyTheme(JSON.parse(saved));
            return JSON.parse(saved);
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
