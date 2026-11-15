import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountPlansService } from '../services/accountPlans';
import { useAuthStore } from '../store/useAuthStore';
export function useAccountPlans() {
  const user = useAuthStore(state => state.user);
  const mode = useAuthStore(state => state.activeMode) || 'CUSTOMER';
  const client = useQueryClient();
  const key = ['account-plans', user?.id, mode] as const;
  const enabled = !!user?.id && !user.isDemoAccount;
  const query = useQuery({ queryKey: key, queryFn: accountPlansService.sync, enabled, staleTime: 0, retry: 1 });
  const { refetch } = query;
  useFocusEffect(useCallback(() => { if (enabled) void refetch(); }, [enabled, refetch]));
  useEffect(() => {
    if (!enabled) return;
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refetch(); });
    return () => listener.remove();
  }, [enabled, refetch]);
  const sync = useMutation({ mutationFn: accountPlansService.sync, onSuccess: data => {
    if (useAuthStore.getState().user?.id !== user?.id) return;
    client.setQueryData(key, data);
    void client.invalidateQueries({ queryKey: ['customer-ai-access', user?.id] });
    void client.invalidateQueries({ queryKey: ['mua-monetization', user?.id] });
    void client.invalidateQueries({ queryKey: ['sponsored-muas'] });
  } });
  return { ...query, sync, enabled };
}
