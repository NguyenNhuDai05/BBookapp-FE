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
import { OverlayProvider } from '../components/ui/OverlayProvider';
import { DialogHost } from '../components/ui/DialogHost';

export default function RootLayout() {
  const canRenderRoute = useProtectedRoute();
  const review = useAuthStore(state => state.user?.isDemoAccount === true);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Register synchronously before child screens can start protected queries.
  // This closes the startup race where an expired persisted JWT could trigger
  // several 401 responses before an effect had installed the handler.
  setUnauthorizedHandler(async () => {
    await useAuthStore.getState().expireSession();
    router.replace('/(auth)/login');
  });

  useEffect(() => {
    if (!isAuthenticated || review) return;

    let removeNotificationListener: (() => void) | undefined;
    let removePushTokenListener: (() => void) | undefined;
    let isDisposed = false;

    NotificationService.registerDevice().catch(error => console.warn('Không thể đăng ký push token', error));
    NotificationService.addPushTokenListener().then(remove => {
      if (isDisposed) remove();
      else removePushTokenListener = remove;
    });

    NotificationService.addNavigationListener(url => {
      if (url.startsWith('/booking/') || url.startsWith('/chat/') || url.startsWith('/refund/')) router.push(url as never);
    }).then(remove => {
      if (isDisposed) remove();
      else removeNotificationListener = remove;
    });

    return () => {
      isDisposed = true;
      removeNotificationListener?.();
      removePushTokenListener?.();
    };
  }, [isAuthenticated, review]);

  if (!canRenderRoute) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF6F8' }}><ActivityIndicator size="large" color="#F55389" /></View>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
       <OverlayProvider>
       <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(mua)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="policy" />

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
       <DialogHost />
       </OverlayProvider>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}
