import type { Config } from "tailwindcss";

// Tailwind v3 config. (On Tailwind v4 this file is optional — the palette below
// is also available as CSS variables in app/globals.css.)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FBF9F6",
        "paper-2": "#F4EEE4",
        card: "#FFFFFF",
        ink: "#1C1815",
        "ink-soft": "#6A5D52",
        "ink-faint": "#9A8E82",
        orange: "#E8542B",
        burnt: "#C2410C",
        brown: "#5C4434",
        sand: "#D8C3A5",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
