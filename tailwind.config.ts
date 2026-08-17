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
        "mic-active": "0 0 20px rgba(217, 129, 181, 0.45), 0 0 35px rgba(232, 164, 184, 0.3)",
      },
      fontFamily: {
        sans: ["Inter", "Geist", "Tajawal", "Cairo", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 250ms ease-out both",
        "slide-up": "slideUp 300ms ease-out both",
        "soft-pulse": "softPulse 1.8s ease-in-out infinite",
        "pop-in": "popIn 260ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-ring": "pulseRing 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite",
        "wave-1": "waveBar 800ms ease-in-out infinite alternate",
        "wave-2": "waveBar 900ms ease-in-out 150ms infinite alternate",
        "wave-3": "waveBar 700ms ease-in-out 300ms infinite alternate",
        "wave-4": "waveBar 850ms ease-in-out 200ms infinite alternate",
        "wave-5": "waveBar 750ms ease-in-out 100ms infinite alternate",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          from: { opacity: "0", transform: "scale(0.9) translateY(6px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        softPulse: {
          "0%, 100%": { opacity: "0.45", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "50%": { transform: "scale(1.25)", opacity: "0.3" },
          "100%": { transform: "scale(1.45)", opacity: "0" },
        },
        waveBar: {
          "0%": { height: "4px" },
          "100%": { height: "18px" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
