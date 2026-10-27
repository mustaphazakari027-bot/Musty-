import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#F4FCF8',
          100: '#EAF9F1',
          200: '#DDF5E9',
          300: '#C6EEDD',
          400: '#A5E3CC',
        },
        emerald: {
          DEFAULT: '#18A978',
          50: '#E8F8F1',
          100: '#D2F1E4',
          500: '#18A978',
          600: '#128A61',
          700: '#0E6F4E',
        },
        forest: {
          DEFAULT: '#064E3B',
          800: '#043A2C',
          900: '#02291F',
        },
        ink: '#101A17',
        mist: '#F3F5F4',
        line: '#E2E8E5',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        card: '0 18px 40px -28px rgba(6, 78, 59, 0.45)',
        lift: '0 26px 60px -30px rgba(6, 78, 59, 0.55)',
        nav: '0 -10px 30px -20px rgba(6, 78, 59, 0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(.22,.61,.36,1) both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
