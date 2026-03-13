/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        neon: {
          green: '#39FF14',
          blue: '#00F0FF',
          purple: '#BF5FFF',
        }
      }
    },
  },
  plugins: [],
}
