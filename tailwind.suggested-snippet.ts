export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" }
    },
    extend: {
      borderRadius: { xl: "1rem", "2xl": "1.5rem" }
    }
  }
};
