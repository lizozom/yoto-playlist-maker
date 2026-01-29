/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        yoto: {
          orange: '#FF6B35',
          blue: '#4ECDC4',
          purple: '#7B68EE',
          pink: '#FF69B4',
          yellow: '#FFD93D',
        },
      },
    },
  },
  plugins: [],
};
