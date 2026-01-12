/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Geologica', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.65rem', { lineHeight: '0.9rem' }],
        'sm': ['0.75rem', { lineHeight: '1rem' }],
        'base': ['0.8rem', { lineHeight: '1.1rem' }],
        'lg': ['0.9rem', { lineHeight: '1.2rem' }],
        'xl': ['1rem', { lineHeight: '1.3rem' }],
        '2xl': ['1.2rem', { lineHeight: '1.5rem' }],
        '3xl': ['1.5rem', { lineHeight: '1.8rem' }],
        '4xl': ['1.8rem', { lineHeight: '2.1rem' }],
        '5xl': ['2.2rem', { lineHeight: '2.5rem' }],
      }
    },
  },
}