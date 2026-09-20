import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminPayoutService } from '../services/adminPayoutService';
import type { AdminPayoutDto, CompleteAdminPayoutRequest, FailAdminPayoutRequest, StartAdminPayoutRequest } from '../types/adminPayout';

export const ADMIN_PAYOUTS_KEY = ['admin', 'payouts'] as const;
export const adminPayoutDetailKey = (id: string) => ['admin', 'payouts', id] as const;

export const useAdminPayouts = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ADMIN_PAYOUTS_KEY,
    queryFn: adminPayoutService.getQueue,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void queryClient.invalidateQueries({ queryKey: ADMIN_PAYOUTS_KEY });
    });
    return () => subscription.remove();
  }, [queryClient]);

  return query;
};

export const useAdminPayout = (id: string) => {
  return useQuery({
    queryKey: adminPayoutDetailKey(id),
    enabled: Boolean(id),
    queryFn: () => adminPayoutService.getById(id),
  });
};

const useFinancialMutation = <TRequest>(
  id: string,
  mutationFn: (request: TRequest) => Promise<AdminPayoutDto>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: payout => {
      queryClient.setQueryData<AdminPayoutDto>(adminPayoutDetailKey(id), current => ({
        ...payout,
        accountNumber: current?.accountNumber,
      }));
      void queryClient.invalidateQueries({ queryKey: ADMIN_PAYOUTS_KEY });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: adminPayoutDetailKey(id) });
      void queryClient.invalidateQueries({ queryKey: ADMIN_PAYOUTS_KEY });
    },
  });
};

export const useStartAdminPayout = (id: string) =>
  useFinancialMutation<StartAdminPayoutRequest>(id, request => adminPayoutService.startProcessing(id, request));

export const useCompleteAdminPayout = (id: string) =>
  useFinancialMutation<CompleteAdminPayoutRequest>(id, request => adminPayoutService.complete(id, request));

export const useFailAdminPayout = (id: string) =>
  useFinancialMutation<FailAdminPayoutRequest>(id, request => adminPayoutService.fail(id, request));
