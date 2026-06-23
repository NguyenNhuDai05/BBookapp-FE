import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { muaService } from '../services/muaService';
import { ArtistDto } from '../types/ArtistDto';
import { ServiceDto } from '../types/ServiceDto';
import { useReviews } from './useReviews';

export type TabType = 'portfolio' | 'services' | 'reviews' | 'info';

export function useMuaDetail(id: string) {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');

  // Fetch Artist Detail
  const { 
    data: muaInfo, 
    isLoading: isMuaLoading, 
    error: muaError,
    refetch: refetchMua 
  } = useQuery({
    queryKey: ['mua', id],
    queryFn: () => muaService.getArtistById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Since services & portfolio are returned directly by the mock repository on getArtistById 
  // (to save extra calls), but Clean Arch dictates separate endpoints often, we'll fetch them separately
  // for the sake of following the exact requested architecture, or just use what we already fetched if it's there.
  // The plan requested `useArtistServices` and `useArtistPortfolio` but they can be encapsulated here.

  const { 
    data: services = [], 
    isLoading: isServicesLoading,
    refetch: refetchServices
  } = useQuery({
    queryKey: ['mua-services', id],
    queryFn: () => muaService.getArtistServices(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { 
    data: portfolio = [], 
    isLoading: isPortfolioLoading,
    refetch: refetchPortfolio
  } = useQuery({
    queryKey: ['mua-portfolio', id],
    queryFn: () => muaService.getArtistPortfolio(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { 
    data: reviews = [], 
    isLoading: isReviewsLoading,
    refetch: refetchReviews
  } = useReviews(id);

  const loading = isMuaLoading || isServicesLoading || isPortfolioLoading || isReviewsLoading;
  const error = muaError ? (muaError as Error).message : null;

  const refetch = () => {
    refetchMua();
    refetchServices();
    refetchPortfolio();
    refetchReviews();
  };

  return {
    muaInfo,
    portfolio,
    services,
    reviews,
    activeTab,
    loading,
    error,
    setActiveTab,
    refetch,
  };
}
