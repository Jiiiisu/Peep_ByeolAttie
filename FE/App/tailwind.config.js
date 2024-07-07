/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/screens/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        default: {
          default: '#FCFAF7',
        },
        orange: {
          default: '#F29E0D',
        },
      },
    },
  },
  plugins: [],
};
