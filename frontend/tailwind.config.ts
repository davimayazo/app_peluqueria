import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0c11', // Very deep rich black/indigo
        surface: '#15141b',    // Slightly lighter for cards
        surfaceLayer: '#1e1c25', // Layer over surface
        primary: '#D4AF37',    // Premium Gold
        primaryHover: '#f3c63f',
        textMain: '#ffffff',
        textMuted: '#9ca3af',
        border: 'rgba(255, 255, 255, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(212, 175, 55, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;
