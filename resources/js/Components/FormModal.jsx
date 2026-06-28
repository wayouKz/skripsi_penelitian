import Modal from "@/Components/Modal";
import DangerButton from "./DangerButton";
import PrimaryButton from "./PrimaryButton";

export default function FormModal({
    show,
    onClose,
    title = "Form",
    onSubmit,
    loading = false,
    maxWidth = "2xl", // Dibuat full screen secara bawaan
    children,
    showForm = true,
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth={maxWidth}>
            {/* Wrapper utama dijadikan flex column agar memenuhi tinggi modal */}
            <div className="flex h-full flex-col">
                {/* Header - Tetap di Atas */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-white shrink-0">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <DangerButton type="button" onClick={onClose}>
                        ✕
                    </DangerButton>
                </div>

                {/* Form Wrapper - flex-1 agar mengisi ruang sisa antara Header dan Footer */}
                {(showForm && (
                    <form
                        onSubmit={onSubmit}
                        className="flex flex-1 flex-col overflow-hidden bg-white"
                    >
                        {/* Body - Diberi overflow-y-auto agar hanya bagian isi form yang bisa di-scroll */}
                        <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
                            {children}
                        </div>

                        {/* Footer - Tetap di Bawah */}
                        <div className="flex justify-end gap-2 border-t px-4 py-4 bg-gray-50 shrink-0">
                            <DangerButton
                                type="button"
                                onClick={onClose}
                                className="rounded px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                Batal
                            </DangerButton>

                            <PrimaryButton
                                type="submit"
                                disabled={loading}
                                className="rounded bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                {loading ? "Menyimpan..." : "Simpan"}
                            </PrimaryButton>
                        </div>
                    </form>
                )) || (
                    <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
                        {children}
                    </div>
                )}
            </div>
        </Modal>
    );
}
