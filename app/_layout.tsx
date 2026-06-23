import { Stack } from "expo-router";
import "../global.css";
import { BrandColors } from "../constants/theme";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

import { queryClient } from '../lib/queryClient';

export default function RootLayout() {
  const isReady = useProtectedRoute();

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
