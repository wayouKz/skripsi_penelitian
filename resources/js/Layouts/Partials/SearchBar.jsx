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
                className="flex md:hidden items-center justify-center w-11 h-11 rounded-2xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition"
            >
                <i className="fa fa-search text-gray-600"></i>
            </button>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md">
                <div className="relative flex-1 w-full">
                    <TextInput
                        icon="search"
                        ref={searchRef}
                        type="text"
                        placeholder="Cari menu..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => results.length && setOpen(true)}
                        className="w-full pl-10 pr-20 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500"
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="px-2 py-0.5 text-xs bg-gray-100 border rounded">
                            Ctrl
                        </kbd>

                        <kbd className="px-2 py-0.5 text-xs bg-gray-100 border rounded">
                            K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* MOBILE SEARCH MODAL */}
            {showMobileSearch && (
                <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm md:hidden">
                    <div className="p-4">
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                            {/* INPUT */}
                            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                                <i className="fa fa-search text-gray-400"></i>

                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Cari menu..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full border-none focus:ring-0 text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMobileSearch(false);
                                        setOpen(false);
                                    }}
                                    className="text-gray-400"
                                >
                                    <i className="fa fa-times"></i>
                                </button>
                            </div>

                            {/* RESULT */}
                            <div className="max-h-[70vh] overflow-y-auto p-2">
                                {loading ? (
                                    <div className="px-4 py-6 text-center text-sm text-gray-500">
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
                                                className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-gray-50 transition"
                                            >
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                                    <i
                                                        className={`fa ${item.icon}`}
                                                    />
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        {item.label}
                                                    </span>

                                                    {item.deskripsi && (
                                                        <span className="text-xs text-gray-500">
                                                            {item.deskripsi}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        ))
                                ) : (
                                    <div className="px-4 py-6 text-center text-sm text-gray-500">
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
                <div className="hidden md:block absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {loading ? (
                        <div className="px-4 py-4 text-sm text-gray-500">
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
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                                        <i className={`fa ${item.icon}`} />
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-800">
                                            {item.label}
                                        </span>

                                        {item.deskripsi && (
                                            <span className="text-xs text-gray-500">
                                                {item.deskripsi}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))
                    ) : (
                        <div className="px-4 py-4 text-sm text-gray-500">
                            Tidak ada hasil
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
