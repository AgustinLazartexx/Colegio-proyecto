/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ffffff",
        secondary: "#193CB8",
        accent: "#9D0D06",
        navy: "#10233f",
        canvas: "#f7f8fc",
        warm: "#F8F7F4",
      },
    },
  },
  plugins: [],
}