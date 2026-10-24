import { usePage } from "@inertiajs/react";
import React, { useState, useEffect, useRef } from "react";

// Destructure the expected prop (e.g., card_img) passed from your Laravel/Inertia controller
export default function DynamicTiltCard() {
    const stageRef = useRef(null);
    const card_img = usePage().props.highlight;

    // State untuk efek kemiringan (tilt)
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, tx: 0, ty: 0 });

    // State untuk card yang sedang aktif
    const [activeIndex, setActiveIndex] = useState(0);

    // 1. Mengubah JSON Object dari Laravel menjadi Array untuk React
    const cards =
        Object.keys(card_img).length > 0
            ? Object.values(card_img).map((filename, index) => ({
                  id: index + 1,
                  // Sesuaikan path ini dengan setting storage symlink Laravel Anda.
                  // Defaultnya biasanya '/storage/foto_highlight/'
                  image: `/storage/public/foto_highlight/${filename}`,
                  alt: `Highlight ${index + 1}`,
              }))
            : [
                  // 2. Fallback jika data di database masih kosong
                  {
                      id: 1,
                      image: "https://placehold.co/350x450/0a2f31/ffffff?text=Belum+Ada+Gambar",
                      alt: "Fallback",
                  },
              ];

    // Auto-play: Mengubah card setiap 3 detik
    useEffect(() => {
        // 3. Mencegah error pembagian (NaN) jika array kosong atau tidak perlu interval jika hanya 1 gambar
        if (cards.length <= 1) return;

        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % cards.length);
        }, 3000); // 3000ms = 3 detik

        return () => clearInterval(interval);
    }, [cards.length]);

    // Fungsi kalkulasi posisi mouse untuk efek 3D
    const handleMouseMove = (e) => {
        if (!stageRef.current) return;
        const { left, top, width, height } =
            stageRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;

        setTilt({
            rx: (x - 0.5) * 15, // Putaran horizontal
            ry: -(y - 0.5) * 15, // Putaran vertikal
            tx: (x - 0.5) * 10, // Pergeseran X
            ty: (y - 0.5) * 10, // Pergeseran Y
        });
    };

    // Reset posisi saat mouse keluar
    const handleMouseLeave = () => {
        setTilt({ rx: 0, ry: 0, tx: 0, ty: 0 });
    };

    return (
        <div
            ref={stageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative h-[420px] md:h-[520px] max-w-[420px] md:max-w-none mx-auto md:mx-0 w-full flex justify-center perspective-1000"
            style={{ perspective: "1000px" }} // Menambah kedalaman 3D
        >
            {/* Background Kotak Hijau yang miring statis */}
            <div className="absolute top-[34px] left-[10%] w-[74%] h-[400px] bg-primary-700 border border-white/10 rounded-[10px] -z-10 rotate-6 transition-all duration-300" />

            {/* Container Card Utama */}
            <div
                className="perforation absolute top-0 w-[88%] max-w-[350px] bg-[#ffffff] text-primary-700 rounded-[10px] p-2 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] transition-transform duration-200 ease-out flex flex-col"
                style={{
                    transform: `rotateY(${tilt.rx}deg) rotateX(${tilt.ry}deg) translate(${tilt.tx}px, ${tilt.ty}px)`,
                    transformStyle: "preserve-3d",
                }}
            >
                {/* Area Gambar (Berubah-ubah) */}
                <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                    {cards.map((card, index) => (
                        <img
                            key={card.id}
                            src={card.image}
                            alt={card.alt}
                            className={`absolute top-0 left-0 w-full h-full object-cover drop-shadow-2xl transition-opacity duration-700 ease-in-out ${
                                index === activeIndex
                                    ? "opacity-100 z-10"
                                    : "opacity-0 z-0"
                            }`}
                        />
                    ))}
                </div>

                {/* Indikator / Dots */}
                <div className="flex justify-center gap-2 mt-4 mb-2">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === activeIndex
                                    ? "bg-primary-700 w-4" // Dot aktif (lebih panjang)
                                    : "bg-gray-300 hover:bg-gray-400" // Dot pasif
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
