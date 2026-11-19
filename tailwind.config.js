/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#080B11",
        backgroundAlt: "#0B0F17",
        surface: "#101623",
        surfaceHover: "#182133",
        surfaceBorder: "#1E293B",
        surfaceElevated: "#161E30",
        surfaceSubtle: "#0D131F",
        accent: {
          cyan: "#00F0FF",
          cyanHover: "#38F5FF",
          purple: "#A855F7",
          purpleHover: "#C084FC",
          emerald: "#10B981",
          emeraldHover: "#34D399",
          amber: "#F59E0B",
          rose: "#F43F5E",
          blue: "#3B82F6",
        },
        brand: {
          50: '#eef8ff',
          100: '#d8effe',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
        },
        neon: {
          cyan: "#00f0ff",
          purple: "#b026ff",
          emerald: "#00ff9d",
          amber: "#ffb700",
          rose: "#ff2a6d",
          blue: "#3b82f6",
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -4px rgba(0, 240, 255, 0.35)',
        'glow-cyan-sm': '0 0 12px -2px rgba(0, 240, 255, 0.4)',
        'glow-purple': '0 0 25px -4px rgba(176, 38, 255, 0.35)',
        'glow-emerald': '0 0 25px -4px rgba(0, 255, 157, 0.35)',
        'glow-rose': '0 0 25px -4px rgba(255, 42, 109, 0.35)',
        'key-chassis': '0 16px 40px 0 rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
        'key-press': '0 2px 0 0 rgba(255, 255, 255, 0.12) inset, 0 1px 3px 0 rgba(0,0,0,0.9)',
        'key-active': '0 0 18px 3px rgba(0, 240, 255, 0.65), 0 0 0 1px rgba(0, 240, 255, 0.9) inset',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'card-hover': '0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'rgb-flow': 'rgbFlow 8s linear infinite',
        'wave-flow': 'waveFlow 2s ease-in-out infinite',
      },
      keyframes: {
        rgbFlow: {
          '0%, 100%': { filter: 'hue-rotate(0deg)' },
          '50%': { filter: 'hue-rotate(180deg)' },
        },
        waveFlow: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
