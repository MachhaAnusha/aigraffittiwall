/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0d0d0d',
        'bg-secondary': '#1a1a1a',
        'bg-tertiary': '#252525',
        border: '#333333',
        'accent-primary': '#FF2D95',
        'accent-secondary': '#00CFFF',
        'accent-glow': '#7B2FFF',
        'text-primary': '#F5F5F5',
        'text-secondary': '#999999',
        success: '#39FF14',
        danger: '#FF4444',
        warning: '#FFD700',
      },
      fontFamily: {
        bangers: ['Bangers', 'cursive'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
