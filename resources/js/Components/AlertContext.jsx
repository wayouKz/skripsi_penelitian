import { createContext, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AlertContext = createContext();

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState(null);

    /**
     * showAlert: alert biasa (info, success, error)
     * showQuestion: alert pertanyaan dengan callback confirm/cancel
     */

    const showAlert = (message, type = "info", duration = 3000) => {
        setAlert({ type: "alert", message, alertType: type });
        setTimeout(() => setAlert(null), duration);
    };

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
    return (
        <AlertContext.Provider value={{ showAlert, showQuestion }}>
            {children}

            <AnimatePresence>
                {alert && alert.type === "alert" && (
                    <motion.div
                        key="alert"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: "fixed",
                            bottom: "20px",
                            right: "20px",
                            padding: "10px 20px",
                            backgroundColor:
                                alert.alertType === "success"
                                    ? "green"
                                    : alert.alertType === "error"
                                      ? "red"
                                      : "blue",
                            color: "white",
                            borderRadius: "5px",
                        }}
                    >
                        {alert.message}
                    </motion.div>
                )}

                {alert && alert.type === "question" && (
                    <motion.div
                        key="question-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 9999,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                backgroundColor: "white",
                                padding: "20px",
                                borderRadius: "10px",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                                minWidth: "300px",
                                maxWidth: "400px",
                                textAlign: "center",
                            }}
                        >
                            <p style={{ marginBottom: "20px" }}>
                                {alert.message}
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "10px",
                                }}
                            >
                                <button
                                    onClick={handleConfirm}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "5px",
                                        border: "none",
                                        backgroundColor: "green",
                                        color: "white",
                                        cursor: "pointer",
                                    }}
                                >
                                    {alert.confirmText}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "5px",
                                        border: "none",
                                        backgroundColor: "red",
                                        color: "white",
                                        cursor: "pointer",
                                    }}
                                >
                                    {alert.cancelText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AlertContext.Provider>
    );
}

// Hook untuk akses context dengan mudah
export function useAlert() {
    return useContext(AlertContext);
}
