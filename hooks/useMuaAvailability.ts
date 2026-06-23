import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muaAvailabilityService } from '../services/muaAvailabilityService';
import type { DailyAvailabilityDto } from '../types/availability';

export const useMuaAvailability = (muaId: string, month: string) => {
  return useQuery({
    queryKey: ['mua-calendar', muaId, month],
    queryFn: () => muaAvailabilityService.getAvailability(muaId, month),
    staleTime: 2 * 60 * 1000, // 2 min
  });
};

export const useUpdateAvailability = (muaId: string, month: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, updates }: { date: string; updates: Partial<DailyAvailabilityDto> }) => 
      muaAvailabilityService.updateAvailability(muaId, date, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mua-calendar', muaId, month] }),
  });
};
