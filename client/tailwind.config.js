/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Dòng này đảm bảo nó quét tất cả các tệp component của bạn
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}