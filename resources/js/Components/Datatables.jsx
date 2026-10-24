import { useState, useMemo, useEffect } from "react";
import AppSelect from "./AppSelect";
import TextInput from "./TextInput";

const PER_PAGE_OPTIONS = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
];

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

    useEffect(() => {
        setCurrentPage(1);
    }, [data, search]);

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

    const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return sortedData.slice(start, start + rowsPerPage);
    }, [sortedData, currentPage, rowsPerPage]);

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [1];

        if (currentPage > 4) pages.push("...");

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 3) pages.push("...");

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

    const rowsPerPageValue =
        PER_PAGE_OPTIONS.find((o) => o.value === rowsPerPage) ||
        PER_PAGE_OPTIONS[0];

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                {searchable && (
                    <div className="w-full sm:w-64">
                        <TextInput
                            icon="search"
                            placeholder="Cari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="text-xs py-1.5 rounded-xl"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 justify-end">
                    <div className="w-[90px]">
                        <AppSelect
                            value={rowsPerPageValue}
                            onChange={(option) => {
                                setRowsPerPage(Number(option?.value ?? 10));
                                setCurrentPage(1);
                            }}
                            options={PER_PAGE_OPTIONS}
                            isSearchable={false}
                            menuPlacement="auto"
                        />
                    </div>
                    <span className="whitespace-nowrap text-gray-400">
                        data
                    </span>
                </div>
            </div>

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
                                                        } text-primary-500 text-xs`}
                                                    />
                                                )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
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
                                        className="transition-colors hover:bg-primary-50/30"
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

            {!loading && sortedData.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
                    <div className="text-[11px] text-gray-400 font-medium text-center sm:text-left">
                        Menampilkan {(currentPage - 1) * rowsPerPage + 1} sampai{" "}
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
                                            ? "bg-primary-600 text-white shadow-sm shadow-primary-100"
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
