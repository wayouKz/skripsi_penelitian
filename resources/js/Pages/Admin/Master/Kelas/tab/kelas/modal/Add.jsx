import { useAlert } from "@/Components/AlertContext";
import Checkbox from "@/Components/Checkbox";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import AppSelect from "@/Components/AppSelect";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const TINGKAT_OPTIONS = [
    { value: "X", label: "X" },
    { value: "XI", label: "XI" },
    { value: "XII", label: "XII" },
];

export default function Add({
    open,
    setOpen,
    Kelas = null,
    isEdit = false,
    getKelas,
}) {
    const { data, post, reset, errors, setData } = useForm({
        nama_kelas: "",
        id_wali_kelas: "",
        tingkat: "",
        jurusan_id: null,
        tahun_ajaran_id: "",
    });

    const { showAlert } = useAlert();
    const { flash } = usePage().props;
    const [waliKelas, setWaliKelas] = useState([]);
    const [showJurusan, setShowJurusan] = useState(false);
    const [ListJurusan, setListJurusan] = useState([]);

    const waliOptions = useMemo(
        () =>
            waliKelas.map((item) => ({
                value: item.id,
                label: item.nama_guru,
                nip: item.nip,
                kelas: item.kelas,
            })),
        [waliKelas],
    );

    const jurusanOptions = useMemo(
        () =>
            ListJurusan.map((j) => ({
                value: j.id,
                label: j.nama_jurusan,
            })),
        [ListJurusan],
    );

    const submit = (e) => {
        e.preventDefault();

        const url = isEdit
            ? route("master.kelas.update", { id: Kelas.id })
            : route("master.kelas.store");

        post(url, {
            onSuccess: () => {
                const message = flash.success || flash.error;
                if (message)
                    showAlert(message, flash.success ? "success" : "error");

                setOpen(false);
                getKelas();
                reset();
            },
        });
    };

    const getWaliKelas = async () => {
        try {
            const res = await axios.get(route("master.kelas.getWaliKelas"));
            setWaliKelas(res.data.status === "success" ? res.data.data : []);
        } catch {
            setWaliKelas([]);
        }
    };

    const getJurusan = async () => {
        try {
            const res = await axios.get(route("master.jurusan.getJurusan"));
            setListJurusan(res.data.status === "success" ? res.data.data : []);
        } catch {
            setListJurusan([]);
        }
    };

    useEffect(() => {
        if (open) getWaliKelas();
    }, [open]);

    useEffect(() => {
        if (showJurusan) getJurusan();
    }, [showJurusan]);

    useEffect(() => {
        if (isEdit && Kelas) {
            setData({
                nama_kelas: Kelas.nama_kelas || "",
                id_wali_kelas: Kelas.id_wali_kelas || "",
                tingkat: Kelas.tingkat || "",
                jurusan_id: Kelas.jurusan_id || null,
            });
            if (Kelas.jurusan || Kelas.jurusan_id) setShowJurusan(true);
        } else {
            reset();
            setShowJurusan(false);
        }
    }, [isEdit, Kelas, open]);

    return (
        <FormModal
            title={isEdit ? "Edit Kelas" : "Tambah Kelas"}
            show={open}
            onClose={() => setOpen(false)}
            onSubmit={submit}
            closable={true}
        >
            <div className="space-y-3">
                {/* Wali Kelas */}
                <div>
                    <InputLabel
                        value="Pilih Guru Wali Kelas"
                        className="text-xs font-medium text-gray-700 mb-1"
                    />
                    <AppSelect
                        options={waliOptions}
                        value={
                            waliOptions.find(
                                (o) => o.value == data.id_wali_kelas,
                            ) || null
                        }
                        onChange={(val) =>
                            setData("id_wali_kelas", val?.value ?? "")
                        }
                        placeholder="Pilih Wali Kelas..."
                        isSearchable
                        error={!!errors.id_wali_kelas}
                        formatOptionLabel={(option) => (
                            <div className="flex justify-between items-center text-xs gap-2">
                                <span>
                                    {option.label} - {option.nip}
                                </span>
                                <span
                                    className={`text-[10px] font-semibold shrink-0 ${
                                        option.kelas
                                            ? "text-red-600"
                                            : "text-primary-600"
                                    }`}
                                >
                                    {option.kelas
                                        ? `Dipakai ${option.kelas.nama_kelas}`
                                        : "Tersedia"}
                                </span>
                            </div>
                        )}
                    />
                    <InputError
                        message={errors.id_wali_kelas}
                        className="mt-1 text-[10px]"
                    />
                </div>

                {/* Nama & Tingkat */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <InputLabel
                            value="Nama Kelas"
                            className="text-xs font-medium text-gray-700 mb-1"
                        />
                        <TextInput
                            icon="door-open"
                            type="text"
                            placeholder="Nama Kelas"
                            value={data.nama_kelas}
                            onChange={(e) =>
                                setData("nama_kelas", e.target.value)
                            }
                            className="w-full text-xs py-1.5"
                        />
                        <InputError
                            message={errors.nama_kelas}
                            className="mt-1 text-[10px]"
                        />
                    </div>

                    <div>
                        <InputLabel
                            value="Tingkat"
                            className="text-xs font-medium text-gray-700 mb-1"
                        />
                        <AppSelect
                            options={TINGKAT_OPTIONS}
                            value={
                                TINGKAT_OPTIONS.find(
                                    (o) => o.value === data.tingkat,
                                ) || null
                            }
                            onChange={(val) =>
                                setData("tingkat", val?.value ?? "")
                            }
                            placeholder="Pilih Tingkat..."
                            isSearchable={false}
                            error={!!errors.tingkat}
                        />
                        <InputError
                            message={errors.tingkat}
                            className="mt-1 text-[10px]"
                        />
                    </div>
                </div>

                {/* Checkbox Jurusan */}
                <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                        checked={showJurusan}
                        onChange={() => {
                            const next = !showJurusan;
                            setShowJurusan(next);
                            if (!next) setData("jurusan_id", null);
                        }}
                    />
                    <span className="text-xs text-gray-700">
                        Gunakan Jurusan
                    </span>
                </div>

                {showJurusan && (
                    <div>
                        <InputLabel
                            value="Jurusan"
                            className="text-xs font-medium text-gray-700 mb-1"
                        />
                        <AppSelect
                            options={jurusanOptions}
                            value={
                                jurusanOptions.find(
                                    (o) => o.value == data.jurusan_id,
                                ) || null
                            }
                            onChange={(val) =>
                                setData("jurusan_id", val?.value ?? null)
                            }
                            placeholder="Pilih jurusan..."
                            isSearchable
                            error={!!errors.jurusan_id || !!errors.jurusan}
                        />
                        <InputError
                            message={errors.jurusan_id || errors.jurusan}
                            className="mt-1 text-[10px]"
                        />
                    </div>
                )}
            </div>
        </FormModal>
    );
}
