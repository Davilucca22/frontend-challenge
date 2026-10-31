import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
// Define os arquivos monitorados, tokens visuais e animações compartilhadas.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#160e0a',
        panel: '#241610',
        'panel-2': '#301e14',
        'panel-3': '#3a2417',
        border: '#51321f',
        text: '#f0e9df',
        muted: '#b89c7a',
        accent: '#d78c49',
        'accent-light': '#eeab62',
        danger: '#f08a72',
        success: '#89b887',
      },
      maxWidth: {
        content: '1240px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
