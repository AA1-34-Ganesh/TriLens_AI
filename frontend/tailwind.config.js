/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        surface: "#1E293B",
        base: "#0F172A",
        border: "#334155",
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
