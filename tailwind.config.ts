import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Add status colors
        status: {
          confirmed: "hsl(var(--status-confirmed))",
          pending: "hsl(var(--status-pending))",
          canceled: "hsl(var(--status-canceled))",
        },
        // Add nail salon palette with rose gold as primary
        rose: {
          50: "#FFF5F7",
          100: "#FFEAEE",
          200: "#FFCFD8",
          300: "#FFA4B8",
          400: "#FF7496",
          500: "#B76E79", // Main Rosê Gold color
          600: "#A25965",
          700: "#8C4652",
          800: "#6F3541",
          900: "#5A2A35",
        },
        // Keep nail palette for compatibility
        nail: {
          50: "hsl(var(--nail-50))",
          100: "hsl(var(--nail-100))",
          200: "hsl(var(--nail-200))",
          300: "hsl(var(--nail-300))",
          400: "hsl(var(--nail-400))",
          500: "hsl(var(--nail-500))",
          600: "hsl(var(--nail-600))",
          700: "hsl(var(--nail-700))",
          800: "hsl(var(--nail-800))",
          900: "hsl(var(--nail-900))",
          950: "hsl(var(--nail-950))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "12px",
        "2xl": "16px",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0, 0, 0, 0.05)",
        card: "0 8px 16px rgba(0, 0, 0, 0.08)",
        premium: "0 8px 24px rgba(183, 110, 121, 0.12)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
