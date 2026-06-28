import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import Add from "../kelas/modal/Add";

export default function MasterKelas({
    handleTambah,
    Result,
    columns,
    loading,
    show,
    setShow,
    isEdit,
    Kelas,
    getKelas,
}) {
    return (
        <>
            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-end">
                    <PrimaryButton
                        className="mb-2"
                        onClick={() => {
                            handleTambah();
                        }}
                    >
                        + Tambah Kelas
                    </PrimaryButton>
                </div>
                <DataTable
                    columns={columns}
                    data={Result}
                    title={"Kelas"}
                    searchable={true}
                    loading={loading}
                />
            </div>
            <Add
                isEdit={isEdit}
                open={show}
                setOpen={setShow}
                getKelas={getKelas}
                Kelas={Kelas}
            />
        </>
    );
}
