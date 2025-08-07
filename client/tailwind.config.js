/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#111',
        foreground: '#f3f4f6',
        muted: '#1f1f1f',
        primary: '#7c3aed'
      }
    }
  },
  plugins: []
};
