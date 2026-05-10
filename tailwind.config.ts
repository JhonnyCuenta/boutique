import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/config/**/*.{ts,tsx}', './src/lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#050505',
          900: '#0a0b0d',
          850: '#101115',
          800: '#17191f',
        },
        ember: '#f97316',
        gold: '#f6c453',
        danger: '#ef4444',
        graphite: '#9ca3af',
      },
      boxShadow: {
        glow: '0 0 40px rgb(249 115 22 / 0.28)',
        panel: '0 24px 80px rgb(0 0 0 / 0.42)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
