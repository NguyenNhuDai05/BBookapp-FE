import { useMutation, useQueryClient } from '@tanstack/react-query';
import { muaApplicationService } from '../services/muaOnboardingService';
import type { MuaApplicationRequestDto } from '../types/onboarding';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types/auth';

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: MuaApplicationRequestDto) => {
      const authState = useAuthStore.getState();

      // A failed profile update can leave the account upgraded already. Skip
      // the non-idempotent upgrade endpoint when the user retries the form.
      if (authState.user?.role !== UserRole.MUA) {
        const upgraded = await authState.becomeMUA();
        if (!upgraded) throw new Error('Không thể kích hoạt hồ sơ Makeup Artist.');
      }

      return muaApplicationService.submitApplication(request);
    },
    onSuccess: async () => {
      // Refresh the canonical user flags returned by the backend after the
      // profile has been created/updated.
      await useAuthStore.getState().initialize();
      // Invalidate queries so that the user's new DRAFT MUA profile is fetched
      await queryClient.invalidateQueries({ queryKey: ['muaProfile', 'me'] });
    },
  });
};
