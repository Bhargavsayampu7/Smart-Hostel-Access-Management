/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#21808D', // teal-500
          hover: '#1D7480',   // teal-600
          active: '#1A6873',  // teal-700
        },
        secondary: {
          DEFAULT: '#5E5240', // brown-600
        },
        background: '#FCFCF9', // cream-50
        surface: '#FFFFFD',    // cream-100
        text: {
          DEFAULT: '#13343B', // slate-900
          secondary: '#626C71', // slate-500
        },
        error: '#C0152F', // red-500
        success: '#21808D', // teal-500
        warning: '#A84B2F', // orange-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
