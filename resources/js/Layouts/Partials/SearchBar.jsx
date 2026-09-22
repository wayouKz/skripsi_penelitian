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
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // CTRL + K
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();

                setShowMobileSearch(true);

                setTimeout(() => {
                    searchRef.current?.focus();
                }, 100);
            }
        };

        window.addEventListener("keydown", handler);

        return () => window.removeEventListener("keydown", handler);
    }, []);

    // CLOSE OUTSIDE
    useEffect(() => {
        const handler = (e) => {
            if (!wrapperRef.current?.contains(e.target)) {
                setOpen(false);

                // MOBILE CLOSE
                if (window.innerWidth < 768) {
                    setShowMobileSearch(false);
                }
            }
        };

        document.addEventListener("mousedown", handler);

        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // SEARCH
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

                if (res.data.success === true) {
                    setResults(res.data.data);
                } else {
                    setResults([]);
                }

                setOpen(true);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [query]);

    return (
        <div ref={wrapperRef} className="relative">
            {/* MOBILE BUTTON */}
            <button
                type="button"
                onClick={() => {
                    setShowMobileSearch(true);

                    setTimeout(() => {
                        searchRef.current?.focus();
                    }, 100);
                }}
                className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition"
            >
                <i className="fa fa-search text-gray-600 text-xs"></i>
            </button>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:flex items-center space-x-3 flex-1 max-w-sm">
                <div className="relative flex-1 w-full">
                    <TextInput
                        icon="search"
                        ref={searchRef}
                        type="text"
                        placeholder="Cari menu..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => results.length && setOpen(true)}
                        className="w-full pl-9 pr-16 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-500"
                    />

                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-100 border rounded">
                            Ctrl
                        </kbd>

                        <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-100 border rounded">
                            K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* MOBILE SEARCH MODAL */}
            {showMobileSearch && (
                <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm md:hidden">
                    <div className="p-3">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            {/* INPUT */}
                            <div className="flex items-center gap-2.5 border-b border-gray-100 px-3 py-2.5">
                                <i className="fa fa-search text-gray-400 text-xs"></i>

                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Cari menu..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full border-none focus:ring-0 text-xs py-1"
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMobileSearch(false);
                                        setOpen(false);
                                    }}
                                    className="text-gray-400 p-1"
                                >
                                    <i className="fa fa-times text-xs"></i>
                                </button>
                            </div>

                            {/* RESULT */}
                            <div className="max-h-[70vh] overflow-y-auto p-1.5">
                                {loading ? (
                                    <div className="px-3 py-4 text-center text-xs text-gray-500">
                                        Mencari...
                                    </div>
                                ) : results.length ? (
                                    results
                                        .filter(
                                            (item) => item.parent_id != null,
                                        )
                                        .map((item) => (
                                            <Link
                                                key={item.id}
                                                href={route(`${item.route}`)}
                                                onClick={() => {
                                                    setQuery(item.label);
                                                    setShowMobileSearch(false);
                                                    setOpen(false);
                                                }}
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-gray-50 transition"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-600 flex-shrink-0">
                                                    <i
                                                        className={`fa ${item.icon} text-xs`}
                                                    />
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-gray-800">
                                                        {item.label}
                                                    </span>

                                                    {item.deskripsi && (
                                                        <span className="text-[10px] text-gray-500">
                                                            {item.deskripsi}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        ))
                                ) : (
                                    <div className="px-3 py-4 text-center text-xs text-gray-500">
                                        Tidak ada hasil
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DESKTOP DROPDOWN */}
            {open && (
                <div className="hidden md:block absolute top-full mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    {loading ? (
                        <div className="px-3 py-3 text-xs text-gray-500">
                            Mencari...
                        </div>
                    ) : results.length ? (
                        results
                            .filter((item) => item.parent_id != null)
                            .map((item) => (
                                <Link
                                    key={item.id}
                                    href={route(`${item.route}`)}
                                    onClick={() => {
                                        setQuery(item.label);
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 flex-shrink-0">
                                        <i
                                            className={`fa ${item.icon} text-xs`}
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-gray-800">
                                            {item.label}
                                        </span>

                                        {item.deskripsi && (
                                            <span className="text-[10px] text-gray-500">
                                                {item.deskripsi}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))
                    ) : (
                        <div className="px-3 py-3 text-xs text-gray-500">
                            Tidak ada hasil
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
