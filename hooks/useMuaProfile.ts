import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muaProfileService } from '../services/muaProfileService';
import type { PayoutSettingsDto } from '../types/muaProfile';

export const useMuaProfile = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-profile', muaId],
    queryFn: () => muaProfileService.getProfile(muaId),
    staleTime: 60 * 60 * 1000, // 1 hour, profile doesn't change often
  });
};

export const useUpdateMuaProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof muaProfileService.updateProfile>[0]) => muaProfileService.updateProfile(data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['mua-profile'] });
      queryClient.refetchQueries({ queryKey: ['feed'] });
      queryClient.refetchQueries({ queryKey: ['mua'] });
    },
  });
};

export const useMuaPayoutSettings = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-payouts', muaId],
    queryFn: () => muaProfileService.getPayoutSettings(muaId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdatePayoutSettings = (muaId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: PayoutSettingsDto) => muaProfileService.updatePayoutSettings(muaId, settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mua-payouts', muaId] }),
  });
};
