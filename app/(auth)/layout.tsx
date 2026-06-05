import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Ẩn thanh header mặc định để tự custom UI tràn viền
        animation: "slide_from_right", // Hiệu ứng lướt sang ngang chuẩn Native
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
