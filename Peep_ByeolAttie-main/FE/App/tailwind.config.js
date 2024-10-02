/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    fontFamily: {
      Regular: ['KoddiUDOnGothic-Regular'],
      Bold: ['KoddiUDOnGothic-Bold'],
      ExtraBold: ['KoddiUDOnGothic-ExtraBold'],
    },
    extend: {
      colors: {
        default: {
          1: '#FCFAF7',
          2: '#F5F0E8',
        },
        orange: {
          default: '#F29E0D',
        },
        yellow: {
          default: '#FEF2C2',
        },
        brown: {
          1: '#9C7D4A',
          2: '#E8DECF',
        },
      },
    },
  },
  plugins: [],
};
