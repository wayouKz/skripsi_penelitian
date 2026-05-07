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
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth={maxWidth}>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-lg font-semibold">{title}</h2>
                <DangerButton
                    type="button"
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </DangerButton>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit}>
                {/* Body */}
                <div className="space-y-4 px-4 py-4">{children}</div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded bg-gray-300 px-4 py-2 text-sm"
                    >
                        Batal
                    </button>

                    <PrimaryButton
                        type="submit"
                        disabled={loading}
                        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {loading ? "Menyimpan..." : "Simpan"}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
