import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { api, getApiError } from './api';
import { useAuthStore } from '../store/useAuthStore';

export type CommerceCatalog = {
  role: 'Customer' | 'MUA'; termsVersion: string; enabled: boolean; checkoutEnabled: boolean; unavailableReason?: string | null;
  products: { id: string; name: string; amountVnd: number; days: number | null; description?: string; termsVersion?: string; version?: number }[];
};
export type CommerceOrder = {
  id: string; productId: string; amountVnd: number; currency: string; state: string;
  createdAt: string; expiresAt: string; verifiedPaidAt?: string | null;
  payment: { qrCode: string; bankBin: string; accountNumber: string; accountName: string; description: string } | null;
};
export const terminalOrder = (state: string) => ['Fulfilled', 'Cancelled', 'Refunded', 'Revoked'].includes(state);
const scope = (owner: string) => {
  const user = useAuthStore.getState().user;
  if (!user || user.id !== owner || user.isDemoAccount) throw new Error('Phiên tài khoản đã thay đổi. Vui lòng mở lại Gói và quyền lợi.');
};
export const commerceMessage = (error: unknown) => {
  const failure = getApiError(error);
  const messages: Record<string, string> = {
    CUSTOMER_AI_CHECKOUT_DISABLED: 'Đăng ký AI hiện chưa mở. Vui lòng thử lại sau.',
    WEB_CHECKOUT_DISABLED: 'Đăng ký quảng bá hiện chưa mở. Vui lòng thử lại sau.',
    AI_ALREADY_PURCHASED: 'Tài khoản đã có giao dịch AI. Hãy đồng bộ quyền lợi; không cần thanh toán lại.',
    MUA_NOT_ELIGIBLE: 'Hồ sơ MUA cần được duyệt và hoàn thiện trước khi đăng ký quảng bá.',
    TERMS_VERSION_MISMATCH: 'Điều khoản đã cập nhật. Vui lòng tải lại danh sách gói.',
    PENDING_ORDER_NEEDS_REVIEW: 'Đơn trước cần được kiểm tra. Không chuyển khoản thêm; hãy giữ mã đơn để được hỗ trợ.',
    PAYMENT_PROVIDER_UNAVAILABLE: 'Chưa kết nối được payOS. Đơn có thể đã được lưu; hãy thử lại để tiếp tục cùng đơn.',
  };
  if (failure.status === 404) return 'Chưa tìm thấy đơn của tài khoản này hoặc máy chủ chưa hỗ trợ mua gói trong app.';
  if (failure.status === 429) return 'Bạn vừa kiểm tra nhiều lần. Vui lòng đợi một phút rồi thử lại.';
  return messages[failure.code || ''] || failure.message || 'Chưa xử lý được yêu cầu. Vui lòng thử lại.';
};

export const appCommerce = {
  async catalog(owner: string): Promise<CommerceCatalog> {
    scope(owner);
    try {
      const { data } = await api.get<CommerceCatalog>('/me/commerce/catalog'); scope(owner); return data;
    } catch (error) {
      scope(owner);
      if (getApiError(error).status === 404) return { role: 'Customer', termsVersion: '', enabled: false, checkoutEnabled: false, products: [] };
      throw error;
    }
  },
  async buy(owner: string, productId: string, termsVersion: string, portfolioConsent: boolean): Promise<string> {
    scope(owner);
    const storageKey = `bbook-commerce:${owner}:${productId}`;
    const saved = await AsyncStorage.getItem(storageKey);
    let pending: { key: string; orderId?: string } = saved ? JSON.parse(saved) : { key: Crypto.randomUUID() };
    if (pending.orderId) {
      const prior = await appCommerce.order(owner, pending.orderId);
      if (terminalOrder(prior.state)) pending = { key: Crypto.randomUUID() };
    }
    await AsyncStorage.setItem(storageKey, JSON.stringify(pending)); scope(owner);
    const { data } = await api.post<{ id: string }>('/me/commerce/orders',
      { productId, termsVersion, acceptedTerms: true, portfolioConsent }, { headers: { 'Idempotency-Key': pending.key } });
    scope(owner);
    await AsyncStorage.setItem(storageKey, JSON.stringify({ ...pending, orderId: data.id }));
    return data.id;
  },
  async order(owner: string, id: string, sync = false): Promise<CommerceOrder> {
    scope(owner);
    const path = `/me/commerce/orders/${encodeURIComponent(id)}`;
    const { data } = sync ? await api.post<CommerceOrder>(`${path}/sync`) : await api.get<CommerceOrder>(path);
    scope(owner);
    if (terminalOrder(data.state)) {
      const key = `bbook-commerce:${owner}:${data.productId}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved && JSON.parse(saved).orderId === data.id) await AsyncStorage.removeItem(key);
    }
    return data;
  },
};
