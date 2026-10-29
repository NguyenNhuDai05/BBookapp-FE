import { api, getApiError } from './api';
export type CustomerAiAccess = { hasAccess: boolean; purchased: boolean; lifetime: boolean; amountVnd: number; checkoutEnabled: boolean; enforcementEnabled: boolean };
export async function loadCustomerAiAccess(): Promise<CustomerAiAccess> {
  // Existing builds retain fully local scans until the paid feature is explicitly released.
  if (process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED !== 'true') return { hasAccess: true, purchased: false, lifetime: true, amountVnd: 20000, checkoutEnabled: false, enforcementEnabled: false };
  try { return (await api.get<CustomerAiAccess>('/customer/me/ai-access')).data; }
  catch (error) {
    // Backends before the additive rollout have no access endpoint; retain their free scan flow.
    if (getApiError(error).status === 404) return { hasAccess: true, purchased: false, lifetime: true, amountVnd: 20000, checkoutEnabled: false, enforcementEnabled: false };
    throw error;
  }
}
export async function requireCustomerAiAccess() {
  const state = await loadCustomerAiAccess();
  if (!state.hasAccess) throw { code: 'E_AI_SUBSCRIPTION', message: 'Cần đăng ký AI quét mặt 20.000đ một lần để dùng vĩnh viễn.' };
}
