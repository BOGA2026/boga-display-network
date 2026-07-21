import type { Config } from "tailwindcss";

/**
 * Design tokens rationale:
 * - `live` accent (green): reserved for real-time states inside /dashboard only
 *   (online screens, streaming, heartbeat). Never used as brand.
 * - `soft-*` shadows: layered ambient + key light to give cards depth without
 *   contrast noise on dark surfaces.
 * - `ios` easing: cubic-bezier(0.32,0.72,0,1) mirrors Apple's spring feel and
 *   is our single source of truth for interactive motion.
 * - Radii scale up (16/20/24) — generous corners read as "premium SaaS".
 */
export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          end: "hsl(var(--primary-end))",
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
        live: {
          DEFAULT: "hsl(var(--live))",
          foreground: "hsl(var(--live-foreground))",
          glow: "hsl(var(--live-glow))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl2: "20px",
        xl3: "24px",
      },
      boxShadow: {
        "soft-1": "0 1px 2px hsl(0 0% 0% / 0.4), 0 1px 0 hsl(0 0% 100% / 0.03) inset",
        "soft-2": "0 4px 12px hsl(0 0% 0% / 0.35), 0 1px 0 hsl(0 0% 100% / 0.04) inset",
        "soft-3": "0 20px 40px -12px hsl(0 0% 0% / 0.6), 0 1px 0 hsl(0 0% 100% / 0.05) inset",
        "live-pulse": "0 0 0 4px hsl(var(--live) / 0.18), 0 0 16px hsl(var(--live-glow) / 0.5)",
      },
      transitionTimingFunction: {
        ios: "cubic-bezier(0.32, 0.72, 0, 1)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 16px -4px hsl(270 100% 50% / 0.3)" },
          "50%": { boxShadow: "0 0 28px -2px hsl(270 100% 50% / 0.55)" },
        },
        "neon-breathe": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "live-pulse": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--live) / 0.55)" },
          "70%": { boxShadow: "0 0 0 8px hsl(var(--live) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--live) / 0)" },
        },
        "page-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "neon-breathe": "neon-breathe 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "live-pulse": "live-pulse 2s cubic-bezier(0.32, 0.72, 0, 1) infinite",
        "page-in": "page-in 0.24s cubic-bezier(0.32, 0.72, 0, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
