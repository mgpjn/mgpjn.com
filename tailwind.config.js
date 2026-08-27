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
          blue: {
            50: '#f0f8ff',
            100: '#e0f0fe',
            200: '#b9e2fe',
            300: '#7ccafd',
            400: '#36aff9',
            500: '#0c93eb',
            600: '#0074c9',
            700: '#0071bc', // Exact logo blue
            800: '#005f9e',
            900: '#064f82',
            950: '#043255',
          },
          orange: {
            50: '#fff6f0',
            100: '#ffebdc',
            200: '#fed2b9',
            300: '#fdb18b',
            400: '#fb8553',
            500: '#f15a24', // Exact logo orange
            600: '#e14310',
            700: '#bb320c',
            800: '#952a10',
            900: '#792511',
          },
          teal: {
            500: '#0d9488',
            600: '#0f766e',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
