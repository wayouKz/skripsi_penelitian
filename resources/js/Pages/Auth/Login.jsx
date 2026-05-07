import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
            <div className="mb-4 text-sm text-gray-600">
                <h5 className="font-bold flex justify-center">
                    Selamat Datang Kembali
                </h5>
                <span className="flex justify-center">
                    Silahkan Masuk Ke akun pengajar anda
                </span>
            </div>
            <form onSubmit={submit}>
                <div>
                    <InputLabel
                        htmlFor="email"
                        value="USERNAME"
                        className="p-0"
                    />

                    <TextInput
                        error={errors.username}
                        placeholder="Masukkan username anda"
                        icon="user"
                        id="username"
                        type="text"
                        name="username"
                        value={data.username}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData("username", e.target.value)}
                    />

                    <InputError message={errors.username} className="mt-2" />
                </div>

                <div className="mt-4">
                    <div className="flex justify-between">
                        <InputLabel
                            htmlFor="password"
                            value="PASSWORD"
                            className="p-0"
                        />
                        <div className="flex justify-end">
                            {canResetPassword && (
                                <Link
                                    href={route("password.request")}
                                    className="rounded-md text-sm text-indigo-600  font-bold hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Lupa Kata Sandi?
                                </Link>
                            )}
                        </div>
                    </div>

                    <TextInput
                        error={errors.password}
                        placeholder="Masukkan password anda"
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData("password", e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData("remember", e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Ingat saya di perangkat ini
                        </span>
                    </label>
                </div>

                <div className="mt-4 w-full flex items-center justify-center">
                    <PrimaryButton
                        className="ms-4 w-full p-5 flex items-center justify-center"
                        disabled={processing}
                    >
                        {processing ? (
                            <i className="fa fa-spinner fa-spin"></i>
                        ) : (
                            "Login"
                        )}
                        <i className="fa fa-sign-in ms-2"></i>
                    </PrimaryButton>
                </div>
                <div className="mt-6 w-full flex items-center justify-center gap-3 text-sm text-gray-500">
                    <Link
                        href={route("register")}
                        className="hover:text-indigo-600 transition-colors duration-200"
                    >
                        Pusat Bantuan
                    </Link>

                    {/* Divider */}
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>

                    <Link
                        href={route("register")}
                        className="hover:text-indigo-600 transition-colors duration-200"
                    >
                        Kebijakan Privasi
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
