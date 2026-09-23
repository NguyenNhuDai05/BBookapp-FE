import { useEffect, useState } from 'react';
import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types/auth';

export function useProtectedRoute() {
  const { user, isAuthenticated, activeMode, initialize, switchMode } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Initialize auth state on mount
    initialize().finally(() => {
      if (isMounted) setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, [initialize]);

  useEffect(() => {
    if (!isReady || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isPolicyScreen = segments[0] === 'policy';
    
    if (
      // If the user is not authenticated and not already in the auth group...
      !isAuthenticated &&
      !inAuthGroup &&
      !isPolicyScreen
    ) {
      // Redirect to the login page.
      router.replace('/(auth)/login');
    } else if (isAuthenticated) {
      // If the user is authenticated, check their role to see if they are in the correct group
      const inTabsGroup = segments[0] === '(tabs)';
      const inMuaGroup = segments[0] === '(mua)';
      const inAdminGroup = segments[0] === '(admin)';

      if (user?.role === UserRole.Admin) {
        // Admin is isolated from every customer/MUA/checkout/payment route,
        // including ungrouped Expo Router screens.
        if (!inAdminGroup) {
          router.replace('/(admin)/dashboard');
        }
        return;
      }

      const hasMuaAccess = user?.role === UserRole.MUA || user?.hasMuaProfile === true;

      if (activeMode === 'MUA' && hasMuaAccess) {
        if (inAuthGroup || inTabsGroup || inAdminGroup) {
          router.replace('/(mua)/dashboard');
        }
        return;
      }

      // role/hasMuaProfile represents capability; activeMode controls which UI is active.
      // Recover safely if stale state ever requests MUA mode without an MUA profile.
      if (activeMode === 'MUA' && !hasMuaAccess) {
        switchMode('CUSTOMER');
      }

      if (inAuthGroup || inMuaGroup || inAdminGroup) {
        router.replace('/(tabs)/home');
      }
    }
  }, [user, isAuthenticated, activeMode, segments, isReady, rootNavigationState?.key, router, switchMode]);

  if (!isReady) return false;
  const inAuthGroup = segments[0] === '(auth)';
  const isPolicyScreen = segments[0] === 'policy';
  if (!isAuthenticated) return inAuthGroup || isPolicyScreen;
  if (user?.role === UserRole.Admin) return segments[0] === '(admin)';
  return segments[0] !== '(admin)';
}
