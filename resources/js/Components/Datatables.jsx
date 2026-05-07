import { useState, useMemo, useEffect } from "react";

export default function DataTable({
    columns,
    data,
    searchable = true,
    perPage = 10,
    loading,
    sortable = true,
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
    }, [data]);

    // SORT
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (typeof aVal === "string") {
                return sortConfig.direction === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        });
    }, [data, sortConfig]);

    // SEARCH
    const filteredData = useMemo(() => {
        if (!search) return sortedData;

        return sortedData.filter((row) =>
            columns.some((col) =>
                col.accessor
                    ? String(row[col.accessor] ?? "")
                          .toLowerCase()
                          .includes(search.toLowerCase())
                    : false,
            ),
        );
    }, [search, sortedData, columns]);

    // PAGINATION
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;

        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    const handleSort = (key) => {
        if (!sortable) return;

        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {/* TOPBAR */}
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {searchable && (
                    <div className="relative w-full md:w-72">
                        <i className="fa fa-search absolute left-3 top-3 text-sm text-gray-400"></i>

                        <input
                            type="text"
                            placeholder="Cari data..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Tampilkan</span>

                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500"
                    >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                    </select>

                    <span>data</span>
                </div>
            </div>

            {/* TABLE */}
            <div className="overflow-hidden rounded-2xl border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {columns.map((col, index) => (
                                    <th
                                        key={index}
                                        onClick={() =>
                                            col.accessor &&
                                            handleSort(col.accessor)
                                        }
                                        className={`px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${
                                            col.accessor ? "cursor-pointer" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.header}

                                            {sortConfig.key ===
                                                col.accessor && (
                                                <i
                                                    className={`fa ${
                                                        sortConfig.direction ===
                                                        "asc"
                                                            ? "fa-sort-up"
                                                            : "fa-sort-down"
                                                    } text-indigo-500`}
                                                />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-10 text-center"
                                    >
                                        <i className="fa fa-spinner fa-spin text-indigo-500"></i>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-10 text-center text-gray-400"
                                    >
                                        Tidak ada data
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="transition hover:bg-indigo-50/40"
                                    >
                                        {columns.map((col, colIndex) => (
                                            <td
                                                key={colIndex}
                                                className="whitespace-nowrap px-6 py-5 text-sm text-gray-700"
                                            >
                                                {col.render
                                                    ? col.render(row, rowIndex)
                                                    : row[col.accessor]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FOOTER */}
            {!loading && totalPages > 0 && (
                <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-gray-400">
                        Menampilkan {(currentPage - 1) * rowsPerPage + 1} sampai{" "}
                        {Math.min(
                            currentPage * rowsPerPage,
                            filteredData.length,
                        )}{" "}
                        dari {filteredData.length} data
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage((p) => Math.max(p - 1, 1))
                            }
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            Prev
                        </button>

                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                        ).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-[40px] rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    currentPage === page
                                        ? "bg-indigo-500 text-white"
                                        : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                                setCurrentPage((p) =>
                                    Math.min(p + 1, totalPages),
                                )
                            }
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
