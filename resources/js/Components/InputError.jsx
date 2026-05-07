export default function InputError({ message, className = "", ...props }) {
    return message ? (
        <>
            <div className="flex items-start mt-2">
                <i className="fa fa-exclamation-circle text-red-600 me-1 mt-2"></i>
                <p {...props} className={"text-sm text-red-600 " + className}>
                    {message}
                </p>
            </div>
        </>
    ) : null;
}
