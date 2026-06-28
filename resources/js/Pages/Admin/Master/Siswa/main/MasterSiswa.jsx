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
            {" "}
            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Data Profil & Biodata
                    </h3>
                    <PrimaryButton
                        className="mb-2"
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
            ;
        </>
    );
}
