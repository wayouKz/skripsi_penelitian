import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";

export default function GlobalLoader() {
    const [isLoading, setIsLoading] = useState(() => {
        // Cek apakah halaman dimuat karena di-refresh (F5 / tombol reload browser)
        if (typeof window !== "undefined" && window.performance) {
            const navEntries = performance.getEntriesByType("navigation");
            if (navEntries.length > 0) {
                return navEntries[0].type === "reload";
            }
            // Fallback untuk browser lama
            return performance.navigation.type === 1;
        }
        return false;
    });

    useEffect(() => {
        // Jika tadinya true karena reload, matikan loader setelah komponen siap
        if (isLoading) {
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 400); // Beri jeda sedikit agar mulus
            return () => clearTimeout(timer);
        }

        // Event saat navigasi Inertia biasa (TIDAK akan mentrigger loader saat pindah halaman)
        const removeStartListener = router.on("start", () => {
            // Biarkan false agar loader tidak muncul saat klik menu/pindah halaman biasa
            setIsLoading(false);
        });

        const removeFinishListener = router.on("finish", () => {
            setIsLoading(false);
        });

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all">
            <div className="flex flex-col items-center gap-3 p-5 ">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-600 animate-pulse">
                    Memuat Ulang...
                </p>
            </div>
        </div>
    );
}
