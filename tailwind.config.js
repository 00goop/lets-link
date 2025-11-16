/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          start: "#8053ff",
          end: "#ff6fb1",
        },
      },
      boxShadow: {
        glow: "0 25px 60px rgba(128, 83, 255, 0.25)",
      },
    },
  },
  plugins: [],
};
