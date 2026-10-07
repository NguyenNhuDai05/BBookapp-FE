import { useEffect, useState } from 'react';
import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types/auth';
import { hasMuaAccess } from '../utils/appMode';

export function useProtectedRoute() {
  const { user, isAuthenticated, activeMode, initialize, switchMode, isModeSwitching } = useAuthStore();
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
    if (!isReady || !rootNavigationState?.key || isModeSwitching) return;

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

      // Signed-in Customer/MUA can recover their password without leaving the account first.
      if (inAuthGroup && segments[1] === 'forgot-password') return;

      const canUseMua = hasMuaAccess(user);

      if (activeMode === 'MUA' && canUseMua) {
        if (inAuthGroup || inTabsGroup || inAdminGroup) {
          router.replace('/(mua)/dashboard');
        }
        return;
      }

      // role/hasMuaProfile represents capability; activeMode controls which UI is active.
      // Recover safely if stale state ever requests MUA mode without an MUA profile.
      if (activeMode === 'MUA' && !canUseMua) {
        void switchMode('CUSTOMER').catch(() => useAuthStore.setState({ activeMode: 'CUSTOMER' }));
      }

      if (inAuthGroup || inMuaGroup || inAdminGroup) {
        router.replace('/(tabs)/home');
      }
    }
  }, [user, isAuthenticated, activeMode, segments, isReady, rootNavigationState?.key, router, switchMode, isModeSwitching]);

  if (!isReady) return false;
  const inAuthGroup = segments[0] === '(auth)';
  const isPolicyScreen = segments[0] === 'policy';
  if (!isAuthenticated) return inAuthGroup || isPolicyScreen;
  if (user?.role === UserRole.Admin) return segments[0] === '(admin)';
  return segments[0] !== '(admin)';
}
