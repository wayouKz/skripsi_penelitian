export default function Avatar({ name, size = "sm", color = "primary" }) {
    const initials = name
        .split(" ")
        .map((k) => k.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sizes = { sm: "w-7 h-7 text-[11px]", md: "w-8 h-8 text-xs" };
    const colors = {
        primary: "bg-primary-100 text-primary-700",
        violet: "bg-violet-100 text-violet-700",
        sky: "bg-sky-100 text-sky-700",
    };

    return (
        <span
            className={`inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 ${sizes[size]} ${colors[color]}`}
        >
            {initials}
        </span>
    );
}
