import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { appCommerce } from '../services/appCommerce';
import { useAuthStore } from '../store/useAuthStore';

export function useAppCommerce() {
  const user = useAuthStore(state => state.user);
  const mode = useAuthStore(state => state.activeMode) || 'CUSTOMER';
  const enabled = !!user?.id && !user.isDemoAccount;
  const query = useQuery({ queryKey: ['app-commerce-catalog', user?.id, mode], queryFn: () => appCommerce.catalog(user!.id, mode), enabled, staleTime: 0, retry: 1 });
  const { refetch } = query;
  useFocusEffect(useCallback(() => { if (enabled) void refetch(); }, [enabled, refetch]));
  return query;
}
