import { Stack } from "expo-router";
import "../global.css"; // Đảm bảo tệp CSS tổng của NativeWind v4 được kích hoạt trước tiên

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="mua-detail"
        options={{
          headerShown: true,
          title: "Chi tiết Nghệ Sĩ",
          headerTintColor: "#C71585",
        }}
      />
    </Stack>
  );
}
