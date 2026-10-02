import { ApiAdminPayoutRepository } from '../repositories/ApiAdminPayoutRepository';
import type { CompleteAdminPayoutRequest, FailAdminPayoutRequest, StartAdminPayoutRequest } from '../types/adminPayout';
import { api } from './api';

const repository = new ApiAdminPayoutRepository();

export const adminPayoutService = {
  getQueue: () => repository.getQueue(),
  getById: (id: string) => repository.getById(id),
  getTransferQr: async (id: string) => {
    const { data } = await api.get<{ payoutId: string; amount: number; imageDataUrl: string; kind?: 'BANK_GENERATED' | 'MOMO_ORIGINAL'; containsPayoutAmount?: boolean }>(`/admin/payouts/${id}/transfer-qr`);
    if (data.payoutId !== id || !/^data:image\/(png|jpeg);base64,/.test(data.imageDataUrl)) throw new Error('QR payout không hợp lệ.');
    return data;
  },
  startProcessing: (id: string, request: StartAdminPayoutRequest) => repository.startProcessing(id, request),
  complete: (id: string, request: CompleteAdminPayoutRequest) => repository.complete(id, request),
  fail: (id: string, request: FailAdminPayoutRequest) => repository.fail(id, request),
};
