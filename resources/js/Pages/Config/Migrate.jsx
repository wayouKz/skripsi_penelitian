import { useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import axios from "axios";
import Swal from "sweetalert2";
import { router } from "@inertiajs/react";

export default function Migrate() {
    const [before, setBefore] = useState(true);
    const [status, setStatus] = useState(
        "Click the button below to start database migration.",
    );
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const runMigration = async () => {
        try {
            setBefore(false);
            setLoading(true);
            setStatus("Migrating database, please wait...");

            await router.get(route("install.setup-migrate"));

            setLoading(false);
            setStatus("Migration completed. You can now login.");
        } catch (e) {
            setLoading(false);
            setError(
                e.response?.data?.message ||
                    "Migration failed. Check server logs.",
            );
        }
    };

    return (
        <GuestLayout>
            <div className="max-w-md mx-auto mt-24 text-center">
                <h1 className="text-2xl font-bold mb-4">
                    Installing Application
                </h1>

                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                        {error}
                    </div>
                )}

                <p className="text-gray-600 mb-6">{status}</p>

                {before && (
                    <button
                        onClick={runMigration}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Start Migration
                    </button>
                )}

                {loading && (
                    <div className="mt-6">
                        <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                            <div className="h-full bg-blue-600 animate-pulse w-full"></div>
                        </div>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
