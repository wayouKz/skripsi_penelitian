import ActionDropdown from "@/Components/ActionDropdown";
import DataTable from "@/Components/Datatables";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Siswa() {
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
            header: "Foto",
            accessor: "foto",
        },
        {
            header: "Nisn",
            accessor: "nisn",
        },
        {
            header: "Nama Siswa",
            accessor: "nama_siswa",
        },
        {
            header: "Jenis Kelamin",
            accessor: "tempat_lahir",
        },
        {
            header: "#",
            render: (row) => {
                <ActionDropdown
                    actions={[
                        {
                            label: "Edit",
                            icon: "edit",
                            onClick: () => handleEdit(row),
                        },
                        {
                            label: "Hapus",
                            icon: "trash",
                            danger: true,
                            onClick: () => handleDelete(row.id),
                        },
                    ]}
                />;
            },
        },
    ];
    return (
        <AuthenticatedLayout>
            <DataTable columns={columns} data={[]} />
        </AuthenticatedLayout>
    );
}
