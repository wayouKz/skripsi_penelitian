import React from "react";
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

export default function ChartRekapKehadiranSekelas({ rekapKehadiran }) {
    const data = {
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
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                ],
                borderRadius: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false, // Penting agar tinggi mengikuti parent container
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
        // Tambahkan flex flex-col dan h-full agar tingginya pas dengan tabel
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
