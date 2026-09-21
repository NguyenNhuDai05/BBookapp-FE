import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MuaApplicationRequestDto } from '../types/onboarding';
import { useAuthStore } from '../store/useAuthStore';
import { MUA_ELIGIBILITY_QUERY_KEY } from './useMuaEligibility';

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: MuaApplicationRequestDto) => {
      const completed = await useAuthStore.getState().becomeMUA(request);
      if (!completed) throw new Error('Không thể kích hoạt hồ sơ Makeup Artist.');
      return request;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mua-profile', 'me'] });
      await queryClient.invalidateQueries({ queryKey: MUA_ELIGIBILITY_QUERY_KEY });
    },
  });
};
