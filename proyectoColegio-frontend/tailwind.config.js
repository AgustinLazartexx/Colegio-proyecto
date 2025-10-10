/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#B1C4D8",
        secondary: "#060F4C",
        accent: "#007ACC",
      },
    },
  },
  plugins: [],
}