import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";
import { QueryClientProvider } from '@tanstack/react-query';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationService } from '../services/NotificationService';
import { setUnauthorizedHandler } from '../services/api';
import { AppErrorBoundary } from '../components/AppErrorBoundary';

export default function RootLayout() {
  const canRenderRoute = useProtectedRoute();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Register synchronously before child screens can start protected queries.
  // This closes the startup race where an expired persisted JWT could trigger
  // several 401 responses before an effect had installed the handler.
  setUnauthorizedHandler(async () => {
    await useAuthStore.getState().expireSession();
    router.replace('/(auth)/login');
  });

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

  if (!canRenderRoute) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF6F8' }}><ActivityIndicator size="large" color="#F55389" /></View>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
       <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(mua)" />
        <Stack.Screen name="(admin)" />

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
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}
