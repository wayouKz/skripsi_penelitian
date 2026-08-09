import DangerButton from "@/Components/DangerButton";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import { router, useForm } from "@inertiajs/react";
import { useRef, useState } from "react";

export default function DeleteUserForm({ className = "" }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: "",
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route("profile.destroy"), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    const Logout = () => {
        router.post(route("logout"));
    };

    return (
        <section className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2">
                <DangerButton
                    onClick={confirmUserDeletion}
                    className="h-8 px-3 text-xs"
                >
                    Delete Account
                </DangerButton>

                <DangerButton onClick={Logout} className="h-8 px-3 text-xs">
                    <i className="fa fa-sign-out mr-1.5"></i> Logout Account
                </DangerButton>
            </div>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-5">
                    <h2 className="text-sm font-bold text-gray-900">
                        Are you sure you want to delete your account?
                    </h2>

                    <p className="mt-1 text-xs text-gray-600 leading-normal">
                        Once your account is deleted, all of its resources and
                        data will be permanently deleted. Please enter your
                        password to confirm.
                    </p>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className="mt-1 block w-full text-xs py-1.5"
                            isFocused
                            placeholder="Password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-1 text-[10px]"
                        />
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <SecondaryButton
                            onClick={closeModal}
                            className="h-8 px-3 text-xs"
                        >
                            Cancel
                        </SecondaryButton>

                        <DangerButton
                            className="h-8 px-3 text-xs"
                            disabled={processing}
                        >
                            Delete Account
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
