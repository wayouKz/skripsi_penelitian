import { Fragment } from "react";
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
        // Cegah modal tertutup oleh ESC / klik area luar saat full screen
        if (closeable && !isFullScreen) {
            onClose();
        }
    };

    const maxWidthClass =
        {
            sm: "sm:max-w-sm",
            md: "sm:max-w-md",
            lg: "sm:max-w-lg",
            xl: "sm:max-w-xl",
            "2xl": "sm:max-w-2xl",
            "3xl": "sm:max-w-3xl",
            "4xl": "sm:max-w-4xl",
            "5xl": "sm:max-w-5xl",
            "6xl": "sm:max-w-6xl",
            "7xl": "sm:max-w-7xl",
        }[maxWidth] ?? "sm:max-w-2xl";

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className="relative z-50"
                onClose={close}
            >
                {/* Backdrop */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75" />
                </TransitionChild>

                {/* Container scroll (terpisah dari container pemusatan) */}
                <div
                    className={`fixed inset-0 ${
                        isFullScreen ? "overflow-hidden" : "overflow-y-auto"
                    }`}
                >
                    <div
                        className={
                            isFullScreen
                                ? "flex h-full items-start p-0"
                                : "flex min-h-full items-center justify-center p-4 sm:p-6"
                        }
                    >
                        {/* Panel: as={Fragment} supaya tidak ada div pembungkus */}
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom={
                                isFullScreen
                                    ? "opacity-0 translate-y-full"
                                    : "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            }
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo={
                                isFullScreen
                                    ? "opacity-0 translate-y-full"
                                    : "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            }
                        >
                            <DialogPanel
                                className={
                                    isFullScreen
                                        ? "w-full h-screen min-h-screen bg-white overflow-hidden flex flex-col transform transition-all"
                                        : `w-full ${maxWidthClass} transform overflow-hidden rounded-lg bg-white shadow-xl transition-all`
                                }
                            >
                                {children}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
