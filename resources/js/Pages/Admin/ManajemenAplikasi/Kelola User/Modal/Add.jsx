import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect } from "react";

export default function Add({ open, setOpen, selectedData }) {
    const { data, setData, errors, processing, post } = useForm({
        name: "",
        username: "",
    });
    const flash = usePage().props.flash;
    const { showAlert } = useAlert();
    useEffect(() => {
        if (selectedData) {
            setData({
                name: selectedData.name || "",
                username: selectedData.username || "",
            });
        }
    }, [selectedData]);
    const onSubmit = (e) => {
        e.preventDefault();
        post(route("manajemen.kelola-user.update", { id: selectedData.id }), {
            onSuccess: () => {
                setOpen(false);
                showAlert(flash.success, "success");
            },
            onError: () => {
                showAlert(flash.error, "error");
            },
        });
    };
    return (
        <FormModal
            onSubmit={onSubmit}
            show={open}
            loading={processing}
            onClose={() => setOpen(false)}
            title={"Edit User: " + (selectedData?.name || "")}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <InputLabel htmlFor="name" value="Nama User" />

                        <TextInput
                            id="name"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />

                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="col-span-1">
                        <InputLabel htmlFor="username" value="Username" />

                        <TextInput
                            id="username"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.username}
                            onChange={(e) =>
                                setData("username", e.target.value)
                            }
                        />

                        <InputError
                            message={errors.username}
                            className="mt-2"
                        />
                    </div>
                </div>
            </div>
        </FormModal>
    );
}
