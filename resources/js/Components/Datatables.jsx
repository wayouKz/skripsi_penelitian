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
            {/* <div className="flex items-center gap-4 p-2 mb-4">
        <h2 className="text-base font-bold text-gray-800">{header}</h2>
        {title && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-green-100 text-green-700">
                {sortedData.length} {title}
            </span>
        )}
    </div> */}

            <div className="mb-4 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                {searchable && (
                    <div className="relative w-full md:w-64">
                        <i className="fa fa-search absolute left-3 top-2.5 text-xs text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 pl-9 pr-3 text-xs outline-none transition focus:border-green-500 focus:bg-white focus:shadow-sm"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 justify-end">
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="rounded-xl border border-gray-200 px-6 py-1.5 text-xs outline-none focus:border-green-500 bg-white"
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
                                        className={`px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none ${
                                            col.accessor && sortable
                                                ? "cursor-pointer hover:bg-gray-100/70 transition"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>{col.header}</span>
                                            {sortable &&
                                                col.accessor &&
                                                sortConfig.key ===
                                                    col.accessor && (
                                                    <i
                                                        className={`fa-solid ${
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "fa-sort-up"
                                                                : "fa-sort-down"
                                                        } text-green-500 text-xs`}
                                                    />
                                                )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                /* SKELETON LOADING */
                                Array.from({ length: 5 }).map((_, rowIndex) => (
                                    <tr key={`skeleton-row-${rowIndex}`}>
                                        {columns.map((_, colIndex) => (
                                            <td
                                                key={`skeleton-col-${colIndex}`}
                                                className="px-3 py-3"
                                            >
                                                <div
                                                    className={`h-3.5 bg-gray-200 rounded-lg animate-pulse ${
                                                        colIndex === 0
                                                            ? "w-10"
                                                            : colIndex ===
                                                                columns.length -
                                                                    1
                                                              ? "w-16"
                                                              : "w-3/4"
                                                    }`}
                                                ></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-8 text-center text-xs text-gray-400"
                                    >
                                        Tidak ada data
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
                                                className="px-3 py-2.5 text-xs text-gray-600 max-w-sm truncate"
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
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
                    <div className="text-[11px] text-gray-400 font-medium text-center sm:text-left">
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
                            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white select-none"
                        >
                            Prev
                        </button>

                        {getPageNumbers().map((page, index) =>
                            page === "..." ? (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-1.5 py-1.5 text-[11px] text-gray-400 select-none"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`min-w-[30px] h-7 rounded-xl text-[11px] font-bold transition select-none ${
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
                            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white select-none"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
