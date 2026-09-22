import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect } from "react";

export default function Add({
    open,
    setOpen,
    TahunAjaran = null,
    isEdit = false,
    getTahunAjaran,
}) {
    const { data, post, reset, errors, setData, processing } = useForm({
        tahun_ajaran: "",
        semester: "",
        status: "active",
    });
    const { showAlert } = useAlert();
    const flash = usePage().props.flash;

    const submit = (e) => {
        e.preventDefault();

        const url = isEdit
            ? route("master.tahun-ajaran.update", { id: TahunAjaran.id })
            : route("master.tahun-ajaran.store");

        post(url, {
            onSuccess: () => {
                if (flash?.success) {
                    showAlert(flash?.success, "success");
                } else if (flash?.error) {
                    showAlert(flash?.error, "error");
                }
                setOpen(false);
                getTahunAjaran();
                reset();
            },
        });
    };

    const ambilTahun = () => {
        const tahunSekarang = new Date().getFullYear();
        const result = [];
        for (let i = 0; i < 3; i++) {
            const awal = tahunSekarang - i;
            const akhir = awal + 1;
            result.push(`${awal}/${akhir}`);
        }
        return result;
    };

    useEffect(() => {
        if (isEdit && TahunAjaran) {
            setData({
                tahun_ajaran: TahunAjaran.tahun_ajaran || "",
                semester: TahunAjaran.semester || "",
                status: TahunAjaran.status || "active",
            });
        } else {
            reset();
        }
    }, [isEdit, TahunAjaran, open]);

    return (
        <FormModal
            title={isEdit ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
            show={open}
            onClose={() => setOpen(false)}
            setOpen={setOpen}
            onSubmit={submit}
            loading={processing}
            maxWidth="md"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <InputLabel
                        for="tahun_ajaran"
                        value="Tahun Ajaran"
                        className="text-xs"
                    />
                    <select
                        name="tahun_ajaran"
                        id="tahun_ajaran"
                        value={data.tahun_ajaran}
                        onChange={(e) =>
                            setData("tahun_ajaran", e.target.value)
                        }
                        className={`mt-1 block w-full py-1.5 px-2.5 border ${
                            errors.tahun_ajaran
                                ? "border-red-500"
                                : "border-gray-300"
                        } bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-xs`}
                    >
                        <option value="">[Pilih Tahun]</option>
                        {ambilTahun().map((tahun, index) => (
                            <option key={index} value={tahun}>
                                {tahun}
                            </option>
                        ))}
                    </select>
                    <InputError
                        message={errors.tahun_ajaran}
                        className="mt-1 text-[10px]"
                    />
                </div>

                <div>
                    <InputLabel
                        for="semester"
                        value="Semester"
                        className="text-xs"
                    />
                    <select
                        name="semester"
                        id="semester"
                        value={data.semester}
                        onChange={(e) => setData("semester", e.target.value)}
                        className={`mt-1 block w-full py-1.5 px-2.5 border ${
                            errors.semester
                                ? "border-red-500"
                                : "border-gray-300"
                        } bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-xs`}
                    >
                        <option value="">[Pilih Semester]</option>
                        <option value="ganjil">Ganjil</option>
                        <option value="genap">Genap</option>
                    </select>
                    <InputError
                        message={errors.semester}
                        className="mt-1 text-[10px]"
                    />
                </div>
            </div>
        </FormModal>
    );
}
