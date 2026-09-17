import { api } from './api';
import type { WalletDto, WalletTopUpDto } from '../types/wallet';

export const walletService = {
  async getWallet(): Promise<WalletDto> {
    const { data } = await api.get('/Wallet');
    return data;
  },

  async createTopUp(amount: number, returnUrl: string, cancelUrl: string): Promise<WalletTopUpDto> {
    const { data } = await api.post('/Wallet/topups', { amount, returnUrl, cancelUrl });
    return data;
  },

  async getTopUp(topUpId: string): Promise<WalletTopUpDto> {
    const { data } = await api.get(`/Wallet/topups/${topUpId}`);
    return data;
  },
};
