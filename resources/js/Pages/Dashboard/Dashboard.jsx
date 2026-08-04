import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import { usePage } from "@inertiajs/react";
import GuruDashboard from "./Page/GuruDashboard";
import SuperAdmin from "./Page/SuperAdmin";

export default function Dashboard() {
    const role = usePage().props.auth.user.role.nama_roles;
    const user = usePage().props.auth.user;
    const now = new Date();
    const total = usePage().props.total;
    const tglStr = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(now);
    return (
        <AuthenticatedLayout header="Dashboard">
            <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
                {role === "Super Admin" || role === "Developer" ? (
                    <SuperAdmin user={user} tglStr={tglStr} total={total} />
                ) : (
                    <GuruDashboard user={user} tglStr={tglStr} />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
