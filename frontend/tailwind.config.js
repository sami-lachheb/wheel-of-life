/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        gold: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
        },
        white: '#FFFFFF',
        'light-gray': '#F5F5F5',
        'dark-gray': '#333333',
      },
    },
  },
  plugins: [],
};
