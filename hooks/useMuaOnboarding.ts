import { useMutation, useQueryClient } from '@tanstack/react-query';
import { muaApplicationService } from '../services/muaOnboardingService';
import type { MuaApplicationRequestDto } from '../types/onboarding';

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MuaApplicationRequestDto) => {
      return muaApplicationService.submitApplication(request);
    },
    onSuccess: () => {
      // Invalidate queries so that the user's new DRAFT MUA profile is fetched
      queryClient.invalidateQueries({ queryKey: ['muaProfile', 'me'] });
    },
  });
};
