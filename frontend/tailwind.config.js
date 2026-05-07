/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#22232a",
        lavender: "#c9b8ff",
        mint: "#aee8d2",
        peach: "#ffc9a8",
        cream: "#fff8e8",
        skysoft: "#b9dcff"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(34,35,42,0.12)"
      }
    }
  },
  plugins: []
};

