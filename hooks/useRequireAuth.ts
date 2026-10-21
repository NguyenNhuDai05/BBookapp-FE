import { useAuthStore } from '../store/useAuthStore';

export function useRequireAuth() {
  return !useAuthStore(state => state.isAuthenticated);
}
