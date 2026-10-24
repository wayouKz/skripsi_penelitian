import "../css/app.css";
import "./bootstrap";
import { AlertProvider } from "./Components/AlertContext";
import GlobalLoader from "./Layouts/GlobalLoader"; // Import loader
import { loadThemeFromSettings } from "./utils/theme";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

const appName = import.meta.env.VITE_APP_NAME;
createInertiaApp({
    title: (title) => `${title} `,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        loadThemeFromSettings(props.initialPage.props.settings_application);

        root.render(
            <AlertProvider>
                <GlobalLoader />
                {/* Pasang GlobalLoader di sini agar tampil di atas semua halaman */}
                <App {...props} />
            </AlertProvider>,
        );
    },
    progress: {
        color: "#22C55E",
        includeCSS: true,
        showSpinner: true,
        delay: 600,
    },
});
