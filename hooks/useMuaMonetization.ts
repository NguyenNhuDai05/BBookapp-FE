import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api, getApiError } from '../services/api';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/useAuthStore';
import { hasMuaAccess } from '../utils/appMode';

export type MuaMonetization = { enabled: boolean; reviewStatus: string; activationStatus: string; hasPermanentActivation: boolean;
  visibilityStatus: string; visibilityEndsAt?: string | null; evaluatedAt: string };
export const monetizationKey = (id: string) => ['mua-monetization', id] as const;
export async function loadMuaMonetization(): Promise<MuaMonetization | null> {
  try { return (await api.get<MuaMonetization>('/mua/me/monetization')).data || null; }
  catch (error) { if (getApiError(error).status === 404) return null; throw error; }
}
export async function refreshMuaMonetization(id: string) {
  await queryClient.fetchQuery({ queryKey: monetizationKey(id), queryFn: loadMuaMonetization, staleTime: 0 });
  await queryClient.invalidateQueries({ queryKey: ['mua'] });
}
export function useMuaEntitlementSync() {
  const user = useAuthStore(state => state.user);
  const enabled = hasMuaAccess(user) && user?.isDemoAccount !== true;
  useEffect(() => {
    if (!enabled || !user?.id) return;
    const refresh = () => { void refreshMuaMonetization(user.id).catch(() => { /* UI reports sync failures; never grant locally. */ }); };
    refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => listener.remove();
  }, [enabled, user?.id]);
}
export function useMuaMonetization() {
  const user = useAuthStore(state => state.user);
  const enabled = hasMuaAccess(user) && user?.isDemoAccount !== true;
  const result = useQuery({ queryKey: monetizationKey(user?.id || ''), queryFn: loadMuaMonetization, enabled, staleTime: 15_000, retry: 1 });
  useFocusEffect(useCallback(() => { if (enabled) void result.refetch(); }, [enabled, result.refetch]));
  return result;
}
