import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { muaEligibilityService } from '../services/muaEligibilityService';
import { api } from '../services/api';
import type { MuaEligibility } from '../types/muaEligibility';

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

export function useSubmitMuaForReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post('/Mua/application/submit')).data as MuaEligibility,
    onSuccess: data => client.setQueryData(MUA_ELIGIBILITY_QUERY_KEY, data),
  });
}
