import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/walletService';

export const useWallet = () => useQuery({
  queryKey: ['wallet'],
  queryFn: walletService.getWallet,
});

export const useCreateTopUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, returnUrl, cancelUrl }: { amount: number; returnUrl: string; cancelUrl: string }) =>
      walletService.createTopUp(amount, returnUrl, cancelUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['walletTopUps'] }),
  });
};
