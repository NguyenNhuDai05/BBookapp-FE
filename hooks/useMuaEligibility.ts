import { useQuery } from '@tanstack/react-query';
import { muaEligibilityService } from '../services/muaEligibilityService';

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
