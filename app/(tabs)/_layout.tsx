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
import { BrandColors, CustomerTabBarTokens, getCustomerTabBarMetrics, Shadows } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const checkingAuth = useRequireAuth();
  const insets = useSafeAreaInsets();
  const { bottomPadding, height: tabBarHeight } = getCustomerTabBarMetrics(insets.bottom);

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

          height: tabBarHeight,
          paddingTop: CustomerTabBarTokens.topPadding,
          paddingBottom: bottomPadding,

          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,

          backgroundColor: "#fff",

          borderTopWidth: 0,

          ...Shadows.tabBar,
        },

        tabBarItemStyle:
          Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined,

        tabBarActiveTintColor: BrandColors.primaryPink,
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
          title: "Khám phá",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Lịch sử",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Tin nhắn",
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
