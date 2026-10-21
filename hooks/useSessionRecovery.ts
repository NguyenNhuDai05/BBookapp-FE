import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// Resume only a failed startup check; initialize coalesces overlapping retries.
export function useSessionRecovery() {
  useEffect(() => {
    let previous = AppState.currentState;
    const listener = AppState.addEventListener('change', next => {
      const resumed = previous !== 'active' && next === 'active';
      previous = next;
      if (resumed && useAuthStore.getState().sessionError) {
        void useAuthStore.getState().initialize().catch(() => undefined);
      }
    });
    return () => listener.remove();
  }, []);
}
