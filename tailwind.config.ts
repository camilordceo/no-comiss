import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#40d99d",
        "primary-hover": "#4fffb4",
        accent: "#4fffb4",
        border: "#e5e5e5",
        surface: "#f0f0f0",
        foreground: "#1a1a1a",
        background: "#ffffff",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        component: "8px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.08)",
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};
export default config;
