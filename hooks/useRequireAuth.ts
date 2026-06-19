import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

export function useRequireAuth() {
  const router = useRouter();
  const initialize = useAuthStore((state) => state.initialize);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const routerRef = useRef(router);
  const initializeRef = useRef(initialize);

  routerRef.current = router;
  initializeRef.current = initialize;

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const isAuthenticated = await initializeRef.current();

      if (!isMounted) return;

      if (!isAuthenticated) {
        routerRef.current.replace("/login" as any);
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return checkingAuth;
}
