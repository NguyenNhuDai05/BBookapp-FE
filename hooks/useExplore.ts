import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { homeService } from '../services/homeService';

export const useExplore = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const query = useQuery({
    queryKey: ['explore'],
    queryFn: () => homeService.getExploreData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    searchQuery,
    setSearchQuery
  };
};
