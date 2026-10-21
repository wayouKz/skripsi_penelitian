import { useState } from "react";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import { Head, Link, useForm } from "@inertiajs/react";
import TextInput from "@/Components/TextInput";

export default function Login({ status, canResetPassword, config }) {
    const [captchaKey, setCaptchaKey] = useState(Date.now());
    const [isCaptchaLoading, setIsCaptchaLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false); // State untuk Toggle Password

    const { data, setData, post, processing, errors, reset } = useForm({
        username: "",
        password: "",
        remember: false,
        captcha: "",
    });

    const currentYear = new Date().getFullYear();

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
            onError: () => {
                setCaptchaKey(Date.now());
                reset("captcha");
            },
        });
    };

    const refreshCaptcha = () => {
        setIsCaptchaLoading(true);
        setCaptchaKey(Date.now());
    };

    return (
        <>
            <Head title="Log in" />

            {/* CONTAINER UTAMA: Latar belakang full layar */}
            <div
                className="min-h-screen w-full relative bg-cover bg-center flex flex-col justify-between"
                style={{
                    backgroundImage: `url(${
                        config?.sampul_instansi
                            ? `/storage/public/sampul_instansi/${config.sampul_instansi}`
                            : "/img/sampul-default.jpg"
                    })`,
                }}
            >
                {/* OVERLAY: Warna biru semi transparan menutupi seluruh gambar */}
                <div className="absolute inset-0 bg-primary-500/70 mix-blend-multiply"></div>

                {/* AREA TENGAH: Teks Kiri & Form Kanan */}
                <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center container mx-auto px-6 lg:px-16 gap-10 lg:gap-24 py-12">
                    {/* BAGIAN KIRI: Teks Instansi */}
                    <div className="w-full lg:w-1/2 text-white text-center lg:text-left mt-10 lg:mt-0">
                        <h1 className="text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg tracking-tight">
                            {config?.nama_instansi || "SISTEM INFORMASI"}{" "}
                        </h1>
                        {/* <p className="text-xl lg:text-2xl font-semibold mb-2 drop-shadow-md">

                        </p> */}
                        <p className="text-sm lg:text-base text-primary-100 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                            {config?.alamat_instansi ||
                                "CONTOH JALAN, CONTOH KOTA"}
                            <br className="hidden lg:block" />
                            email :{" "}
                            {config?.email_instansi || "contoh@contoh.com"}
                        </p>
                    </div>

                    {/* BAGIAN KANAN: Card Form Login */}
                    <div className="w-full max-w-[420px] bg-white rounded-[32px] shadow-2xl p-8 sm:p-10">
                        {/* 1. Barisan Logo (Sesuaikan src dengan logo instansi Anda) */}
                        <div className="flex justify-center items-center gap-6 mb-6">
                            <img
                                src={
                                    config?.logo_instansi
                                        ? `/storage/public/logo/${config.logo_instansi}`
                                        : "/img/logo-default.png" // Pastikan letak gambar default kamu ada di folder public/img/
                                }
                                alt="Logo Utama"
                                className="h-14 w-auto object-contain"
                            />
                        </div>

                        {/* 2. Judul Form */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-extrabold text-primary-600 tracking-tight">
                                {config?.nama_instansi ||
                                    "SISTEM INFORMASI NAMA SEKOLAH"}
                            </h2>
                        </div>

                        {/* 3. Notifikasi Error / Status */}
                        {status && (
                            <div className="mb-4 text-sm font-medium text-primary-600 bg-primary-50 p-3 rounded-lg text-center">
                                {status}
                            </div>
                        )}

                        {/* 4. Form Input */}
                        <form onSubmit={submit} className="space-y-4">
                            {/* Input Username */}
                            <div>
                                <TextInput
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={data.username}
                                    placeholder="Ketik Nama Pengguna"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    icon="email"
                                    autoComplete="username"
                                    onChange={(e) =>
                                        setData("username", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.username}
                                    className="mt-1.5 ml-1"
                                />
                            </div>

                            {/* Input Password dengan Toggle Mata */}
                            <div className="relative">
                                <TextInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    placeholder="Ketik Password"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-10"
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <i
                                        className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                                    ></i>
                                </button>
                                <InputError
                                    message={errors.password}
                                    className="mt-1.5 ml-1"
                                />
                            </div>

                            {/* Input Captcha Inline dengan Gambar */}
                            <div>
                                {/* Set tinggi container menjadi 44px */}
                                <div className="lg:flex gap-3 h-[44px] sm:w-full">
                                    <input
                                        id="captcha"
                                        type="text"
                                        value={data.captcha}
                                        placeholder="Ketik Captcha"
                                        className="w-full h-full border border-gray-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        onChange={(e) =>
                                            setData("captcha", e.target.value)
                                        }
                                    />

                                    {/* Gambar Captcha dengan ukuran fix 118x44 px */}
                                    <div
                                        className="lg:w-[198px] h-[45px] lg:flex-shrink-0 sm:w-full bg-white rounded-xl overflow-hidden cursor-pointer relative border border-gray-200 group"
                                        onClick={refreshCaptcha}
                                        title="Klik untuk menyegarkan kode"
                                    >
                                        <img
                                            src={`/captcha/flat?${captchaKey}`}
                                            alt="Captcha"
                                            /* Memaksa gambar mengikuti ukuran 118x44 px */
                                            className={`lg:w-[200px] sm:w-full h-[44px] object-fill transition-opacity duration-300 ${isCaptchaLoading ? "opacity-0" : "opacity-100 group-hover:opacity-80"}`}
                                            onLoad={() =>
                                                setIsCaptchaLoading(false)
                                            }
                                        />

                                        {/* Indikator Loading */}
                                        {isCaptchaLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                <i className="fa fa-spinner fa-spin text-gray-400"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <InputError
                                    message={errors.captcha}
                                    className="mt-1.5 ml-1"
                                />
                            </div>

                            {/* Tombol Submit */}
                            <div className="pt-2">
                                <PrimaryButton
                                    className="w-full justify-center py-3.5 text-sm font-bold bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-xl tracking-wide shadow-md transition-all"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <i className="fa fa-spinner fa-spin mr-2"></i>
                                    ) : null}
                                    MASUK
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>

                {/* BAGIAN BAWAH: Footer Copyright */}
                <div className="relative z-10 py-6 text-center text-primary-100/80 text-xs font-medium tracking-wide">
                    &copy; {currentYear} Aplikasi by INFORMATIKA UNG
                </div>
            </div>
        </>
    );
}
