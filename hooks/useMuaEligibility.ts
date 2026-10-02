import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { muaEligibilityService } from '../services/muaEligibilityService';
import { api } from '../services/api';
import type { MuaEligibility } from '../types/muaEligibility';
import type { MuaIdentityVerificationRequestDto, MuaIdentitySubmission } from '../types/onboarding';

export const MUA_ELIGIBILITY_QUERY_KEY = ['mua', 'eligibility'] as const;

export function useMuaEligibility(enabled = true) {
  return useQuery({
    queryKey: MUA_ELIGIBILITY_QUERY_KEY,
    queryFn: muaEligibilityService.get,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useSaveMuaIdentity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (request: MuaIdentitySubmission) => (await api.put('/Mua/verification/identity', request)).data as MuaEligibility,
    onSuccess: (data) => {
      client.setQueryData(MUA_ELIGIBILITY_QUERY_KEY, data);
      void client.invalidateQueries({ queryKey: ['mua', 'identity'] });
    },
  });
}

export function useMuaIdentity() {
  return useQuery({ queryKey: ['mua', 'identity'], queryFn: async () =>
    (await api.get<MuaIdentityVerificationRequestDto>('/Mua/verification/identity')).data,
    staleTime: 0, gcTime: 0, retry: 1 });
}

export function useSubmitMuaForReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post('/Mua/application/submit')).data as MuaEligibility,
    onSuccess: data => client.setQueryData(MUA_ELIGIBILITY_QUERY_KEY, data),
  });
}
