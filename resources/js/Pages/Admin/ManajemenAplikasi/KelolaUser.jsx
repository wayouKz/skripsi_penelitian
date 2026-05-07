import DataTable from "@/Components/Datatables";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function KelolaUser() {
    const columns = [
        {
            header: "No",
            render: (_, i) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {i + 1}
                </span>
            ),
        },
        {
            header: "Nama User",
            accessor: "name",
        },
        {
            header: "Username",
            accessor: "username",
        },
    ];
    return (
        <AuthenticatedLayout>
            <DataTable columns={columns} data={[]} />
        </AuthenticatedLayout>
    );
}
