import { Tabs } from 'expo-router';
import { LayoutDashboard, ListTodo, Calendar, User, MessageCircle } from 'lucide-react-native';
import { BrandColors } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MuaLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: BrandColors.accentRose,
      tabBarInactiveTintColor: BrandColors.textMuted,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: BrandColors.borderLight,
        height: 60 + insets.bottom,
        paddingBottom: 8 + insets.bottom,
      },
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Lịch',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color }) => <ListTodo size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      
      {/* Hide the non-tab screens */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="manage-portfolio" options={{ href: null }} />
      <Tabs.Screen name="mua-booking/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="mua-booking/complete" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
