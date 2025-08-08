/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        monument: ["Monument", "sans-serif"],
        poppins:["Poppins","sans-serif"]
      },
    },
  },
  plugins: [],
}