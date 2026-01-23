/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#B06D1E",
        secondary: "#F3961D33",
        accent: "#F29A2C",
        backgground: "#FFFAF2",
        border: "#EAEAEB",
        chatBg: "#F3961D",
        gray: "#9A9CA0",
        dark: "#1D2733",
        light: {
          100: "#F9F9FC",
          200: "#EAEAEB"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
      },
    },
  },
  plugins: [],
}