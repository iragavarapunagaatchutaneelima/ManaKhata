import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#0a0f1e',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-brand':   '0 0 30px rgba(99, 102, 241, 0.25)',
        'glow-gold':    '0 0 30px rgba(245, 158, 11, 0.25)',
        'glow-emerald': '0 0 30px rgba(16, 185, 129, 0.20)',
        'glow-rose':    '0 0 30px rgba(244, 63, 94, 0.25)',
        'card':         '0 8px 32px rgba(0,0,0,0.12)',
        'card-hover':   '0 16px 48px rgba(0,0,0,0.20)',
      },
      backgroundImage: {
        'gradient-brand':    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-gold':     'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        'gradient-emerald':  'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'gradient-rose':     'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
        'gradient-dark':     'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        'gradient-mesh':     'radial-gradient(at 40% 20%, hsla(240,80%,30%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(260,70%,40%,0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(220,80%,20%,0.2) 0px, transparent 50%)',
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease-in-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'float':       'float 3s ease-in-out infinite',
        'spin-slow':   'spin 8s linear infinite',
        'count-up':    'countUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseGlow:  { '0%,100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.6)' } },
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        countUp:    { from: { opacity: '0', transform: 'scale(0.8)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
