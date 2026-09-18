import { Stack, router } from "expo-router";
import { useEffect } from "react";
import * as Notifications from 'expo-notifications';
import "../global.css";
import { QueryClientProvider } from '@tanstack/react-query';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationService } from '../services/NotificationService';

export default function RootLayout() {
  const isReady = useProtectedRoute();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    NotificationService.registerDevice().catch(error => console.warn('Không thể đăng ký push token', error));
    const openNotification = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/booking/')) router.push(url as `/booking/${string}`);
    };
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) openNotification(lastResponse.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener(response => openNotification(response.notification));
    return () => subscription.remove();
  }, [isAuthenticated]);

  if (!isReady) return null; // or a splash screen

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="mua-detail"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="portfolio-detail"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
