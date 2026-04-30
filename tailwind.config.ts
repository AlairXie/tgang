import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f6f7f4',
          100: '#e9ece4',
          200: '#cfd6c5',
          300: '#aab69a',
          400: '#7f8f6c',
          500: '#5d6d4d',
          600: '#46553a',
          700: '#36422d',
          800: '#262e21',
          900: '#161b13',
        },
        moss: {
          50: '#f0f7ee',
          100: '#dcecd6',
          200: '#b5d6ab',
          300: '#82b975',
          400: '#5b9b4c',
          500: '#3f7f33',
          600: '#306526',
          700: '#274e1f',
          800: '#1f3d19',
          900: '#172d12',
        },
        clay: {
          50: '#fbf6ef',
          100: '#f3e7d2',
          200: '#e6cda1',
          300: '#d6ae6b',
          400: '#c89346',
          500: '#b67a2f',
          600: '#925f25',
          700: '#724a1f',
          800: '#523619',
          900: '#382412',
        },
        coral: {
          400: '#ef7d6b',
          500: '#e96354',
          600: '#cf4a3c',
        },
      },
      boxShadow: {
        soft: '0 12px 40px -16px rgba(46, 78, 36, 0.25)',
        ring: 'inset 0 0 0 1px rgba(38, 46, 33, 0.1)',
      },
      backgroundImage: {
        'grain':
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      keyframes: {
        breathIn: {
          '0%': { transform: 'scale(0.55)' },
          '100%': { transform: 'scale(1.1)' },
        },
        breathOut: {
          '0%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(0.55)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.6' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        pulseRing: 'pulseRing 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
