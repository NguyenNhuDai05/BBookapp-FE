import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

export function useRequireAuth() {
  const router = useRouter();
  const initialize = useAuthStore((state) => state.initialize);
  const [checkingAuth, setCheckingAuth] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const isAuthenticated = await initialize();

      if (!isMounted) return;

      if (!isAuthenticated) {
        router.replace("/login" as any);
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [initialize, router]);

  return checkingAuth;
}
