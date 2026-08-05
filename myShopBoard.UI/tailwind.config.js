/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // NOTE: no `container` config. This app is full-bleed - pages run edge to edge beside a
    // fixed nav rail rather than sitting in a centred max-width box.
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },

        // Navigation rail - light and floating in this theme.
        nav: {
          DEFAULT: "hsl(var(--nav))",
          foreground: "hsl(var(--nav-foreground))",
          muted: "hsl(var(--nav-muted))",
          hover: "hsl(var(--nav-hover))",
          active: "hsl(var(--nav-active))",
          border: "hsl(var(--nav-border))",
        },

        // Shop board surface - deliberately dark in both themes.
        board: {
          DEFAULT: "hsl(var(--board))",
          foreground: "hsl(var(--board-foreground))",
          muted: "hsl(var(--board-muted))",
          hover: "hsl(var(--board-hover))",
          border: "hsl(var(--board-border))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        // Soft UI's signature: wide, very low opacity, offset well below the element.
        soft: "0 20px 27px 0 rgb(0 0 0 / 0.05)",
        "soft-sm": "0 4px 12px 0 rgb(0 0 0 / 0.06)",
        "soft-lg": "0 8px 26px -4px rgb(20 20 20 / 0.15), 0 8px 9px -5px rgb(20 20 20 / 0.06)",
        tile: "0 4px 7px -1px rgb(0 0 0 / 0.11), 0 2px 4px -1px rgb(0 0 0 / 0.07)",
      },
      keyframes: {
        "slide-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "slide-in-left": "slide-in-left 180ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
