import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        slateInk: '#0F172A',
        slateSky: '#E2E8F0',
        cobalt: '#0EA5E9',
        mint: '#10B981',
        amber: '#F59E0B',
        rose: '#F43F5E',
        panel: 'hsl(var(--panel))',
        foreground: 'hsl(var(--foreground))',
      },
      boxShadow: {
        soft: '0 12px 40px -18px rgba(15, 23, 42, 0.55)',
      },
      backgroundImage: {
        mesh:
          'radial-gradient(circle at 20% 20%, rgba(14,165,233,0.2), transparent 45%), radial-gradient(circle at 80% 10%, rgba(16,185,129,0.2), transparent 38%), radial-gradient(circle at 50% 90%, rgba(245,158,11,0.16), transparent 44%)',
      },
      animation: {
        ripple: 'ripple 650ms ease-out forwards',
        pulseSoft: 'pulseSoft 1.4s ease-in-out infinite',
      },
      keyframes: {
        ripple: {
          from: { transform: 'scale(0)', opacity: '0.45' },
          to: { transform: 'scale(4)', opacity: '0' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
