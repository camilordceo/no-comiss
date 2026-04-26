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
      padding: "1.25rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Cappuccino System
        espresso: "var(--espresso)",
        "espresso-2": "var(--espresso-2)",
        ink: "var(--ink)",
        crema: "var(--crema)",
        "crema-2": "var(--crema-2)",
        "crema-3": "var(--crema-3)",
        ivory: "var(--ivory)",
        paper: "var(--paper)",
        coral: "var(--coral)",
        "coral-deep": "var(--coral-deep)",
        "coral-tint": "var(--coral-tint)",
        moss: "var(--moss)",
        rust: "var(--rust)",
        rule: "var(--rule)",
        "rule-strong": "var(--rule-strong)",

        // Aliases for shadcn-style components
        background: "var(--crema)",
        foreground: "var(--text)",
        border: "var(--rule-strong)",
        input: "var(--ivory)",
        ring: "var(--espresso)",
        primary: {
          DEFAULT: "var(--espresso)",
          foreground: "var(--text-on-dark)",
        },
        secondary: {
          DEFAULT: "var(--ivory)",
          foreground: "var(--text)",
        },
        muted: {
          DEFAULT: "var(--crema-2)",
          foreground: "var(--text-3)",
        },
        accent: {
          DEFAULT: "var(--coral)",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "var(--rust)",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "var(--ivory)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--ivory)",
          foreground: "var(--text)",
        },
        // Text scale
        text: "var(--text)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        "text-on-dark": "var(--text-on-dark)",
        "text-on-dark-2": "var(--text-on-dark-2)",
        // Status semantics
        success: "var(--moss)",
        warning: "var(--coral-deep)",
        error: "var(--rust)",
        info: "var(--espresso)",
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        sans: [
          "var(--font-inter-tight)",
          "Inter Tight",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "2px",
        md: "2px",
        lg: "2px",
        xl: "4px",
        full: "9999px",
      },
      boxShadow: {
        none: "none",
        sm: "none",
        DEFAULT: "none",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
      },
      transitionTimingFunction: {
        cap: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
      transitionDuration: {
        "180": "180ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
