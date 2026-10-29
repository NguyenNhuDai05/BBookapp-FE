import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountPlansService } from '../services/accountPlans';
import { useAuthStore } from '../store/useAuthStore';
export function useAccountPlans() {
  const user = useAuthStore(state => state.user);
  const client = useQueryClient();
  const key = ['account-plans', user?.id] as const;
  const enabled = !!user?.id && !user.isDemoAccount;
  const query = useQuery({ queryKey: key, queryFn: accountPlansService.get, enabled, staleTime: 0, retry: 1 });
  useFocusEffect(useCallback(() => { if (enabled) void query.refetch(); }, [enabled, query.refetch]));
  useEffect(() => {
    if (!enabled) return;
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void query.refetch(); });
    return () => listener.remove();
  }, [enabled, query.refetch]);
  const sync = useMutation({ mutationFn: accountPlansService.sync, onSuccess: data => {
    client.setQueryData(key, data);
    void client.invalidateQueries({ queryKey: ['customer-ai-access', user?.id] });
    void client.invalidateQueries({ queryKey: ['mua-monetization', user?.id] });
    void client.invalidateQueries({ queryKey: ['sponsored-muas'] });
  } });
  return { ...query, sync, enabled };
}
