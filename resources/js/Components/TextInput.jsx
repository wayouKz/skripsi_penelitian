import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";

export default forwardRef(function TextInput(
    {
        type = "text",
        className = "",
        isFocused = false,
        icon = "user",
        error,
        ...props
    },
    ref,
) {
    const localRef = useRef(null);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <div className="relative w-full group">
            {/* Icon kiri */}
            <i
                className={`fa ${isPassword ? "fa-lock" : "fa-" + icon}
                absolute left-3 top-1/2 -translate-y-1/2
                text-gray-400 transition-all duration-300
                group-focus-within:opacity-0 group-focus-within:-translate-x-2`}
            ></i>

            {/* Input */}
            <input
                {...props}
                type={inputType}
                ref={localRef}
                className={
                    "w-full pl-10 pr-10 py-2 rounded-md border-gray-300 shadow-sm bg-gray-100 " +
                    (error
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500 "
                        : "focus:border-indigo-500 focus:ring-indigo-500 ") +
                    "transition-all duration-300 group-focus-within:pl-3 " +
                    className
                }
            />

            {/* Icon mata (kanan) */}
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <i
                        className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                </button>
            )}
        </div>
    );
});
