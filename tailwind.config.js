/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f5ff',
          100: '#ededff',
          200: '#dcdcff',
          300: '#c1c0ff',
          400: '#a19dff',
          500: '#7269c6',
          600: '#383563',
          700: '#2d2a4f',
          800: '#22213b',
          900: '#1a1927',
        },
        secondary: {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f5f5f5',
          300: '#e5e5e5',
          400: '#d4d4d4',
          500: '#a3a3a3',
          600: '#737373',
          700: '#525252',
          800: '#404040',
          900: '#262626',
        },
        accent: {
          50: '#f3f2ff',
          100: '#e9e7ff',
          200: '#d5d2ff',
          300: '#b5afff',
          400: '#8f86ff',
          500: '#7269c6',
          600: '#5a52b5',
          700: '#4a438f',
          800: '#3c3773',
          900: '#322f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 4px rgba(56, 53, 99, 0.05), 0 1px 2px rgba(56, 53, 99, 0.1)',
        fixture: '0 4px 6px -1px rgba(56, 53, 99, 0.1), 0 2px 4px -1px rgba(56, 53, 99, 0.06)',
      },
    },
  },
  plugins: [],
};