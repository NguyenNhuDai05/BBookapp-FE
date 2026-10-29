import { api } from './api';
import type { CustomerAiAccess } from './customerAiAccess';
import type { MuaMonetization } from '../hooks/useMuaMonetization';
export type PlanReceipt = { id: string; productId: string; amountVnd: number; state: string; createdAt: string; verifiedPaidAt?: string | null };
export type AccountPlans = { role: string; ai: CustomerAiAccess; mua?: MuaMonetization | null; orders: PlanReceipt[]; evaluatedAt: string };
export const accountPlansService = {
  get: async (): Promise<AccountPlans> => (await api.get<AccountPlans>('/me/plans')).data,
  sync: async (): Promise<AccountPlans> => (await api.post<AccountPlans>('/me/plans/sync')).data,
};
