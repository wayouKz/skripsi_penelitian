import Modal from "@/Components/Modal";
import DangerButton from "./DangerButton";
import PrimaryButton from "./PrimaryButton";

export default function FormModal({
    show,
    onClose,
    title = "Form",
    onSubmit,
    loading = false,
    maxWidth = "2xl",
    children,
    showForm = true,
    closeable = true,
}) {
    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth={maxWidth}
            closeable={closeable}
        >
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-2.5 bg-white shrink-0">
                    <h2 className="text-sm font-bold text-gray-800">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition text-xs font-bold p-1 rounded-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Wrapper */}
                {showForm ? (
                    <form
                        onSubmit={onSubmit}
                        className="flex flex-1 flex-col overflow-hidden bg-white"
                    >
                        {/* Body */}
                        <div className="flex-1 overflow-y-auto space-y-3 px-4 py-3">
                            {children}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 border-t px-4 py-3 bg-gray-50 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                            >
                                Batal
                            </button>

                            <PrimaryButton
                                type="submit"
                                disabled={loading}
                                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 shadow-sm"
                            >
                                {loading ? "Menyimpan..." : "Simpan"}
                            </PrimaryButton>
                        </div>
                    </form>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-3 px-4 py-3">
                        {children}
                    </div>
                )}
            </div>
        </Modal>
    );
}
