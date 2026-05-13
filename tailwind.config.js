/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        modalIn: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        modalIn: 'modalIn 200ms ease-out',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: true, // all 29 built-in themes
    defaultTheme: 'night',
    logs: false,
  },
}
