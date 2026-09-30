import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { isAxiosError } from 'axios';
import { exploreService } from '../services/exploreService';
import type { ExploreFilters, ExploreKind } from '../types/explore';

export const useExplore = () => {
  const client = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<ExploreFilters>({});
  const [kind, setKind] = useState<ExploreKind>('portfolio');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const retry = (attempt: number, error: unknown) =>
    !(isAxiosError(error) && [400, 404, 410].includes(error.response?.status || 0)) && attempt < 1;
  const home = useQuery({
    queryKey: ['customer-explore', 'home'], queryFn: ({ signal }) => exploreService.home(signal),
    staleTime: 60_000, retry,
  });
  const results = useInfiniteQuery({
    queryKey: ['customer-explore', 'results', kind, filters, debouncedQuery],
    queryFn: ({ pageParam, signal }) => exploreService.search(kind, filters, debouncedQuery, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextCursor ?? undefined,
    staleTime: 30_000, retry,
  });
  useFocusEffect(useCallback(() => {
    void client.invalidateQueries({ queryKey: ['customer-explore'], refetchType: 'active' });
  }, [client]));
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (results.data?.pages.flatMap(page => page.items) || []).filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id); return true;
    });
  }, [results.data]);
  const refetch = async () => { await Promise.allSettled([home.refetch(), results.refetch()]); };
  const clearFilters = () => { setSearchQuery(''); setFilters({}); };
  return { home, results, items, filters, setFilters, kind, setKind, searchQuery, setSearchQuery, clearFilters, refetch,
    isTyping: searchQuery.trim() !== debouncedQuery,
    isFiltered: Boolean(searchQuery.trim() || Object.values(filters).some(value => value !== undefined)),
  };
};
