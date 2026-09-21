import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        gis: {
          parcel: "#F97316",
          hover: "#38BDF8",
          selected: "#F59E0B",
          zone: "#8B5CF6",
          building: "#EF4444",
          road: "#10B981"
        }
      },
    },
  },
  plugins: [],
};
export default config;
