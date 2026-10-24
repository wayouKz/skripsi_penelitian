import { useAlert } from "@/Components/AlertContext";
import AppSelect from "@/Components/AppSelect";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo } from "react";

const SEMESTER_OPTIONS = [
    { value: "ganjil", label: "Ganjil" },
    { value: "genap", label: "Genap" },
];

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

    const tahunOptions = useMemo(() => {
        const tahunSekarang = new Date().getFullYear();
        const result = [];
        for (let i = 0; i < 3; i++) {
            const awal = tahunSekarang - i;
            const akhir = awal + 1;
            const label = `${awal}/${akhir}`;
            result.push({ value: label, label });
        }
        return result;
    }, []);

    const submit = (e) => {
        e.preventDefault();

        const url = isEdit
            ? route("master.tahun-ajaran.update", { id: TahunAjaran.id })
            : route("master.tahun-ajaran.store");

        post(url, {
            onSuccess: () => {
                if (flash?.success) {
                    showAlert(flash.success, "success");
                } else if (flash?.error) {
                    showAlert(flash.error, "error");
                }
                setOpen(false);
                getTahunAjaran();
                reset();
            },
        });
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
                {/* Tahun Ajaran */}
                <div>
                    <InputLabel
                        htmlFor="tahun_ajaran"
                        value="Tahun Ajaran"
                        className="text-xs mb-1"
                    />
                    <AppSelect
                        inputId="tahun_ajaran"
                        options={tahunOptions}
                        value={
                            tahunOptions.find(
                                (o) => o.value === data.tahun_ajaran,
                            ) || null
                        }
                        onChange={(opt) =>
                            setData("tahun_ajaran", opt?.value ?? "")
                        }
                        placeholder="Pilih Tahun..."
                        isSearchable={false}
                        error={!!errors.tahun_ajaran}
                    />
                    <InputError
                        message={errors.tahun_ajaran}
                        className="mt-1 text-[10px]"
                    />
                </div>

                {/* Semester */}
                <div>
                    <InputLabel
                        htmlFor="semester"
                        value="Semester"
                        className="text-xs mb-1"
                    />
                    <AppSelect
                        inputId="semester"
                        options={SEMESTER_OPTIONS}
                        value={
                            SEMESTER_OPTIONS.find(
                                (o) => o.value === data.semester,
                            ) || null
                        }
                        onChange={(opt) =>
                            setData("semester", opt?.value ?? "")
                        }
                        placeholder="Pilih Semester..."
                        isSearchable={false}
                        error={!!errors.semester}
                    />
                    <InputError
                        message={errors.semester}
                        className="mt-1 text-[10px]"
                    />
                </div>
            </div>
        </FormModal>
    );
}
