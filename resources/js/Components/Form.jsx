import PrimaryButton from "./PrimaryButton";

export default function Form({ children, onSubmit, loading }) {
    return (
        <form onSubmit={onSubmit}>
            {/* Body */}
            <div className="space-y-4 px-4 py-4">{children}</div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t px-4 py-3">
                <PrimaryButton
                    type="submit"
                    disabled={loading}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                    {loading ? "Menyimpan..." : "Simpan"}
                </PrimaryButton>
            </div>
        </form>
    );
}
