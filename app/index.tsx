import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { hasMuaAccess } from '../utils/appMode';

export default function IndexScreen() {
  const { user, isAuthenticated, activeMode } = useAuthStore();
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (user?.role === 'ADMIN') return <Redirect href="/(admin)/dashboard" />;
  if (activeMode === 'MUA' && hasMuaAccess(user)) return <Redirect href="/(mua)/dashboard" />;
  return <Redirect href="/(tabs)/home" />;
}
