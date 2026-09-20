import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="payouts/index" />
      <Stack.Screen name="payouts/[id]" />
      <Stack.Screen name="refunds/index" />
      <Stack.Screen name="refunds/[id]" />
      <Stack.Screen name="access-denied" />
    </Stack>
  );
}
