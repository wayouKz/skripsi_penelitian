import { usePage } from "@inertiajs/react";
import { u } from "framer-motion/client";

export default function PrimaryButton({
    className = "",
    disabled = false,
    children,

    ...props
}) {
    const { auth } = usePage().props;

    const features = auth?.list_features || [];

    const url = route().current();
    if (url != "login") {
        const hasAccess = features.some((feature) => {
            const permissions =
                feature.route == url && feature.pivot.can_create == true;
            return permissions;
        });
        if (!hasAccess) return null;
    }

    return (
        <button
            {...props}
            disabled={disabled}
            className={`inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700 focus:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                disabled ? "opacity-25" : ""
            } ${className}`}
        >
            {children}
        </button>
    );
}
