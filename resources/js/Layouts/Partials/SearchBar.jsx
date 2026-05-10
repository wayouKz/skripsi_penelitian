import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import TextInput from "@/Components/TextInput";

const SearchBar = ({ context }) => {
    const searchRef = useRef(null);
    const wrapperRef = useRef(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState(null);

    // Ctrl / Cmd + K focus
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Click outside close dropdown
    useEffect(() => {
        const handler = (e) => {
            if (!wrapperRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Debounce search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setOpen(false);
            return;
        }

        const delay = setTimeout(async () => {
            setLoading(true);
            try {
                const url = new URL(
                    "/getData/" + context,
                    window.location.origin,
                );
                const res = await axios.get(url.toString(), {
                    params: { q: query },
                });

                if (res.data.success == true) {
                    setResults(res.data.data);
                    console.log(res.data.data);
                    setOpen(true);
                } else {
                    setResults([]);
                    setOpen(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [query]);

    return (
        <div
            ref={wrapperRef}
            className="relative flex items-center space-x-4 flex-1 max-w-md"
        >
            <div className="relative flex-1">
                <TextInput
                    icon="search"
                    ref={searchRef}
                    type="text"
                    placeholder="Cari"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length && setOpen(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <kbd className="px-2 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                        Ctrl
                    </kbd>
                    <kbd className="px-2 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                        K
                    </kbd>
                </div>
            </div>

            {/* DROPDOWN */}
            {open && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {loading ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            Mencari...
                        </div>
                    ) : results.length ? (
                        results
                            .filter((item) => item.parent_id != null)
                            .map((item) => {
                                return (
                                    <div key={item.id} className="w-full">
                                        <Link
                                            href={route(`${item.route}`)}
                                            onClick={() => {
                                                setQuery(item.label);
                                                setOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left rounded-md hover:bg-gray-100 transition"
                                        >
                                            <span className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-600">
                                                <i
                                                    className={`fa ${item.icon}`}
                                                />
                                            </span>

                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">
                                                    {item.label}
                                                </span>

                                                {item.deskripsi && (
                                                    <span className="text-xs text-gray-500">
                                                        {item.deskripsi}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            Tidak ada hasil
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
