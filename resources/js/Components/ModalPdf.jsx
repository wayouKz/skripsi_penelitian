<<<<<<< HEAD
import Modal from "./Modal";

export default function ModalPdf({ isOpen, onClose, pdfUrl, title }) {
=======
import { useState, useEffect } from "react";
import Modal from "./Modal";

export default function ModalPdf({ isOpen, onClose, pdfUrl, title }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
        }
    }, [isOpen, pdfUrl]);

>>>>>>> main
    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="flex flex-col w-full h-[85vh] p-4 bg-white rounded-lg">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center truncate">
                        <i className="fas fa-file-pdf text-red-500 mr-2 text-xl"></i>
                        <span className="truncate">
                            {title || "Dokumen PDF"}
                        </span>
                    </h4>

                    <div className="flex items-center gap-3 flex-shrink-0">
<<<<<<< HEAD
                        {/* Tombol Buka di Tab Baru */}
=======
>>>>>>> main
                        {pdfUrl && (
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm font-medium text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                title="Buka di tab baru"
                            >
                                <i className="fas fa-external-link-alt text-xs"></i>
                            </a>
                        )}

                        {/* Tombol Close */}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                            aria-label="Tutup"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Body / PDF Viewer Container */}
<<<<<<< HEAD
                <div className="flex-1 w-full h-full mt-4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {pdfUrl ? (
                        <iframe
                            src={`${pdfUrl}#view=FitH`}
                            title={title || "PDF Viewer"}
                            className="w-full h-full border-0"
                        ></iframe>
=======
                <div className="flex-1 w-full h-full mt-4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                    {pdfUrl ? (
                        <>
                            {/* Indikator Loading */}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-xs">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm text-gray-600 font-medium">
                                            Memuat PDF...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Iframe PDF */}
                            <iframe
                                src={`${pdfUrl}#view=FitH`}
                                title={title || "PDF Viewer"}
                                className="w-full h-full border-0"
                                onLoad={() => setIsLoading(false)}
                            ></iframe>
                        </>
>>>>>>> main
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>File PDF tidak tersedia.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
