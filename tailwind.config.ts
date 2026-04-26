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
        // Rentmies brand
        brand: {
          green: "#1D9E75",
          "green-dark": "#157a5a",
          "green-light": "#e8f5f0",
        },
        surface: {
          base: "#0f0f1a",
          1: "#1a1a2e",
          2: "#212136",
          3: "#252538",
          4: "#2d2d44",
        },
        // Aliases used by shadcn-style components
        background: "#1a1a2e",
        foreground: "#e8e8f0",
        border: "#3a3a55",
        input: "#252538",
        ring: "#1D9E75",
        primary: {
          DEFAULT: "#1D9E75",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#252538",
          foreground: "#e8e8f0",
        },
        muted: {
          DEFAULT: "#212136",
          foreground: "#8888aa",
        },
        accent: {
          DEFAULT: "#252538",
          foreground: "#e8e8f0",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#252538",
          foreground: "#e8e8f0",
        },
        popover: {
          DEFAULT: "#252538",
          foreground: "#e8e8f0",
        },
        // Status semantics
        success: "#1D9E75",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: ["Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.2)",
        glow: "0 4px 16px rgba(29, 158, 117, 0.25)",
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
        slideIn: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 300ms ease-out forwards",
        "slide-in": "slideIn 240ms ease-out forwards",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
