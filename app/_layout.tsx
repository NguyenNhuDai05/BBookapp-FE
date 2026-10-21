import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import "../global.css";
import { QueryClientProvider } from '@tanstack/react-query';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useSessionRecovery } from '../hooks/useSessionRecovery';

import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationService } from '../services/NotificationService';
import { setUnauthorizedHandler } from '../services/api';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { OverlayProvider } from '../components/ui/OverlayProvider';
import { DialogHost } from '../components/ui/DialogHost';

export default function RootLayout() {
  const canRenderRoute = useProtectedRoute();
  useSessionRecovery();
  const [retrying, setRetrying] = useState(false);
  const review = useAuthStore(state => state.user?.isDemoAccount === true);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Register synchronously before child screens can start protected queries.
  // This closes the startup race where an expired persisted JWT could trigger
  // several 401 responses before an effect had installed the handler.
  setUnauthorizedHandler(async (expectedToken) => {
    await useAuthStore.getState().expireSession(expectedToken);
    if (!useAuthStore.getState().isAuthenticated) router.replace('/(auth)/login');
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

  const sessionError = useAuthStore(state => state.sessionError);
  if (sessionError) return <View style={{flex:1,justifyContent:'center',padding:24,gap:20,backgroundColor:'#FFF6F8'}}>
    <Text accessibilityRole="header" style={{fontSize:20,fontWeight:'600',color:'#291D25'}}>Chưa thể kết nối</Text>
    <Text style={{fontSize:15,color:'#55434F'}}>{sessionError}</Text>
    <Pressable accessibilityRole="button" disabled={retrying} onPress={() => { setRetrying(true); void useAuthStore.getState().initialize().finally(() => setRetrying(false)); }} style={{padding:16,backgroundColor:'#A82459',borderRadius:12}}><Text style={{color:'#FFF',textAlign:'center'}}>{retrying ? 'Đang kết nối…' : 'Thử kết nối lại'}</Text></Pressable>
  </View>;
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
