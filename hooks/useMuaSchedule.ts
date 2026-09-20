import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { muaScheduleService, type WorkingSchedule } from '../services/muaScheduleService';
import { MUA_ELIGIBILITY_QUERY_KEY } from './useMuaEligibility';

const SCHEDULE_KEY = ['mua', 'schedule', 'me'] as const;

export function useMuaSchedule() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: SCHEDULE_KEY, queryFn: muaScheduleService.getMine });
  const mutation = useMutation({
    mutationFn: (schedules: WorkingSchedule[]) => muaScheduleService.replace(schedules),
    onSuccess: async data => {
      queryClient.setQueryData(SCHEDULE_KEY, data);
      await queryClient.invalidateQueries({ queryKey: MUA_ELIGIBILITY_QUERY_KEY });
    },
  });
  return { ...query, save: mutation.mutateAsync, isSaving: mutation.isPending, saveError: mutation.error };
}
