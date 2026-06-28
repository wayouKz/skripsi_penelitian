import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";
import axios from "axios";

export default function Installer() {
    const { data, setData, post, processing, errors } = useForm({
        db_host: "127.0.0.1",
        db_port: "3306",
        db_name: "skripsi_penelitian",
        db_user: "root",
        db_pass: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("install.store"));
    };

    return (
        <GuestLayout>
            <Head title="Installer" />

            <h2 className="text-2xl font-bold text-center mb-2">
                Cofigurasi Database
            </h2>
            <p className="text-center text-gray-500 mb-6">
                Configure your database to continue installation
            </p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Database Host
                    </label>
                    <TextInput
                        type="text"
                        className="w-full"
                        value={data.db_host}
                        onChange={(e) => setData("db_host", e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Database Port
                    </label>
                    <TextInput
                        type="text"
                        className="w-full"
                        value={data.db_port}
                        onChange={(e) => setData("db_port", e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Database Name
                    </label>
                    <TextInput
                        type="text"
                        className="w-full"
                        value={data.db_name}
                        onChange={(e) => setData("db_name", e.target.value)}
                    />
                    {errors.db_name && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.db_name}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Database User
                    </label>
                    <TextInput
                        type="text"
                        className="w-full"
                        value={data.db_user}
                        onChange={(e) => setData("db_user", e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Database Password
                    </label>
                    <TextInput
                        type="password"
                        className="w-full"
                        value={data.db_pass}
                        onChange={(e) => setData("db_pass", e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
                >
                    {processing ? "Installing..." : "Install Application"}
                </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
                © {new Date().getFullYear()} Installer
            </p>
        </GuestLayout>
    );
}
