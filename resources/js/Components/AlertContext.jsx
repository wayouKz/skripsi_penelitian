import { createContext, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AlertContext = createContext();

// ─── Styles ──────────────────────────────────────────────────────────────────

const TOAST_STYLES = {
    success: {
        bg: "rgba(240,253,244,.97)",
        border: "1px solid #86efac",
        shadow: "0 8px 24px rgba(22,163,74,.12)",
        iconBg: "#dcfce7",
        titleColor: "#15803d",
        progress: "#16a34a",
    },
    error: {
        bg: "rgba(254,242,242,.97)",
        border: "1px solid #fca5a5",
        shadow: "0 8px 24px rgba(220,38,38,.12)",
        iconBg: "#fee2e2",
        titleColor: "#b91c1c",
        progress: "#dc2626",
    },
    info: {
        bg: "rgba(239,246,255,.97)",
        border: "1px solid #93c5fd",
        shadow: "0 8px 24px rgba(37,99,235,.12)",
        iconBg: "#dbeafe",
        titleColor: "#1d4ed8",
        progress: "#2563eb",
    },
    warning: {
        bg: "rgba(255,251,235,.97)",
        border: "1px solid #fcd34d",
        shadow: "0 8px 24px rgba(217,119,6,.12)",
        iconBg: "#fef3c7",
        titleColor: "#b45309",
        progress: "#d97706",
    },
};

const LABELS = {
    success: "Sukses!",
    error: "Gagal!",
    info: "Informasi",
    warning: "Peringatan!",
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const ToastIcon = ({ type, size = 18 }) => {
    const props = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        strokeWidth: 2.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };
    const colors = {
        success: "#16a34a",
        error: "#dc2626",
        info: "#2563eb",
        warning: "#d97706",
    };
    const stroke = colors[type] || colors.info;

    if (type === "success")
        return (
            <svg {...props} stroke={stroke}>
                <polyline points="20 6 9 17 4 12" />
            </svg>
        );
    if (type === "error")
        return (
            <svg {...props} stroke={stroke}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        );
    if (type === "info")
        return (
            <svg {...props} stroke={stroke}>
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        );
    return (
        <svg {...props} stroke={stroke}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
};

const ModalIcon = () => (
    <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#16a34a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            animation: "swal_popIn .4s .2s cubic-bezier(.34,1.56,.64,1) both",
        }}
    >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

// ─── Keyframes ────────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes swal_popIn {
  0%   { transform: scale(0) rotate(-12deg); }
  60%  { transform: scale(1.15) rotate(4deg); }
  100% { transform: scale(1) rotate(0deg); }
}
`;

// ─── ModalButton ──────────────────────────────────────────────────────────────

const BTN_STYLES = {
    confirm: {
        background: "#16a34a",
        color: "#fff",
        border: "none",
        boxShadow: "0 4px 16px rgba(22, 163, 74, .3)",
    },
    cancel: {
        background: "#f3f4f6",
        color: "#374151",
        border: "1px solid #e5e7eb",
    },
};

function ModalButton({ onClick, variant, children, customColor }) {
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                padding: "12px 24px",
                borderRadius: 12,
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: ".01em",
                transition: "all .15s",
                ...BTN_STYLES[variant],
                ...(customColor && {
                    background: customColor,
                    boxShadow: `0 4px 16px ${customColor}40`, // Transparansi 25% untuk shadow
                }),
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.08)";
                e.currentTarget.style.transform = "tranprimaryY(-1px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.transform = "none";
            }}
        >
            {children}
        </button>
    );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState(null);

    // 1. Alert Biasa (Pojok Kanan Bawah)
    const showAlert = (message, type = "info", duration = 3000) => {
        setAlert({ type: "alert", message, alertType: type });
        setTimeout(() => setAlert(null), duration);
    };

    // 2. Alert Center bergaya SweetAlert2 (Tidak auto-close kecuali diatur manual)
    const showCenterAlert = (message, type = "info") => {
        setAlert({ type: "center_alert", message, alertType: type });
    };

    // 3. Question (Modal Yes/No)
    const showQuestion = (
        message,
        onConfirm = () => {},
        onCancel = () => {},
        confirmText = "Yes",
        cancelText = "No",
    ) => {
        setAlert({
            type: "question",
            message,
            onConfirm,
            onCancel,
            confirmText,
            cancelText,
        });
    };

    const handleConfirm = () => {
        if (alert?.type === "question") {
            const confirmFn = alert.onConfirm;
            setAlert(null);
            confirmFn?.();
        }
    };

    const handleCancel = () => {
        if (alert?.type === "question") {
            const cancelFn = alert.onCancel;
            setAlert(null);
            cancelFn?.();
        }
    };

    const ts = TOAST_STYLES[alert?.alertType] ?? TOAST_STYLES.info;

    return (
        <AlertContext.Provider
            value={{ showAlert, showCenterAlert, showQuestion }}
        >
            <style>{KEYFRAMES}</style>
            {children}

            <AnimatePresence>
                {/* ── 1. TOAST ALERT (Pojok Kanan Bawah) ── */}
                {alert?.type === "alert" && (
                    <motion.div
                        key="alert-toast"
                        initial={{ opacity: 0, x: 80, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 80, scale: 0.9 }}
                        transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                        }}
                        style={{
                            position: "fixed",
                            bottom: 24,
                            right: 24,
                            zIndex: 9999,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "14px 18px",
                            borderRadius: 16,
                            minWidth: 300,
                            maxWidth: 400,
                            overflow: "hidden",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            background: ts.bg,
                            border: ts.border,
                            boxShadow: ts.shadow,
                            fontFamily:
                                "'Plus Jakarta Sans', system-ui, sans-serif",
                        }}
                    >
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: ts.iconBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <ToastIcon type={alert.alertType} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: ts.titleColor,
                                    marginBottom: 2,
                                }}
                            >
                                {LABELS[alert.alertType] ?? alert.alertType}
                            </div>
                            <div
                                style={{
                                    fontSize: 12.5,
                                    color: "#6b7280",
                                    lineHeight: 1.4,
                                }}
                            >
                                {alert.message}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── 2. CENTER ALERT (Pop up bergaya SweetAlert2) ── */}
                {alert?.type === "center_alert" && (
                    <motion.div
                        key="alert-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setAlert(null); // Tutup saat klik di luar area card
                        }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 9998,
                            background: "rgba(15,15,20,.72)", // Latar gelap
                            backdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <motion.div
                            key="alert-modal"
                            initial={{ opacity: 0, y: 24, scale: 0.85 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.85 }}
                            transition={{
                                type: "spring",
                                stiffness: 360,
                                damping: 26,
                            }}
                            style={{
                                position: "relative",
                                zIndex: 9999,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                background: "#fff", // Card putih bersih
                                borderRadius: 24,
                                padding: "40px 32px 32px",
                                width: 360,
                                boxShadow:
                                    "0 32px 64px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.04)",
                                fontFamily:
                                    "'Plus Jakarta Sans', system-ui, sans-serif",
                            }}
                        >
                            {/* Icon Besar di Tengah */}
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: "50%",
                                    background: ts.iconBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                    animation:
                                        "swal_popIn .4s .1s cubic-bezier(.34,1.56,.64,1) both",
                                }}
                            >
                                <ToastIcon type={alert.alertType} size={40} />
                            </div>

                            {/* Judul */}
                            <div
                                style={{
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: "#111827",
                                    marginBottom: 12,
                                    lineHeight: 1.3,
                                }}
                            >
                                {LABELS[alert.alertType] ?? alert.alertType}
                            </div>

                            {/* Pesan */}
                            <div
                                style={{
                                    fontSize: 15,
                                    color: "#6b7280",
                                    lineHeight: 1.6,
                                    marginBottom: 32,
                                }}
                            >
                                {alert.message}
                            </div>

                            {/* Tombol OK */}
                            <div style={{ display: "flex", width: "100%" }}>
                                <ModalButton
                                    onClick={() => setAlert(null)}
                                    variant="confirm"
                                    customColor={ts.progress} // Tombol menyesuaikan warna tipe (hijau/merah/biru/kuning)
                                >
                                    OK
                                </ModalButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ── 3. QUESTION MODAL (Tidak Berubah) ── */}
                {alert?.type === "question" && (
                    <motion.div
                        key="question-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) handleCancel();
                        }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(15,15,20,.72)",
                            backdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 9999,
                            fontFamily:
                                "'Plus Jakarta Sans', system-ui, sans-serif",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.85, opacity: 0, y: 24 }}
                            transition={{
                                type: "spring",
                                stiffness: 360,
                                damping: 26,
                            }}
                            style={{
                                background: "#fff",
                                borderRadius: 24,
                                padding: "40px 32px 32px",
                                width: 360,
                                textAlign: "center",
                                boxShadow:
                                    "0 32px 64px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.04)",
                            }}
                        >
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: "50%",
                                    background: "#f5f3ff",
                                    border: "6px solid #ede9fe",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                }}
                            >
                                <ModalIcon />
                            </div>
                            <div
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: "#111827",
                                    marginBottom: 10,
                                    lineHeight: 1.3,
                                }}
                            >
                                Lanjutkan tindakan?
                            </div>
                            <div
                                style={{
                                    width: "100%",
                                    height: 1,
                                    background: "#f3f4f6",
                                    marginBottom: 16,
                                }}
                            />
                            <p
                                style={{
                                    fontSize: 14,
                                    color: "#6b7280",
                                    lineHeight: 1.6,
                                    marginBottom: 28,
                                }}
                            >
                                {alert.message}
                            </p>
                            <div style={{ display: "flex", gap: 10 }}>
                                <ModalButton
                                    onClick={handleCancel}
                                    variant="cancel"
                                >
                                    {alert.cancelText}
                                </ModalButton>
                                <ModalButton
                                    onClick={handleConfirm}
                                    variant="confirm"
                                >
                                    {alert.confirmText}
                                </ModalButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AlertContext.Provider>
    );
}

export function useAlert() {
    return useContext(AlertContext);
}
