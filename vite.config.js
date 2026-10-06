import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import fs from "fs";

// Cek apakah file sertifikat SSL lokal tersedia
const keyPath = "/etc/letsencrypt/live/cdn.dev-whostech.my.id/privkey.pem";
const certPath = "/etc/letsencrypt/live/cdn.dev-whostech.my.id/fullchain.pem";
const hasCert = fs.existsSync(keyPath) && fs.existsSync(certPath);

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react(),
    ],
    server: hasCert
        ? {
              host: "0.0.0.0",
              port: 5173,
              cors: true,
              allowedHosts: ["cdn.dev-whostech.my.id"],
              hmr: {
                  host: "cdn.dev-whostech.my.id",
                  protocol: "wss",
                  clientPort: 443,
                  https: {
                      key: fs.readFileSync(keyPath),
                      cert: fs.readFileSync(certPath),
                  },
              },
          }
        : {
              // Konfigurasi cadangan saat di GitHub Actions (tanpa SSL lokal)
              host: "0.0.0.0",
              port: 5173,
          },
});
