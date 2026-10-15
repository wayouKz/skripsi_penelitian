import DataTable from "@/Components/Datatables";
import PrimaryButton from "@/Components/PrimaryButton";
import Add from "../modals/Add";
import Modal from "@/Components/Modal";
import { useEffect, useRef, useState } from "react";
import UploadExcel from "./UploadExcel";

export default function MasterSiswa({
    dataSiswa,
    columns,
    loading,
    show,
    setShow,
    isEdit = false,
    setIsEdit,
    selectedSiswa,
    getSiswa,
    handleTambah,
}) {
    const [openImport, setOpenImport] = useState(false);

    return (
        <>
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-800 uppercase ">
                        Data Profil & Biodata
                    </h4>
                    <div className="flex ga-2">
                        <div className="me-2">
                            <PrimaryButton
                                className="text-xs px-3 py-1.5 rounded-xl shadow-sm"
                                onClick={() => setOpenImport(true)}
                            >
                                <i className="fas fa-file-import mr-2"></i>{" "}
                                Import Excel
                            </PrimaryButton>
                        </div>
                        <div className="">
                            <PrimaryButton
                                className="text-xs px-3 py-1.5 rounded-xl shadow-sm"
                                onClick={() => {
                                    setShow(true);
                                    setIsEdit(false);
                                }}
                            >
                                + Tambah Siswa
                            </PrimaryButton>
                        </div>
                    </div>
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
            <Modal show={openImport} title="Import Data Siswa" maxWidth="2xl">
                <div className="flex justify-end p-2">
                    <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition text-xs font-bold p-1 rounded-lg"
                        onClick={() => setOpenImport(false)}
                    >
                        ✕
                    </button>
                </div>

                <UploadExcel
                    getSiswa={getSiswa}
                    openImport={openImport}
                    setOpenImport={setOpenImport}
                />
            </Modal>
        </>
    );
}
