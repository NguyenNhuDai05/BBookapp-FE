import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muaProfileService } from '../services/muaProfileService';
import type { PayoutSettingsDto } from '../types/muaProfile';
import { MUA_ELIGIBILITY_QUERY_KEY } from './useMuaEligibility';

export const useMuaProfile = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-profile', muaId],
    queryFn: () => muaProfileService.getProfile(muaId),
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
};

export const useUpdateMuaProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof muaProfileService.updateProfile>[0]) => muaProfileService.updateProfile(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mua-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['mua'] });
      await queryClient.invalidateQueries({ queryKey: MUA_ELIGIBILITY_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ['customer-explore'] });
      await queryClient.invalidateQueries({ queryKey: ['nearby-muas'] });
      await queryClient.invalidateQueries({ queryKey: ['advisor'] });
      await queryClient.invalidateQueries({ queryKey: ['mua-styles'] });
      await queryClient.invalidateQueries({ queryKey: ['mua-services'] });
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
