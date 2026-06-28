import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-white to-emerald-200">
            <div hidden>
                <Link href="/">
                    <ApplicationLogo className="w-20 fill-current text-gray-500" />
                </Link>
            </div>

            <div className="w-full max-w-md shadow-lg rounded-lg p-10 bg-gray-50">
                {children}
            </div>
        </div>
    );
}
