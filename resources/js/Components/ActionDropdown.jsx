import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ActionDropdown({ actions = [] }) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + window.scrollY,
                left: rect.right + window.scrollX - 150,
            });
        }
    }, [open]);

    useEffect(() => {
        const close = (e) => {
            if (
                !buttonRef.current?.contains(e.target) &&
                !menuRef.current?.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                className="rounded px-2 py-1 hover:bg-gray-200"
            >
                ⋮
            </button>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            top: pos.top,
                            left: pos.left,
                            position: "absolute",
                        }}
                        className="z-[9999] w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                    >
                        {actions.map((a, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    a.onClick();
                                    setOpen(false);
                                }}
                                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                    a.danger ? "text-red-600" : ""
                                }${a.edit ? "text-yellow-400" : ""}`}
                            >
                                <i className={"fa fa-" + a.icon}></i> {a.label}
                            </button>
                        ))}
                    </div>,
                    document.body,
                )}
        </>
    );
}
