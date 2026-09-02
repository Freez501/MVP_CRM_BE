/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-app": "#f9ece6",
        "bg-card": "#fefdfd",
        "bg-sidebar": "#e2ddd8",
        border: "#e2ddd8",
        "border-sketch": "#c8c0b6",
        "surface-secondary": "#c8c0b6",
        "accent-primary": "#ecec80",
        "accent-secondary": "#d0ba8e",
        brand: "#521715",
        "text-primary": "#141414",
        "text-secondary": "#47403a",
        "text-tertiary": "#7c6e62",
        "text-inverse": "#fefdfd",
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', "serif"],
        montserrat: ["Montserrat", "sans-serif"],
        script: ['"Dancing Script"', "cursive"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(20, 20, 20, 0.04)",
        modal: "0 8px 32px rgba(20, 20, 20, 0.08)",
        lift: "0 4px 16px rgba(20, 20, 20, 0.06)",
      },
    },
  },
  plugins: [],
}
