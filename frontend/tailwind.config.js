/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'temple-purple': '#6b21a8',
        'temple-red': '#ef4444',
        'temple-green': '#22c55e',
      }
    },
  },
  plugins: [],
}
