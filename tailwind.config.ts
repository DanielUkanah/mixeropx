import type { Config } from "tailwindcss";

// Colours read CSS variables (see globals.css) so light and dark share the same class names.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      opacity: { 6: "0.06", 8: "0.08", 12: "0.12" },
      fontFamily: { sans: ['"Figtree Variable"', "system-ui", "sans-serif"] },
      colors: {
        ink: v("ink"),
        canvas: v("canvas"),
        surface: v("surface"),
        spark: v("spark"),
        plum: "#1b1033",
        "on-hivis": v("on-hivis"),
        hivis: { DEFAULT: v("hivis"), dark: v("hivis-dark"), soft: v("hivis-soft") },
        ok: { DEFAULT: v("ok"), soft: v("ok-soft"), glow: "#5fd39a" },
        amber: { glow: "#f59a5b" },
      },
    },
  },
  plugins: [],
};
export default config;
