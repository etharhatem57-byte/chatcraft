import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#FFF8FA",
          100: "#FFF0F3",
          200: "#FFE5EC",
          300: "#F6CBD9",
          400: "#E8A4B8",
          500: "#D981B5",
          600: "#BC6597",
          700: "#934D75",
        },
        ink: "#2D2D2D",
        muted: "#6B6B6B",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(233, 145, 193, 0.08)",
        lift: "0 4px 18px rgba(232, 164, 184, 0.12)",
        glow: "0 0 18px rgba(233, 145, 193, 0.24)",
      },
      fontFamily: {
        sans: ["Inter", "Geist", "Tajawal", "Cairo", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 250ms ease-out both",
        "slide-up": "slideUp 300ms ease-out both",
        "soft-pulse": "softPulse 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        softPulse: {
          "0%, 100%": { opacity: "0.45", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
