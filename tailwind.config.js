module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      pre: ["Pretendard"],
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};
