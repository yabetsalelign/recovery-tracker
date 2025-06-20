/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        peach: {
          50: "#fff5f0",
          100: "#ffe0d3",
          300: "#fcd9b6",
          500: "#f97316",
          600: "#ea580c",
          800: "#9a3412",
        },
        coral: {
          100: "#ffe4e6",
          600: "#f43f5e",
        },
        cream: {
          50: "#fdfaf6",
        },
        lime: {
          200: "#D9F99D",
          500: "#84CC16",
          600: "#65A30D",
          700: "#4D7C0F",
        },
        emerald: {
          50: "#ECFDF5",
        },
        yellow: {
          400: "#FACC15",
        },
        red: {
          500: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};