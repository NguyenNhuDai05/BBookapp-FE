/** @type {import('tailwindcss').Config} */
module.exports = {
  // Bản v4 bắt buộc phải có dòng content này để quét các file code của bạn
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")], // ✨ Dòng đặc quyền bắt buộc của NativeWind v4
  theme: {
    extend: {
      colors: {
        peach: {
          light: "#FFF0EA", // Màu hồng đào nhạt nền app B-Book
          DEFAULT: "#FFBFB0",
        },
        bbook: {
          pinkLight: "#FFB6C1",
          pinkMedium: "#FF69B4",
          pinkDark: "#C71585",
          accent: "#FF1493", // Màu hồng Neon nổi bật cho nút Book lịch
        },
      },
    },
  },
  plugins: [],
};
