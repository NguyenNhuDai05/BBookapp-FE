import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// Retry only the failed session read. Never replay user mutations.
export function useSessionRecovery() {
  const needsRecovery = useAuthStore(state => Boolean(state.sessionError));
  useEffect(() => {
    if (!needsRecovery) return;
    let disposed = false;
    let inFlight = false;
    let delay = 3000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let appState = AppState.currentState;
    const isActive = () => appState == null || appState === 'active';
    const clearTimer = () => { clearTimeout(timer); timer = undefined; };
    const schedule = () => {
      if (!disposed && isActive() && useAuthStore.getState().sessionError) {
        timer = setTimeout(retry, delay);
        delay = Math.min(delay * 2, 15000);
      }
    };
    const retry = async () => {
      clearTimer();
      if (disposed || inFlight || !isActive() || !useAuthStore.getState().sessionError) return;
      inFlight = true;
      try { await useAuthStore.getState().initialize(); }
      catch { /* Keep waiting for a successful session check. */ }
      finally { inFlight = false; schedule(); }
    };
    const listener = AppState.addEventListener('change', next => {
      const resumed = appState !== 'active' && next === 'active';
      appState = next;
      clearTimer();
      if (resumed) { delay = 3000; void retry(); }
      else if (!inFlight) schedule();
    });
    schedule();
    return () => { disposed = true; clearTimer(); listener.remove(); };
  }, [needsRecovery]);
}
