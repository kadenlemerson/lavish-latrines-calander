/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand blue — replaces former gold scale.
        // 500 is the brand color (~#1a1adb) used on lavishlatrines.com.
        gold: {
          50:  '#eff1ff',
          100: '#dfe2ff',
          200: '#c2c7ff',
          300: '#9aa3ff',
          400: '#5868ff',
          500: '#1a1adb',
          600: '#1414af',
          700: '#10108a',
          800: '#0d0d6e',
          900: '#0a0a55',
        },
        // Near-white with a hint of cool — replaces former cream scale.
        cream: {
          50:  '#ffffff',
          100: '#f5f7fc',
          200: '#e6eaf4',
          300: '#d2d8e8',
          400: '#a7afc8',
          500: '#7e87a8',
        },
        // Dark navy scale — replaces former dark/black scale so it harmonises
        // with the royal blue accents.
        dark: {
          900: '#05072a',
          800: '#0d1230',
          700: '#1f2542',
          600: '#353b58',
          500: '#4d5673',
          400: '#6b7494',
        }
      },
      fontFamily: {
        // Both stacks now use Inter for a clean sans-serif look matching
        // lavishlatrines.com. The 'serif' alias is kept so existing
        // `font-serif` Tailwind class usages continue to work.
        serif: ['Inter', 'system-ui', 'sans-serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #1a1adb 0%, #5868ff 50%, #1414af 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0d1230 0%, #1f2542 100%)',
      }
    },
  },
  plugins: [],
};
