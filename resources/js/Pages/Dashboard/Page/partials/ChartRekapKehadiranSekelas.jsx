import React, { useEffect, useMemo, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
);

function getCssRgb(name, fallback) {
    if (typeof document === "undefined") return fallback;
    const v = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    return v || fallback;
}

function rgbaFromCssRgb(cssRgb, alpha) {
    const parts = String(cssRgb).trim().split(/\s+/).join(", ");
    return `rgba(${parts}, ${alpha})`;
}

export default function ChartRekapKehadiranSekelas({ rekapKehadiran }) {
    const [themeTick, setThemeTick] = useState(0);

    // Refresh chart saat tema (--color-primary) diganti
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setThemeTick((t) => t + 1);
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["style"],
        });
        return () => observer.disconnect();
    }, []);

    const data = useMemo(() => {
        const primary = getCssRgb("--color-primary", "16 185 129");

        return {
            labels: ["Hadir", "Izin", "Sakit", "Alpa"],
            datasets: [
                {
                    label: "Jumlah Siswa",
                    data: [
                        rekapKehadiran?.hadir || 0,
                        rekapKehadiran?.izin || 0,
                        rekapKehadiran?.sakit || 0,
                        rekapKehadiran?.alpa || 0,
                    ],
                    backgroundColor: [
                        rgbaFromCssRgb(primary, 0.85), // Hadir → warna tema
                        "rgba(59, 130, 246, 0.8)", // Izin
                        "rgba(245, 158, 11, 0.8)", // Sakit
                        "rgba(239, 68, 68, 0.8)", // Alpa
                    ],
                    borderRadius: 8,
                },
            ],
        };
    }, [rekapKehadiran, themeTick]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 5 },
            },
        },
    };

    return (
        <div className="bg-white p-5 rounded-3xl border border-primary-100 shadow-sm flex flex-col h-full">
            <h3 className="text-sm font-bold text-primary-800 mb-4">
                Statistik Kehadiran Kelas
            </h3>
            <div className="flex-1 w-full min-h-[320px]">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
}
