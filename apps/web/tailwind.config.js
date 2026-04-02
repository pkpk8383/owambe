/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          50: '#EEF7F2',
          100: '#C5E8D4',
          200: '#9CD9B6',
          300: '#73CA98',
          400: '#4ABB7A',
          500: '#2D6A4F',
          600: '#235C42',
          700: '#1A4D38',
          800: '#123F2E',
          900: '#0A3124',
        },
        accent: {
          DEFAULT: '#E76F2A',
          50: '#FEF3E8',
          100: '#FCDBB8',
          200: '#FAC388',
          300: '#F8AB58',
          400: '#F69328',
          500: '#E76F2A',
          600: '#D4611F',
          700: '#B85218',
          800: '#9C4411',
          900: '#80360A',
        },
        dark: '#1A1612',
        surface: '#FDFAF4',
        border: '#E2DDD5',
        muted: '#9A9080',
      },
      fontFamily: {
        sans: ['var(--font-cabinet)', 'system-ui', 'sans-serif'],
        body: ['var(--font-instrument)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(26,22,18,0.08)',
        lg: '0 8px 40px rgba(26,22,18,0.13)',
      },
      animation: {
        'fade-up': 'fadeUp 0.2s ease',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
