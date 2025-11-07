/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#A8D8EA',
          pink: '#FFB6C1',
          'light-blue': '#E3F2FD',
          'light-pink': '#FFE4E9',
        }
      }
    },
  },
  plugins: [],
};
