import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        brand: {
          teal: "#40d99d",
          mint: "#4fffb4",
          "light-gray": "#e5e5e5",
          "medium-gray": "#f0f0f0",
          black: "#1a1a1a",
          muted: "#6b7280",
          "bg-alt": "#f8f8f8",
        },
        error: "#dc2626",
        warning: "#f59e0b",
        info: "#3b82f6",
        border: "#e5e5e5",
        input: "#e5e5e5",
        ring: "#40d99d",
        background: "#ffffff",
        foreground: "#1a1a1a",
        primary: {
          DEFAULT: "#40d99d",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f0f0f0",
          foreground: "#1a1a1a",
        },
        muted: {
          DEFAULT: "#f8f8f8",
          foreground: "#6b7280",
        },
        accent: {
          DEFAULT: "#4fffb4",
          foreground: "#1a1a1a",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        glow: "0 0 0 1px #40d99d, 0 4px 12px rgba(64, 217, 157, 0.15)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fadeIn 300ms ease-out forwards",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
