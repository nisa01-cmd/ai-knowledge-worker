/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",        // App Router pages
    "./components/**/*.{js,ts,jsx,tsx}", // Components
    "./lib/**/*.{js,ts,jsx,tsx}",        // (optional) utilities/helpers
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"], // clean modern font
      },
    },
  },
  plugins: [],
};
