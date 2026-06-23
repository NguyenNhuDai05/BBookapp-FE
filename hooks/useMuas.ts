import { useQuery } from '@tanstack/react-query';
import { muaService } from '../services/muaService';

export const useMuas = () => {
  return useQuery({
    queryKey: ['muas'],
    queryFn: () => muaService.getArtists(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
