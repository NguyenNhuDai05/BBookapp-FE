import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types/auth';

export function useProtectedRoute() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize auth state on mount
    initialize().finally(() => {
      setIsReady(true);
    });
  }, [initialize]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (
      // If the user is not authenticated and not already in the auth group...
      !isAuthenticated &&
      !inAuthGroup
    ) {
      // Redirect to the login page.
      router.replace('/(auth)/login');
    } else if (isAuthenticated) {
      // If the user is authenticated, check their role to see if they are in the correct group
      const inTabsGroup = segments[0] === '(tabs)';
      const inMuaGroup = segments[0] === '(mua)';
      const inAdminGroup = segments[0] === '(admin)';

      if (user?.role === UserRole.Customer) {
        // Customers cannot access mua or admin
        if (inMuaGroup || inAdminGroup) {
          router.replace('/(tabs)/explore');
        } else if (inAuthGroup) {
          router.replace('/(tabs)/explore');
        }
      } else if (user?.role === UserRole.MUA) {
        // MUA should ideally stay in (mua), but maybe they can view public pages too?
        // Let's restrict them to (mua) for now as their dashboard, or let them roam.
        // If they are in (auth) or (tabs), push to dashboard
        if (inAuthGroup || inTabsGroup) {
          router.replace('/(mua)/dashboard');
        }
      } else if (user?.role === UserRole.Admin) {
        if (inAuthGroup || inTabsGroup || inMuaGroup) {
          router.replace('/(admin)/dashboard');
        }
      }
    }
  }, [user, isAuthenticated, segments, isReady, router]);

  return isReady;
}
