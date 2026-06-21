/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        guitar: {
          dark: '#0d0d1a',
          darker: '#080812',
          accent: '#f97316',
          gold: '#f59e0b',
          purple: '#7c3aed',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
