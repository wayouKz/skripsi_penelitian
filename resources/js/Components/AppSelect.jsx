import Select from "react-select";
import { getSelectStyles } from "@/utils/selectStyles";

/**
 * Wrapper react-select yang sudah:
 * - style mengikuti tema (--color-primary)
 * - menuPortal + z-index tinggi (aman di modal)
 * - size sm/md
 *
 * Props tambahan:
 * - isEmpty: border kuning jika belum dipilih
 * - error: border merah
 * - size: "sm" | "md"
 * - styles: merge override jika perlu
 */
export default function AppSelect({
    isEmpty = false,
    error = false,
    size = "sm",
    styles: stylesOverride,
    className = "w-full text-xs",
    classNamePrefix = "react-select",
    menuPortalTarget,
    menuPosition = "fixed",
    ...props
}) {
    const baseStyles = getSelectStyles({ isEmpty, error, size });
    const styles = stylesOverride
        ? {
              ...baseStyles,
              ...stylesOverride,
              // biar menuPortal tetap aman kalau override partial
              menuPortal: stylesOverride.menuPortal || baseStyles.menuPortal,
          }
        : baseStyles;

    return (
        <Select
            className={className}
            classNamePrefix={classNamePrefix}
            styles={styles}
            menuPortalTarget={
                menuPortalTarget ??
                (typeof document !== "undefined" ? document.body : null)
            }
            menuPosition={menuPosition}
            {...props}
        />
    );
}
