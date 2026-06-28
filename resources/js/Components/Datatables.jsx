import { useState, useMemo, useEffect } from "react";

export default function DataTable({
    columns,
    data = [],
    searchable = true,
    perPage = 10,
    loading,
    sortable = true,
    header,
    title,
}) {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(perPage);
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    // Reset halaman ke 1 jika data mentah atau kata kunci pencarian berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [data, search]);

    // 1. OPTIMASI: SEARCH/FILTERING DILAKUKAN TERLEBIH DAHULU
    const filteredData = useMemo(() => {
        if (!search) return data;

        const searchLower = search.toLowerCase();
        return data.filter((row) =>
            columns.some((col) => {
                if (!col.accessor) return false;

                // Ambil nilai properti secara aman (null-safe)
                const value = row[col.accessor];
                if (value === null || value === undefined) return false;

                return String(value).toLowerCase().includes(searchLower);
            }),
        );
    }, [data, search, columns]);

    // 2. OPTIMASI: SORTING HANYA MEMPROSES DATA YANG SUDAH TERFILTER
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            if (typeof aVal === "string") {
                return sortConfig.direction === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        });
    }, [filteredData, sortConfig]);

    // 3. PAGINATION CALCULATIONS
    const totalPages = Math.ceil(sortedData.length / rowsPerPage);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return sortedData.slice(start, start + rowsPerPage);
    }, [sortedData, currentPage, rowsPerPage]);

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [1];

        if (currentPage > 4) {
            pages.push("...");
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 3) {
            pages.push("...");
        }

        pages.push(totalPages);
        return pages;
    };

    const handleSort = (key) => {
        if (!sortable) return;

        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    return (
        <div className="w-full">
            {/* TOPBAR */}
            <div className="flex items-center gap-4 p-2 mb-4">
                <h2 className="text-xl font-bold text-gray-800">{header}</h2>
                {title && (
                    <span className="px-2.5 py-1 text-xs font-semibold uppercase rounded-full bg-green-100 text-green-700">
                        {sortedData.length} {title}
                    </span>
                )}
            </div>

            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {searchable && (
                    <div className="relative w-full md:w-72">
                        <i className="fa fa-search absolute left-3.5 top-3.5 text-sm text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:shadow-sm"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 justify-end">
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="rounded-xl border border-gray-200 px-7 py-2 outline-none focus:border-green-500 bg-white"
                    >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                    </select>
                </div>
            </div>

            {/* TABLE CONTAINER */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50/70 border-b border-gray-100">
                            <tr>
                                {columns.map((col, index) => (
                                    <th
                                        key={index}
                                        onClick={() =>
                                            col.accessor &&
                                            handleSort(col.accessor)
                                        }
                                        className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 select-none ${
                                            col.accessor && sortable
                                                ? "cursor-pointer hover:bg-gray-100/70 transition"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>{col.header}</span>
                                            {sortable &&
                                                col.accessor &&
                                                sortConfig.key ===
                                                    col.accessor && (
                                                    <i
                                                        className={`fa-solid ${sortConfig.direction === "asc" ? "fa-sort-up" : "fa-sort-down"} text-green-500`}
                                                    />
                                                )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-12 text-center"
                                    >
                                        <i className="fa-solid fa-spinner fa-spin text-2xl text-green-500"></i>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-12 text-center text-sm text-gray-400"
                                    >
                                        Tidak ada kecocokan data ditemukan
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="transition-colors hover:bg-green-50/30"
                                    >
                                        {columns.map((col, colIndex) => (
                                            <td
                                                key={colIndex}
                                                className="px-4 py-3.5 text-sm text-gray-600 max-w-sm truncate"
                                            >
                                                {col.render
                                                    ? col.render(row, rowIndex)
                                                    : (row[col.accessor] ??
                                                      "-")}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION FOOTER */}
            {!loading && totalPages > 0 && (
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                    <div className="text-xs text-gray-400 font-medium text-center sm:text-left">
                        Menampilkan{" "}
                        {sortedData.length === 0
                            ? 0
                            : (currentPage - 1) * rowsPerPage + 1}{" "}
                        sampai{" "}
                        {Math.min(currentPage * rowsPerPage, sortedData.length)}{" "}
                        dari {sortedData.length}
                    </div>

                    <div className="flex items-center gap-1 justify-center">
                        <button
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage((p) => Math.max(p - 1, 1))
                            }
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white select-none"
                        >
                            Prev
                        </button>

                        {getPageNumbers().map((page, index) =>
                            page === "..." ? (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-2 py-2 text-xs text-gray-400 select-none"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition select-none ${
                                        currentPage === page
                                            ? "bg-green-600 text-white shadow-sm shadow-green-100"
                                            : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    {page}
                                </button>
                            ),
                        )}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                                setCurrentPage((p) =>
                                    Math.min(p + 1, totalPages),
                                )
                            }
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white select-none"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
