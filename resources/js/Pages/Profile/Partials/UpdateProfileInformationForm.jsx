import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Transition } from "@headlessui/react";
import { Link, useForm, usePage } from "@inertiajs/react";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = "",
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user?.name,
            username: user?.username,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route("profile.update"));
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel
                        htmlFor="name"
                        value="Name"
                        className="text-xs font-medium text-gray-700"
                    />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full text-xs py-1.5"
                        value={data.name}
                        icon={"user"}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError
                        className="mt-1 text-[10px]"
                        message={errors.name}
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="username"
                        value="Username"
                        className="text-xs font-medium text-gray-700"
                    />

                    <TextInput
                        id="username"
                        type="text"
                        icon="key"
                        className="mt-1 block w-full text-xs py-1.5"
                        value={data.username}
                        onChange={(e) => setData("username", e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError
                        className="mt-1 text-[10px]"
                        message={errors.username}
                    />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="text-xs text-gray-800">
                            Your email address is unverified.{" "}
                            <Link
                                href={route("verification.send")}
                                method="post"
                                as="button"
                                className="rounded-md text-xs text-gray-600 underline hover:text-gray-900 focus:outline-none"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === "verification-link-sent" && (
                            <div className="mt-1 text-xs font-medium text-primary-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                    <PrimaryButton
                        disabled={processing}
                        className="h-8 px-3 text-xs"
                    >
                        Save
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-gray-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
