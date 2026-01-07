/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        phenix: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ad',
          300: '#f6b978',
          400: '#f19341',
          500: '#ee751c',
          600: '#df5b12',
          700: '#b94311',
          800: '#933616',
          900: '#772f15',
        },
      },
    },
  },
  plugins: [],
}
