import { useEffect, useRef, useState } from "react";

export default function Reveal({ as: Tag = "div", className = "", children }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setVisible(true);
            return;
        }
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.unobserve(el);
                }
            },
            { threshold: 0.15 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            className={`transition-all duration-700 ease-out ${
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
            } ${className}`}
        >
            {children}
        </Tag>
    );
}
