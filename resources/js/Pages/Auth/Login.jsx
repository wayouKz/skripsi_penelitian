import { useState } from "react";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Login({ status, canResetPassword }) {
    const [captchaKey, setCaptchaKey] = useState(Date.now());
    const [isCaptchaLoading, setIsCaptchaLoading] = useState(true);

    const { data, setData, post, processing, errors, reset } = useForm({
        username: "superadmin",
        password: "superadmin",
        remember: false,
        captcha: "",
    });
    const currentYear = new Date().getFullYear();
    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
            onError: () => setCaptchaKey(Date.now()),
        });
    };

    const refreshCaptcha = () => {
        setIsCaptchaLoading(true);
        setCaptchaKey(Date.now());
    };

    return (
        <>
            <Head title="Log in" />

            <div className="flex bg-white min-h-screen overflow-x-hidden">
                {/* KOLOM KIRI: Latar Belakang Gambar Sekolah
                  Sembunyi di HP (hidden), tampil separuh layar di Desktop (lg:flex)
                */}
                <div
                    className="hidden lg:flex w-full lg:w-1/2 relative bg-cover bg-center"
                    style={{
                        backgroundImage:
                            "url('/assets/bg-login/bg-login-1.jpg')",
                        // Tambahkan ini jika gambar tetap menyebabkan overflow
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    {/* Overlay Gradient Hijau agar teks terbaca dan tampil elegan */}
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 via-green-900/40 to-transparent"></div>

                    {/* Teks Sambutan di atas gambar */}
                    <div className="absolute bottom-0 left-0 p-12 text-white w-full">
                        <div className="mb-4 inline-block px-3 py-1 rounded-full bg-green-500/30 border border-green-400/50 backdrop-blur-sm text-sm font-semibold tracking-wider">
                            SISTEM INFORMASI AKADEMIK
                        </div>
                        <h1 className="text-4xl font-extrabold mb-3 leading-tight shadow-sm">
                            Portal Layanan &<br />
                            Manajemen Sekolah
                        </h1>
                        <p className="text-green-50 text-lg max-w-md font-light">
                            Silakan masuk menggunakan kredensial Anda untuk
                            mengakses dashboard presensi, jadwal, dan
                            administrasi.
                        </p>
                    </div>
                </div>

                {/* KOLOM KANAN: Form Login
                  Penuh di HP, separuh layar di Desktop
                */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-24 bg-white relative">
                    {/* Lingkaran Dekorasi Halus di Background Form (Opsional) */}
                    <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="w-full max-w-md relative z-10">
                        {status && (
                            <div className="mb-6 text-sm font-medium text-green-600 bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-2">
                                <i className="fa fa-check-circle text-lg"></i>
                                {status}
                            </div>
                        )}

                        {/* Bagian Header Form */}
                        <div className="mb-10 text-left">
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                Selamat Datang
                            </h2>
                            <p className="mt-2 text-base text-gray-500">
                                Masukkan username dan password Anda.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Input Username */}
                            <div>
                                <InputLabel
                                    htmlFor="username"
                                    value="USERNAME"
                                    className="text-xs font-bold text-gray-700 tracking-wide"
                                />
                                <TextInput
                                    error={errors.username}
                                    placeholder="Ketik username Anda"
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={data.username}
                                    className="mt-1.5 block w-full bg-gray-50 border-gray-200 focus:bg-white focus:ring-green-500 focus:border-green-500 transition-colors"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData("username", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.username}
                                    className="mt-2"
                                />
                            </div>

                            {/* Input Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <InputLabel
                                        htmlFor="password"
                                        value="PASSWORD"
                                        className="text-xs font-bold text-gray-700 tracking-wide mb-0"
                                    />
                                    {canResetPassword && (
                                        <Link
                                            href={route("password.request")}
                                            className="text-xs font-semibold text-green-600 hover:text-green-700 focus:outline-none transition-colors"
                                        >
                                            Lupa Sandi?
                                        </Link>
                                    )}
                                </div>
                                <TextInput
                                    error={errors.password}
                                    placeholder="••••••••"
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="block w-full bg-gray-50 border-gray-200 focus:bg-white focus:ring-green-500 focus:border-green-500 transition-colors"
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.password}
                                    className="mt-2"
                                />
                            </div>

                            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={refreshCaptcha}
                                        className="w-full relative bg-white border border-gray-200 rounded overflow-hidden group"
                                        aria-label="Segarkan kode keamanan"
                                    >
                                        <img
                                            src={`/captcha/flat?${captchaKey}`}
                                            alt="Kode keamanan"
                                            className={`w-full object-cover transition-opacity duration-300 ${
                                                isCaptchaLoading
                                                    ? "opacity-10"
                                                    : "opacity-100 group-hover:opacity-80"
                                            }`}
                                            onLoad={() =>
                                                setIsCaptchaLoading(false)
                                            }
                                        />
                                        {/* Optional: Add a subtle "Refresh" icon here that appears on hover */}
                                    </button>

                                    <TextInput
                                        error={errors.captcha}
                                        placeholder="Ketik kode di atas"
                                        id="captcha"
                                        type="text"
                                        value={data.captcha}
                                        className="block w-full text-center h-[50px]"
                                        onChange={(e) =>
                                            setData("captcha", e.target.value)
                                        }
                                    />

                                    <InputError
                                        message={errors.captcha}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            {/* Checkbox Remember Me */}
                            <div className="pt-1">
                                <label className="flex items-center cursor-pointer group">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData(
                                                "remember",
                                                e.target.checked,
                                            )
                                        }
                                        className="rounded border-gray-300 text-green-600 shadow-sm focus:ring-green-500"
                                    />
                                    <span className="ms-2 text-sm text-gray-600 font-medium select-none group-hover:text-gray-900 transition-colors">
                                        Ingat saya di perangkat ini
                                    </span>
                                </label>
                            </div>

                            {/* Tombol Login */}
                            <div className="pt-4">
                                {/* Tombol diubah menjadi nuansa hijau menyesuaikan tema sekolah */}
                                <PrimaryButton
                                    className="w-full justify-center py-3.5 text-base bg-green-600 hover:bg-green-700 focus:bg-green-700 active:bg-green-800 shadow-lg shadow-green-600/30 transition-all rounded-lg"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <i className="fa fa-spinner fa-spin mr-2"></i>
                                    ) : null}
                                    <span className="font-bold tracking-wide">
                                        Masuk ke Sistem
                                    </span>
                                    {!processing && (
                                        <i className="fa fa-arrow-right ms-2 opacity-80"></i>
                                    )}
                                </PrimaryButton>
                            </div>

                            {/* Area Footer Links */}
                            <div className="mt-8 pt-6  gap-4 text-sm font-medium text-gray-400">
                                <p className="text-gray-500 text-center">
                                    Aplikasi Versi{" "}
                                    {import.meta.env.VITE_APP_VERSION}
                                </p>
                                <p className="text-gray-500 text-center">
                                    &copy; {currentYear} Sistem Informasi
                                    Akademik Madrasah
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
