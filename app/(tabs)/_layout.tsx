import { Tabs } from "expo-router";
import {
  CalendarDays,
  CircleUserRound,
  House,
  MessageCircle,
  Search,
} from "lucide-react-native";
import { ActivityIndicator, Platform, View } from "react-native";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { BrandColors, Shadows } from "../../constants/theme";

export default function TabsLayout() {
  const checkingAuth = useRequireAuth();

  if (checkingAuth) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BrandColors.bgPrimary,
        }}
      >
        <ActivityIndicator size="large" color={BrandColors.accentPink} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,

          height: 104,
          paddingTop: 8,
          paddingBottom: 28,

          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,

          backgroundColor: "#fff",

          borderTopWidth: 0,

          ...Shadows.tabBar,
        },

        tabBarItemStyle:
          Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined,

        tabBarActiveTintColor: BrandColors.accentPinkLight,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Tìm kiếm",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Booking",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <CircleUserRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
