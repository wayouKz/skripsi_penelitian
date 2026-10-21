import { useState, useEffect } from "react";
import Modal from "./Modal";

export default function ModalPdf({ isOpen, onClose, pdfUrl, title }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
        }
    }, [isOpen, pdfUrl]);

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="flex flex-col w-full h-[75vh] p-3 bg-white rounded-lg">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <h4 className="text-xs font-bold text-gray-800 flex items-center truncate">
                        <i className="fas fa-file-pdf text-red-500 mr-2 text-lg"></i>
                        <span className="truncate">
                            {title || "Dokumen PDF"}
                        </span>
                    </h4>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {pdfUrl && (
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                                title="Buka di tab baru"
                            >
                                <i className="fas fa-external-link-alt text-[10px]"></i>
                            </a>
                        )}

                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors"
                            aria-label="Tutup"
                        >
                            <i className="fas fa-times text-sm"></i>
                        </button>
                    </div>
                </div>

                {/* Body / PDF Viewer Container */}
                <div className="flex-1 w-full h-full mt-3 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                    {pdfUrl ? (
                        <>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-xs">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-xs text-gray-600 font-medium">
                                            <i className="fa fa-spinner animate-spin"></i>{" "}
                                            Memuat PDF...
                                        </p>
                                    </div>
                                </div>
                            )}

                            <iframe
                                src={`${pdfUrl}#view=FitH`}
                                title={title || "PDF Viewer"}
                                className="w-full h-full border-0"
                                onLoad={() => setIsLoading(false)}
                            ></iframe>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                            <p>File PDF tidak tersedia.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
