import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePage } from "@inertiajs/react";

export default function ActionDropdown({ actions = [] }) {
    const [open, setOpen] = useState(false);

    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const [pos, setPos] = useState({ top: 0, left: 0 });

    const { auth } = usePage().props;
    const features = auth?.list_features || [];
    const currentRoute = route().current();

    const currentFeature = features.find(
        (feature) => feature.route === currentRoute,
    );

    const permissionMap = {
        Hapus: "can_delete",
        Edit: "can_update",
    };

    // Filter action berdasarkan permission
    const filteredActions = actions.filter((action) => {
        if (!action.label) return true;

        const permissionField = permissionMap[action.label];

        // PERBAIKAN 1: Jika aksi (seperti "Import SK") tidak ada di permissionMap,
        // izinkan tampil secara default (return true).
        if (!permissionField) return true;

        return !!currentFeature?.pivot?.[permissionField];
    });

    useEffect(() => {
        if (open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + window.scrollY + 5,
                left: rect.right + window.scrollX - 170,
            });
        }
    }, [open]);

    // Deteksi klik di luar & scroll
    useEffect(() => {
        const close = (e) => {
            if (
                !buttonRef.current?.contains(e.target) &&
                !menuRef.current?.contains(e.target)
            ) {
                setOpen(false);
            }
        };

        // PERBAIKAN 3: Tutup dropdown otomatis jika user men-scroll tabel/halaman
        // agar menu tidak melayang jauh dari tombolnya.
        const handleScroll = () => {
            if (open) setOpen(false);
        };

        if (open) {
            document.addEventListener("mousedown", close);
            window.addEventListener("scroll", handleScroll, true); // true = capture phase untuk elemen ber-scroll
        }

        return () => {
            document.removeEventListener("mousedown", close);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [open]);

    if (filteredActions.length === 0) return null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
                <i className="fa fa-ellipsis-v"></i>
            </button>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            top: pos.top,
                            left: pos.left,
                            position: "absolute",
                        }}
                        className="z-[9999] w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                    >
                        <div className="p-2">
                            {filteredActions.map((a, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        // PERBAIKAN 2: Gunakan Optional Chaining (?.)
                                        // agar tidak error jika onClick belum di-set
                                        a.onClick?.();
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-gray-100 ${
                                        a.danger
                                            ? "text-red-600"
                                            : a.edit
                                              ? "text-yellow-600"
                                              : "text-gray-700"
                                    }`}
                                >
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                            a.danger
                                                ? "bg-red-100"
                                                : a.edit
                                                  ? "bg-yellow-100"
                                                  : "bg-gray-100"
                                        }`}
                                    >
                                        <i className={"fa fa-" + a.icon}></i>
                                    </div>

                                    <span>{a.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
