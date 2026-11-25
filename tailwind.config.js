/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        magenta: '#FF2E7E',
        lime: '#CCFF00',
        yellow: '#FFE600',
        cyan: '#00E5FF',
        cream: '#FFFDF7',
        mint: '#B8F2E6',
        ink: '#000000',
      },
      fontFamily: {
        display: ['"Archivo Black"', 'Impact', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neo: '4px 4px 0px #000000',
        'neo-sm': '2px 2px 0px #000000',
        'neo-lg': '6px 6px 0px #000000',
        'neo-xl': '8px 8px 0px #000000',
      },
    },
  },
  plugins: [],
};
