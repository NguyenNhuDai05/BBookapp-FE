import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { muaStyleService } from '../services/muaStyleService';
import { getApiError } from '../services/api';

export const MUA_STYLES_QUERY_KEY = ['mua-styles'] as const;

export function useMuaStyles() {
  const query = useQuery({
    queryKey: MUA_STYLES_QUERY_KEY,
    queryFn: ({ signal }) => muaStyleService.getCatalog(signal),
    staleTime: 60_000,
    refetchOnMount: 'always',
    retry: (failureCount, error) => failureCount < 1 && ![401, 403].includes(getApiError(error).status ?? 0),
  });
  const { refetch } = query;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refetch(); });
    return () => subscription.remove();
  }, [refetch]);
  return { ...query, data: query.data?.styles, catalog: query.data, catalogSource: query.data?.source, fallbackReason: query.data?.fallbackReason };
}
