import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import Add from "../modals/Add";

export default function MasterSiswa({
    dataSiswa,
    columns,
    loading,
    show,
    setShow,
    isEdit,
    selectedSiswa,
    handleTambah,
}) {
    return (
        <>
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-800 uppercase ">
                        Data Profil & Biodata
                    </h4>
                    <PrimaryButton
                        className="text-xs px-3 py-1.5 rounded-xl shadow-sm"
                        onClick={() => handleTambah()}
                    >
                        + Tambah Siswa
                    </PrimaryButton>
                </div>
                <DataTable
                    loading={loading}
                    title={"Master Siswa"}
                    columns={columns}
                    data={dataSiswa}
                />
            </div>
            <Add
                open={show}
                setOpen={setShow}
                isEdit={isEdit}
                Siswa={selectedSiswa}
            />
        </>
    );
}
