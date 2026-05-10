import ActionDropdown from "@/Components/ActionDropdown";
import { useAlert } from "@/Components/AlertContext";
import DataTable from "@/Components/Datatables";
import Switch from "@/Components/Switch";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import Add from "./Modal/Add";

export default function KelolaUser() {
    const [data, setData] = useState([]);
    const { showAlert, showQuestion } = useAlert();
    const [open, setOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [onSubmit, setOnSubmit] = useState("");
    const getData = async () => {
        await axios.get(route("manajemen.kelola-user.getUser")).then((res) => {
            if (res.data.status == false) {
                setData([]);
            } else {
                setData(res.data.data);
            }
        });
    };
    const handleStatus = (row) => {};
    useEffect(() => {
        getData();
    }, []);

    const handleEdit = (row) => {
        setOpen(true);
        setSelectedData(row);
        setOnSubmit(route("manajemen.kelola-user.update"));
    };

    const handleReset = (row) => {
        showQuestion(
            `Anda yakin ingin mereset password ${row.name}?
            Password akan diatur ulang ke default `,
            () => {
                axios
                    .post(route("manajemen.kelola-user.reset-password"), {
                        nip: row.nip,
                    })
                    .then((res) => {
                        if (res.data.success == true) {
                            showAlert(res.data.msg, "success");
                            getData();
                        } else if (res.data.success == false) {
                            showAlert(res.data.msg, "error");
                        }
                    });
            },
            () => {},
            "Reset",
            "Batal",
        );
    };
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
        {
            header: "Status",
            render: (row) => (
                <Switch
                    checked={row.status == "active" ? true : false}
                    onChange={() => handleStatus(row)}
                />
            ),
        },
        {
            header: "#",
            render(row) {
                return (
                    <ActionDropdown
                        actions={[
                            {
                                label: "Edit",
                                icon: "edit",
                                edit: true,
                                onClick: () => handleEdit(row),
                            },
                            {
                                label: "Reset Password",
                                icon: "key",
                                edit: true,
                                onClick: () => handleReset(row),
                            },
                            {
                                label: "Hapus",
                                icon: "trash",
                                danger: true,
                                onClick: () => handleDelete(row.id),
                            },
                        ]}
                    />
                );
            },
        },
    ];
    return (
        <AuthenticatedLayout header={"Kelola User"}>
            <DataTable columns={columns} data={data} />
            <Add
                open={open}
                setOpen={setOpen}
                selectedData={selectedData}
                onSubmit={onSubmit}
            />
        </AuthenticatedLayout>
    );
}
