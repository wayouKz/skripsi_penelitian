import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import fs from "fs";
export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react(),
    ],
    // server: {
    //     host: "0.0.0.0",
    //     port: 5173,
    //     cors: true,
    //     allowedHosts: ["cdn.dev-whostech.my.id"],
    //     hmr: {
    //         host: "cdn.dev-whostech.my.id",
    //         protocol: "wss",
    //         clientPort: 443, // Menggunakan port HTTPS standar di sisi browser
    //         https: {
    //             key: fs.readFileSync(
    //                 "/etc/letsencrypt/live/cdn.dev-whostech.my.id/privkey.pem",
    //             ),
    //             cert: fs.readFileSync(
    //                 "/etc/letsencrypt/live/cdn.dev-whostech.my.id/fullchain.pem",
    //             ),
    //         },
    //     },
    // },
});
