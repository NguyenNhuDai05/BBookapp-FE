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

export default function TabsLayout() {
  const checkingAuth = useRequireAuth();

  if (checkingAuth) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFF6F8",
        }}
      >
        <ActivityIndicator size="large" color="#F55389" />
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

          elevation: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.12,
          shadowRadius: 18,
        },

        tabBarItemStyle:
          Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined,

        tabBarActiveTintColor: "#F06A8B",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
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
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <CircleUserRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
