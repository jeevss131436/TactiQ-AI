import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#080F1F", // page background
          900: "#0A192F", // base surface
          800: "#0F2542", // raised card
          700: "#16305A", // borders / dividers
          600: "#1E3F70",
        },
        cyan: {
          400: "#4EA8DE", // secondary accent, links
          500: "#00B4D8", // primary accent, CTAs, glow
          300: "#7FD4EE",
        },
        signal: {
          up: "#2DD4A7", // strengths
          down: "#FB6B6B", // weaknesses
        },
        slate: {
          300: "#B7C4D6",
          400: "#8CA0B3",
          500: "#6B7F94",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "pitch-grid":
          "linear-gradient(rgba(78,168,222,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(78,168,222,0.06) 1px, transparent 1px)",
        "hero-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(0,180,216,0.18) 0%, rgba(10,25,47,0) 70%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        glow: "0 0 40px rgba(0,180,216,0.25)",
        "glow-sm": "0 0 20px rgba(0,180,216,0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
