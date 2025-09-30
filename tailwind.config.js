/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand1: '#ffb545',
        brand2: '#00c46a',
        dark1: '#2d3439',
        dark2: '#42484d',
        light1: '#aaaaaa',
        light2: '#ececec',
        light3: '#d6dee0',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
