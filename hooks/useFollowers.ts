import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { followService } from '../services/followService';

export function useFollowerSummary() {
  const userId = useAuthStore(s => s.user?.id);
  const query = useQuery({ queryKey: ['mua-followers-summary', userId], queryFn: followService.ownSummary, enabled: !!userId, staleTime: 30000 });
  const { refetch } = query;
  useFocusEffect(useCallback(() => { if (userId) void refetch(); }, [userId, refetch]));
  return query;
}
export function useFollowers(search: string) {
  const userId = useAuthStore(s => s.user?.id);
  const [q, setQ] = useState(search.trim());
  useEffect(() => { const timer = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  const query = useInfiniteQuery({ queryKey: ['mua-followers', userId, q],
    queryFn: ({ pageParam, signal }) => followService.followers(pageParam, q, signal),
    initialPageParam: null as string | null, enabled: !!userId,
    getNextPageParam: page => page.hasMore ? page.nextCursor ?? undefined : undefined, staleTime: 30000,
  });
  const { refetch } = query;
  useFocusEffect(useCallback(() => { if (userId) void refetch(); }, [userId, refetch]));
  const rows = query.data?.pages.flatMap(page => page.items) ?? [];
  return { ...query, items: [...new Map(rows.map(item => [item.userId, item])).values()], searching: q !== search.trim() };
}
