/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F3F7EC',
          100: '#E3EDD4',
          200: '#C8DCAC',
          300: '#ADCA84',
          400: '#92B85C',
          500: '#8B9E5C',  // logo sage green
          600: '#6B8442',  // primary buttons
          700: '#5A7038',  // hover
          800: '#4A5C2E',  // active / nav bg
          900: '#3A4A24',  // darkest
        },
      },
    },
  },
  plugins: [],
}