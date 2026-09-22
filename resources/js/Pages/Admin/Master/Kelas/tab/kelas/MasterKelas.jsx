import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import Add from "../kelas/modal/Add";
import { useEffect, useState, useCallback, useMemo } from "react";
import Select from "react-select";
import InputLabel from "@/Components/InputLabel";

export default function MasterKelas({
    handleTambah,
    columns,
    loading: propLoading,
    show,
    setShow,
    isEdit,
    Kelas,
}) {
    const [TahunAjaran, setTahunAjaran] = useState([]);
    const [Result, setResult] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);

    // 1. getKelas HANYA dieksekusi jika menerima parameter tahunAjaranId
    const getKelas = useCallback(async (tahunAjaranId) => {
        setIsFetching(true);
        try {
            const res = await axios.get(route("master.kelas.getKelas"));
            if (res.data.success) {
                setResult(res.data.data);
            } else {
                setResult([]);
            }
        } catch (error) {
            console.error("Gagal memuat data kelas:", error);
            setResult([]);
        } finally {
            setIsFetching(false);
        }
    }, []);

    // // 2. getTahunAjaran (Dipertahankan)
    // const getTahunAjaran = useCallback(async () => {
    //     try {
    //         const res = await axios.get(
    //             route("master.tahun-ajaran.getTahunAjaran"),
    //         );
    //         const data = res.data?.data || [];
    //         setTahunAjaran(data);

    //         // Otomatis pilih yang "Aktif" agar user tidak perlu klik manual saat pertama kali buka
    //         if (data.length > 0) {
    //             const taAktif = data.find((ta) => ta.status === "Aktif");
    //             if (taAktif) setSelectedTahunAjaran(taAktif.id);
    //         }
    //     } catch (error) {
    //         console.error("Gagal memuat tahun ajaran:", error);
    //         setTahunAjaran([]);
    //     }
    // }, []);

    // 3. Cache opsi Select
    // const tahunAjaranOptions = useMemo(() => {
    //     return TahunAjaran.map((ta) => ({
    //         value: ta.id,
    //         label: ta.tahun_ajaran,
    //         semester: ta.semester,
    //         status: ta.status,
    //     }));
    // }, [TahunAjaran]);

    // 4. PISAHKAN useEffect
    // Bagian A: Khusus untuk memuat opsi Tahun Ajaran saat komponen pertama kali dirender
    // useEffect(() => {
    //     getTahunAjaran();
    // }, [getTahunAjaran]);

    // Bagian B: Khusus untuk memuat isi Tabel Kelas SETIAP KALI Tahun Ajaran dipilih/berubah
    useEffect(() => {
        getKelas(selectedTahunAjaran);
    }, []);

    // 5. Cukup ubah state saja, useEffect di atas akan otomatis memanggil getKelas
    const handleChangeTA = (value) => {
        setSelectedTahunAjaran(value);
    };

    return (
        <>
            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-end items-end mb-4">
                    {/* <div className="w-1/2 sm:w-1/3"> */}
                    {/* <InputLabel value="Pilih Tahun Ajaran" /> */}
                    {/* <Select
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                            }}
                            menuPortalTarget={document.body}
                            options={tahunAjaranOptions}
                            placeholder="Pilih Tahun Ajaran..."
                            value={
                                tahunAjaranOptions.find(
                                    (option) =>
                                        option.value === selectedTahunAjaran,
                                ) || null
                            }
                            onChange={(val) => handleChangeTA(val?.value)}
                            formatOptionLabel={(option) => (
                                <div className="flex justify-between items-center">
                                    <span>
                                        {option.label}{" "}
                                        {option.semester
                                            ? `- ${option.semester}`
                                            : ""}
                                    </span>
                                    {option.status && (
                                        <span
                                            className={`text-xs font-semibold ${
                                                option.status === "Aktif"
                                                    ? "text-green-600"
                                                    : "text-gray-500"
                                            }`}
                                        >
                                            {option.status}
                                        </span>
                                    )}
                                </div>
                            )}
                        /> */}
                    {/* </div> */}

                    {/* Matikan tombol tambah jika belum milih tahun ajaran */}
                    <PrimaryButton onClick={handleTambah}>
                        + Tambah Kelas
                    </PrimaryButton>
                </div>

                {/* Tampilkan Tabel HANYA JIKA Tahun Ajaran sudah dipilih */}

                <DataTable
                    columns={columns}
                    data={Result}
                    title={"Kelas"}
                    searchable={true}
                    loading={propLoading || isFetching}
                />
            </div>

            <Add
                isEdit={isEdit}
                open={show}
                setOpen={setShow}
                // Lempar fungsi dengan parameter agar modal Add tahu harus refresh data tahun ajaran yang mana
                getKelas={() => getKelas(selectedTahunAjaran)}
                Kelas={Kelas}
                // Anda mungkin juga perlu melempar selectedTahunAjaran ke modal Add agar data yang disimpan otomatis memakai ID ini
                selectedTahunAjaran={selectedTahunAjaran}
            />
        </>
    );
}
