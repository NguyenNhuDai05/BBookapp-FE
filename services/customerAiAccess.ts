import { api } from './api';
export type CustomerAiAccess = { hasAccess: boolean; purchased: boolean; lifetime: boolean; amountVnd: number; checkoutEnabled: boolean; enforcementEnabled: boolean };
export async function loadCustomerAiAccess(): Promise<CustomerAiAccess> {
  const { data } = await api.get<CustomerAiAccess>('/customer/me/ai-access');
  // Never turn an old rollout flag or a missing endpoint into free access.
  return { ...data, hasAccess: data.hasAccess === true && data.purchased === true };
}
export async function requireCustomerAiAccess() {
  const state = await loadCustomerAiAccess();
  if (!state.hasAccess) throw { code: 'E_AI_SUBSCRIPTION', message: 'Mở Gói và quyền lợi để mua gói AI quét mặt trọn đời.' };
}
