import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.jsx",
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ["Figtree", ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
                    50: "rgb(var(--color-primary) / 0.08)",
                    100: "rgb(var(--color-primary) / 0.15)",
                    200: "rgb(var(--color-primary-light) / 0.4)",
                    300: "rgb(var(--color-primary-light) / 0.6)",
                    400: "rgb(var(--color-primary-light) / <alpha-value>)",
                    500: "rgb(var(--color-primary) / <alpha-value>)",
                    600: "rgb(var(--color-primary-dark) / <alpha-value>)",
                    700: "rgb(var(--color-primary-dark) / <alpha-value>)",
                    800: "rgb(var(--color-primary-dark) / <alpha-value>)",
                    900: "rgb(var(--color-primary-dark) / <alpha-value>)",
                },
            },
        },
    },

    plugins: [forms],
};
