import { Stack, router } from "expo-router";
import { useEffect } from "react";
import "../global.css";
import { QueryClientProvider } from '@tanstack/react-query';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationService } from '../services/NotificationService';

export default function RootLayout() {
  useProtectedRoute();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let removeNotificationListener: (() => void) | undefined;
    let isDisposed = false;

    NotificationService.registerDevice().catch(error => console.warn('Không thể đăng ký push token', error));

    NotificationService.addNavigationListener(url => {
      if (url.startsWith('/booking/')) router.push(url as `/booking/${string}`);
    }).then(remove => {
      if (isDisposed) remove();
      else removeNotificationListener = remove;
    });

    return () => {
      isDisposed = true;
      removeNotificationListener?.();
    };
  }, [isAuthenticated]);

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
