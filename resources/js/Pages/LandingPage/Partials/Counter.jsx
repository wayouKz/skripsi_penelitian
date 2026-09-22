import { useEffect, useRef, useState } from "react";

export default function Counter({ value, decimals = 0, suffix = "" }) {
    const ref = useRef(null);
    const [display, setDisplay] = useState(decimals > 0 ? "0.0" : "0");
    const done = useRef(false);

    useEffect(() => {
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || done.current) return;
                done.current = true;
                const duration = reduceMotion ? 0 : 1400;
                const start = performance.now();
                function tick(now) {
                    const p =
                        duration === 0
                            ? 1
                            : Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    const val = value * eased;
                    setDisplay(
                        decimals > 0
                            ? val.toFixed(decimals)
                            : Math.round(val).toLocaleString("id-ID"),
                    );
                    if (p < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                io.unobserve(el);
            },
            { threshold: 0.5 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [value, decimals]);

    return (
        <span ref={ref}>
            {display}
            {suffix}
        </span>
    );
}
