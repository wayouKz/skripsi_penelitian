import { useAlert } from "@/Components/AlertContext";
import Checkbox from "@/Components/Checkbox";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import axios from "axios";

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
                jurusan_id: Kelas.jurusan_id || "",
            });
            if (Kelas.jurusan) setShowJurusan(true);
        } else {
            reset();
            setShowJurusan(false);
        }
    }, [isEdit, Kelas]);

    return (
        <FormModal
            title={isEdit ? "Edit Kelas" : "Tambah Kelas"}
            show={open}
            onClose={() => setOpen(false)}
            onSubmit={submit}
            closable={true}
        >
            <div className="space-y-3">
                {/* Field Wali Kelas */}
                <div>
                    <InputLabel
                        value="Pilih Guru Wali Kelas"
                        className="text-xs font-medium text-gray-700"
                    />
                    <Select
                        styles={{
                            control: (base) => ({
                                ...base,
                                minHeight: "32px",
                                fontSize: "12px",
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                        menuPortalTarget={document.body}
                        options={waliOptions}
                        value={
                            waliOptions.find(
                                (o) => o.value == data.id_wali_kelas,
                            ) || null
                        }
                        onChange={(val) => setData("id_wali_kelas", val?.value)}
                        placeholder="Pilih Wali Kelas..."
                        formatOptionLabel={(option) => (
                            <div className="flex justify-between items-center text-xs">
                                <span>
                                    {option.label} - {option.nip}
                                </span>
                                <span
                                    className={`text-[10px] font-semibold ${option.kelas ? "text-red-600" : "text-primary-600"}`}
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

                {/* Field Nama & Tingkat */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <InputLabel
                            value="Nama Kelas"
                            className="text-xs font-medium text-gray-700"
                        />
                        <TextInput
                            icon="door-open"
                            type="text"
                            placeholder="Nama Kelas"
                            value={data.nama_kelas}
                            onChange={(e) =>
                                setData("nama_kelas", e.target.value)
                            }
                            className="mt-1 w-full text-xs py-1.5"
                        />
                        <InputError
                            message={errors.nama_kelas}
                            className="mt-1 text-[10px]"
                        />
                    </div>

                    <div>
                        <InputLabel
                            value="Tingkat"
                            className="text-xs font-medium text-gray-700"
                        />
                        <select
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-xs text-xs py-1.5 focus:border-indigo-500 focus:ring-indigo-500"
                            value={data.tingkat}
                            onChange={(e) => setData("tingkat", e.target.value)}
                        >
                            <option value="">[Pilih tingkat]</option>
                            {["10", "11", "12"].map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={errors.tingkat}
                            className="mt-1 text-[10px]"
                        />
                    </div>
                </div>

                {/* Jurusan Checkbox */}
                <div className="flex items-center pt-1 gap-2">
                    <span className="ml-2 text-xs text-gray-700">
                        Gunakan Jurusan :
                    </span>
                    <Checkbox
                        checked={showJurusan}
                        onChange={() => setShowJurusan(!showJurusan)}
                    />
                </div>

                {showJurusan && (
                    <div>
                        <InputLabel
                            value="Jurusan"
                            className="text-xs font-medium text-gray-700"
                        />
                        <select
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-xs text-xs py-1.5 focus:border-indigo-500 focus:ring-indigo-500"
                            value={data.jurusan_id}
                            onChange={(e) =>
                                setData("jurusan_id", e.target.value)
                            }
                        >
                            <option value="">[Pilih jurusan]</option>
                            {ListJurusan.map((j) => (
                                <option key={j.id} value={j.id}>
                                    {j.nama_jurusan}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={errors.jurusan}
                            className="mt-1 text-[10px]"
                        />
                    </div>
                )}
            </div>
        </FormModal>
    );
}
