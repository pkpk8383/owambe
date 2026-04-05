/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    './middleware.ts',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          bg: 'var(--brand-bg)',
        },
      },
      fontFamily: {
        brand: ['var(--brand-font)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        portal: 'var(--radius)',
      },
    },
  },
  plugins: [],
};
