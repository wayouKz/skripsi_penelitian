import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from "@headlessui/react";

export default function Modal({
    children,
    show = false,
    maxWidth = "full",
    closeable = true,
    onClose = () => {},
}) {
    const isFullScreen = maxWidth === "full";

    const close = () => {
        // Cegah modal tertutup oleh tombol ESC atau klik area luar
        // jika modal dalam mode full screen
        if (closeable && !isFullScreen) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
    }[maxWidth];

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className={`fixed inset-0 z-50 flex transform transition-all ${
                    isFullScreen
                        ? "items-start p-0"
                        : "items-center overflow-y-auto px-4 py-6 sm:px-0"
                }`}
                onClose={close} // Fungsi close yang baru akan mencegat penutupan otomatis
            >
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-gray-500/75" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom={
                        isFullScreen
                            ? "opacity-0 tranprimary-y-full"
                            : "opacity-0 tranprimary-y-4 sm:tranprimary-y-0 sm:scale-95"
                    }
                    enterTo="opacity-100 tranprimary-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 tranprimary-y-0 sm:scale-100"
                    leaveTo={
                        isFullScreen
                            ? "opacity-0 tranprimary-y-full"
                            : "opacity-0 tranprimary-y-4 sm:tranprimary-y-0 sm:scale-95"
                    }
                >
                    <DialogPanel
                        className={
                            isFullScreen
                                ? "w-full h-screen min-h-screen bg-white overflow-hidden flex flex-col transform transition-all"
                                : `mb-6 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full ${maxWidthClass}`
                        }
                    >
                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
