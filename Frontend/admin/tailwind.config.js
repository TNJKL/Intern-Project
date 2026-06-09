/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#d37533", // Coffee accent color
        coffee: {
          dark: "#3c2a21",
          medium: "#634832",
          light: "#6f4e37",
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable tailwind's reset to avoid conflicts with Ant Design
  },
}
