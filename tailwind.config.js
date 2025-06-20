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
        lime: {
          200: "#D9F99D", // Light green for today's button
          500: "#84CC16", // Vibrant green for buttons and gradient
          600: "#65A30D", // Hover state for buttons
          700: "#4D7C0F", // Dark green for headers
        },
        emerald: {
          50: "#ECFDF5", // Very light green for zero-count days
        },
        yellow: {
          400: "#FACC15", // Bright yellow for non-zero days and gradient
        },
        red: {
          500: "#EF4444", // Red for gradient
        },
      },
    },
  },
  plugins: [],
};