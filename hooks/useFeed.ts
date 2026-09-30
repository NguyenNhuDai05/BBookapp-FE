import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FeedSessionExpiredError, getFeedPage } from '../services/feedService';
import { useAuthStore } from '../store/useAuthStore';
export const useFeed = () => {
  const userId = useAuthStore(s => s.user?.id);
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['feed', userId],
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    staleTime: 30_000,
    retry: (attempt, error) => !(error instanceof FeedSessionExpiredError) && attempt < 2,
    queryFn: ({ pageParam }) => getFeedPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    // Keep the screens' existing array-of-pages contract.
    select: data => ({ ...data, pages: data.pages.map(page => page.items) }),
  });
  const { refetch } = query;
  useFocusEffect(useCallback(() => {
    // Tab screens stay mounted: returning to them must refresh stale snapshots.
    // Do not let a background refresh cancel an in-progress page request.
    const state = client.getQueryState(['feed', userId]);
    if (state && state.fetchStatus === 'idle' &&
      (state.isInvalidated || Date.now() - state.dataUpdatedAt >= 30_000)) {
      void refetch({ cancelRefetch: false });
    }
  }, [client, userId, refetch]));
  return { ...query, isSessionExpired: query.error instanceof FeedSessionExpiredError };
};
