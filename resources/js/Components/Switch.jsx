export default function Switch({
    checked = false,
    onChange,
    disabled = false,
    loading = false,

    // variant
    variant = "switch", // switch | button

    // label
    onLabel = "",
    offLabel = "",

    // hidden input
    name,
    valueOn = 1,
    valueOff = 0,
}) {
    const isDisabled = disabled || loading;

    const handleToggle = () => {
        if (!isDisabled && onChange) {
            onChange(!checked);
        }
    };

    // =========================
    // BUTTON VARIANT
    // =========================
    if (variant === "button") {
        return (
            <>
                {name && (
                    <input
                        type="hidden"
                        name={name}
                        value={checked ? valueOn : valueOff}
                    />
                )}

                <button
                    type="button"
                    disabled={isDisabled}
                    onClick={handleToggle}
                    className={`
                        inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition
                        ${
                            checked
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-100 text-gray-600"
                        }
                        ${
                            isDisabled
                                ? "cursor-not-allowed opacity-50"
                                : "hover:scale-[1.02]"
                        }
                    `}
                >
                    {loading ? (
                        <i className="fa fa-spinner fa-spin"></i>
                    ) : (
                        <i
                            className={`fa ${
                                checked ? "fa-check-circle" : "fa-times-circle"
                            }`}
                        ></i>
                    )}

                    <span>
                        {loading ? "Loading..." : checked ? onLabel : offLabel}
                    </span>
                </button>
            </>
        );
    }

    // =========================
    // SWITCH VARIANT
    // =========================
    return (
        <div className="flex items-center gap-2">
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={checked ? valueOn : valueOff}
                />
            )}

            <button
                type="button"
                disabled={isDisabled}
                onClick={handleToggle}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition
                    ${checked ? "bg-indigo-500" : "bg-gray-300"}
                    ${isDisabled ? "cursor-not-allowed opacity-50" : ""}
                `}
            >
                <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition
                        ${checked ? "translate-x-6" : "translate-x-1"}
                    `}
                />
            </button>

            <span className="text-sm text-gray-600">
                {loading ? "Loading..." : checked ? onLabel : offLabel}
            </span>
        </div>
    );
}
