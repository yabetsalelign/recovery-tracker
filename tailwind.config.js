/** @type {import('tailwindcss').Config} */
module.exports = {
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
      },
    },
  },
  plugins: [],
};