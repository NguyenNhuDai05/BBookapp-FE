module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Ép bộ dịch Expo nhận diện Tailwind trực tiếp thông qua luồng xử lý JSX
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      "react-native-reanimated/plugin", // Thêm vào để chạy mượt hiệu ứng chữ chạy màn hình Splash
    ],
  };
};
