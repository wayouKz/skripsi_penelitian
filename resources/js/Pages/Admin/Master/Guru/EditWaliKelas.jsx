import { useAlert } from "@/Components/AlertContext";
import FormModal from "@/Components/FormModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Select from "react-select";

export default function Add({
    open,
    setOpen,
    Kelas = null,
    isEdit = false,
    getKelas,
}) {
    const { data, post, reset, errors, setData } = useForm({
        id: "",
        nama_kelas: "",
        id_wali_kelas: "",
        tingkat: "",
    });
    const { showAlert } = useAlert();
    const flash = usePage().props.flash;
    const [waliKelas, setWaliKelas] = useState([]);
    const submit = (e) => {
        e.preventDefault();

        post(route("master.kelas.update"), {
            onSuccess: () => {
                if (flash.success) {
                    showAlert("Wali Kelas Berhasil Di Ubah", "success");
                } else if (flash.error) {
                    showAlert("Wali Kelas Gagal Di Ubah", "error");
                }

                setOpen(false);
                getKelas();
                reset();
            },
        });
    };

    const getWaliKelas = () => {
        axios.get(route("master.kelas.getWaliKelas")).then((res) => {
            if (res.data.status == "success") {
                setWaliKelas(res.data.data);
            } else {
                setWaliKelas([]);
            }
        });
    };
    useEffect(() => {
        getWaliKelas();
    }, []);
    useEffect(() => {
        if (Kelas) {
            setData({
                id: Kelas.id,
                nama_kelas: Kelas.nama_kelas,
                id_wali_kelas: Kelas.id_wali_kelas || "",
                tingkat: Kelas.tingkat || "",
            });
        } else {
            reset();
        }
    }, [isEdit, Kelas]);
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? "#F3F4F6" : "#FFFFFF",
            borderColor: state.isFocused ? "#10B981" : "#E5E7EB",
            borderRadius: "0.5rem",
            padding: "0.05rem 0.1rem",
            minHeight: "32px",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                : "none",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            "&:hover": {
                borderColor: state.isDisabled ? "#E5E7EB" : "#10B981",
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0px 6px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
            fontSize: "11px",
            fontWeight: "normal",
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1F2937",
            fontSize: "11px",
            fontWeight: "600",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#10B981"
                : state.isFocused
                  ? "#ECFDF5"
                  : "white",
            color: state.isSelected ? "white" : "#1F2937",
            fontSize: "11px",
            fontWeight: "500",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };
    return (
        <FormModal
            title={"Ubah Wali Kelas" + " " + Kelas?.nama_kelas}
            show={open}
            onClose={() => setOpen(false)}
            setOpen={setOpen}
            onSubmit={submit}
        >
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <InputLabel
                        for="tahun_ajaran"
                        value="Pilih Guru Wali Kelas"
                    />
                    <Select
                        // Tambahkan props styles ini untuk menaikkan z-index menu dropdown-nya
                        styles={{
                            ...customSelectStyles,
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        options={waliKelas?.map((item) => ({
                            value: item.id,
                            nama_guru: item.nama_guru,
                            nip: item.nip,
                            kelas: item.kelas,
                        }))}
                        value={
                            waliKelas
                                ?.map((item) => ({
                                    value: item.id,
                                    nama_guru: item.nama_guru,
                                    nip: item.nip,
                                    kelas: item.kelas,
                                }))
                                .find(
                                    (option) =>
                                        option.value == data.id_wali_kelas,
                                ) || null
                        }
                        formatOptionLabel={(option) => {
                            // JIKA DATA KOSONG
                            if (!option) {
                                return (
                                    <div className="py-2 text-sm text-gray-500 text-center">
                                        Tidak ada data
                                    </div>
                                );
                            }

                            return (
                                // Hapus "z-" yang terketik tidak sengaja di bagian ini
                                <div className="flex justify-between items-center w-full">
                                    <span>
                                        <i className="fas fa-user-tie mr-2"></i>
                                        {option.nama_guru} - {option.nip}
                                    </span>

                                    <span
                                        className={`text-xs font-semibold ${
                                            option.kelas == null
                                                ? "text-green-600"
                                                : option.kelas.id_wali_kelas ==
                                                    data.id_wali_kelas
                                                  ? "text-green-600"
                                                  : "text-red-600"
                                        }`}
                                    >
                                        {option.kelas == null
                                            ? "Tersedia"
                                            : option.kelas.id_wali_kelas ==
                                                data.id_wali_kelas
                                              ? "Dipilih Pada Kelas Ini"
                                              : `Dipakai ${option.kelas.nama_kelas}`}
                                    </span>
                                </div>
                            );
                        }}
                        noOptionsMessage={() => "Tidak ada data"}
                        onChange={(selectedOption) =>
                            setData("id_wali_kelas", selectedOption?.value)
                        }
                    />
                    <InputError message={errors.id_wali_kelas} />
                </div>
            </div>
        </FormModal>
    );
}
