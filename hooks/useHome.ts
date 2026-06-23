import { useQuery } from '@tanstack/react-query';
import { homeService } from '../services/homeService';

export const useHome = () => {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => homeService.getHomeData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
