/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cinema: {
          950: '#07070c',
          900: '#0c0c14',
          800: '#131320',
          700: '#1c1c2e',
        },
      },
      boxShadow: {
        glow: '0 0 35px -5px rgba(168, 85, 247, 0.35)',
        'glow-rose': '0 0 35px -5px rgba(244, 63, 94, 0.35)',
      },
    },
  },
  plugins: [],
};
