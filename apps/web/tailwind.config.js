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
        // Brand
        primary: {
          DEFAULT: '#2D6A4F',
          50:  '#EEF7F2',
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
          50:  '#FEF3E8',
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
        // Semantic
        dark:    '#1A1612',
        mid:     '#3D3730',
        muted:   '#9A9080',
        surface: '#FDFAF4',
        border:  '#E2DDD5',
        danger:  '#E63946',
        success: '#059669',
        warning: '#D97706',
      },
      boxShadow: {
        card:   '0 2px 12px rgba(26,22,18,0.06), 0 1px 3px rgba(26,22,18,0.04)',
        'card-hover': '0 4px 20px rgba(26,22,18,0.10), 0 2px 6px rgba(26,22,18,0.06)',
        modal:  '0 20px 60px rgba(26,22,18,0.15)',
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.22s ease both',
        'fade-in': 'fadeIn 0.18s ease both',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};
