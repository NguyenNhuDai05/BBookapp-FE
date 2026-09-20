import { useQuery } from '@tanstack/react-query';
import { walletService } from '../services/walletService';

export const useWallet = () => useQuery({
  queryKey: ['wallet'],
  queryFn: walletService.getWallet,
});

export const useTopUps = () => useQuery({
  queryKey: ['walletTopUps'],
  queryFn: walletService.getTopUps,
});
