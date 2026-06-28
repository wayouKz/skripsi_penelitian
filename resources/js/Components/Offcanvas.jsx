import { useEffect } from "react";
import DangerButton from "./DangerButton";

export default function Offcanvas({
    open,
    onClose,
    title = "Menu",
    children,
    position = "right",
    width = "w-80",
    icon,
    // NEW
    staticBackdrop = false, // true = tidak bisa close saat klik backdrop
    closeOnEsc = true, // false = ESC tidak menutup
    showBackdrop = true,
}) {
    // ESC
    useEffect(() => {
        if (!closeOnEsc) return;

        const handleEsc = (e) => {
            if (e.key === "Escape" && open) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEsc);

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [closeOnEsc, open, onClose]);

    const handleBackdropClick = () => {
        if (staticBackdrop) return;

        onClose();
    };

    return (
        <>
            {/* BACKDROP */}
            {showBackdrop && (
                <div
                    onClick={handleBackdropClick}
                    className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300 ${
                        open ? "visible opacity-100" : "invisible opacity-0"
                    }`}
                />
            )}

            {/* PANEL */}
            <div
                className={`fixed top-0 z-50 h-screen ${width} bg-white shadow-2xl transition-all duration-300 ${
                    position === "right" ? "right-0" : "left-0"
                } ${
                    open
                        ? "translate-x-0"
                        : position === "right"
                          ? "translate-x-full"
                          : "-translate-x-full"
                }`}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-green-800">
                            {icon} {title}
                        </h2>
                    </div>

                    {/* CLOSE BUTTON */}

                    <DangerButton
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100"
                    >
                        <i className="fa fa-times"></i>
                    </DangerButton>
                </div>

                {/* BODY */}
                <div className="h-[calc(100vh-81px)] overflow-y-auto p-5">
                    {children}
                </div>
            </div>
        </>
    );
}
