import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { appCommerce } from '../services/appCommerce';
import { useAuthStore } from '../store/useAuthStore';

export function useAppCommerce() {
  const user = useAuthStore(state => state.user);
  const enabled = !!user?.id && !user.isDemoAccount;
  const query = useQuery({ queryKey: ['app-commerce-catalog', user?.id], queryFn: () => appCommerce.catalog(user!.id), enabled, staleTime: 0, retry: 1 });
  useFocusEffect(useCallback(() => { if (enabled) void query.refetch(); }, [enabled, query.refetch]));
  return query;
}
