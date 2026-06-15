/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        brand: {
          blue: '#7dd3fc',
          purple: '#c4b5fd',
          cyan: '#99f6e4',
          red: '#fca5a5',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          hover: 'rgba(255, 255, 255, 0.08)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.20)',
          active: 'rgba(255, 255, 255, 0.35)',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0ab',
          tertiary: '#6b6b78',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Satoshi', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.4)',
        'glass-md': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glass-lg': '0 16px 40px rgba(0, 0, 0, 0.6)',
        'glass-glow': '0 0 30px rgba(255, 255, 255, 0.06), 0 4px 20px rgba(125, 211, 252, 0.08)',
        'glow-blue': '0 0 20px rgba(125, 211, 252, 0.15)',
        'glow-purple': '0 0 20px rgba(196, 181, 253, 0.15)',
        'glow-cyan': '0 0 20px rgba(153, 246, 228, 0.15)',
      },
      animation: {
        'drift-slow': 'drift 20s infinite ease-in-out',
        'drift-medium': 'drift 15s infinite ease-in-out reverse',
        'drift-fast': 'drift 10s infinite ease-in-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.15)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        }
      }
    },
  },
  plugins: [],
}
