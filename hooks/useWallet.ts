import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/walletService';

export const useWallet = () => useQuery({
  queryKey: ['wallet'],
  queryFn: walletService.getWallet,
});

export const useTopUps = () => useQuery({
  queryKey: ['walletTopUps'],
  queryFn: walletService.getTopUps,
});

export const useCreateTopUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount }: { amount: number }) => walletService.createTopUp(amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['walletTopUps'] }),
  });
};
