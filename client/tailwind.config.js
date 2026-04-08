/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf8ee',
          100: '#faf0d3',
          200: '#f5e0a6',
          300: '#edca6e',
          400: '#e4b042',
          500: '#C9A84C',
          600: '#a8862c',
          700: '#866724',
          800: '#6e5222',
          900: '#5c451f',
        },
        cream: {
          50:  '#fafaf7',
          100: '#f5f0e8',
          200: '#ede5d3',
          300: '#ddd0b8',
          400: '#c8b595',
          500: '#b69a72',
        },
        dark: {
          900: '#0f0f0f',
          800: '#1a1a1a',
          700: '#2c2c2c',
          600: '#3d3d3d',
          500: '#555555',
          400: '#777777',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A84C 0%, #e4b042 50%, #a8862c 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)',
      }
    },
  },
  plugins: [],
};
