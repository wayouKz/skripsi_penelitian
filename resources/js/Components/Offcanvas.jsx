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
    staticBackdrop = false,
    closeOnEsc = true,
    showBackdrop = true,
}) {
    useEffect(() => {
        if (!closeOnEsc) return;

        const handleEsc = (e) => {
            if (e.key === "Escape" && open) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
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
                    className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-all duration-300 ${
                        open ? "visible opacity-100" : "invisible opacity-0"
                    }`}
                />
            )}

            {/* PANEL */}
            <div
                className={`fixed top-0 z-50 h-screen ${width} bg-white shadow-xl transition-all duration-300 ${
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
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-primary-800 flex items-center gap-1.5 truncate">
                        {icon} <span className="truncate">{title}</span>
                    </h2>

                    {/* CLOSE BUTTON */}
                    <DangerButton
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 p-0"
                    >
                        <i className="fa fa-times text-xs"></i>
                    </DangerButton>
                </div>

                {/* BODY */}
                <div className="h-[calc(100vh-53px)] overflow-y-auto p-4">
                    {children}
                </div>
            </div>
        </>
    );
}
