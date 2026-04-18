import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        "bg-card": "#000000",
        fg: "#f5f3ee",
        "fg-muted": "#8a8a8a",
        accent: "#1f6b3a",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
        sm: "2px",
        md: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
