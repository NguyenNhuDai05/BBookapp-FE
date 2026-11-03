import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { appCommerce } from '../appCommerce';

let mockOwner: { id: string; isDemoAccount?: boolean } | null = { id: 'owner' };
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: mockOwner }) } }));
jest.mock('../api', () => ({ api: { get: jest.fn(), post: jest.fn() }, getApiError: (error: unknown) => error }));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'persistent-request-key') }));
const storageKey = 'bbook-commerce:owner:product';
beforeEach(async () => { jest.clearAllMocks(); await AsyncStorage.clear(); mockOwner = { id: 'owner' }; });

it('retains the same account-scoped request key after a lost response instead of creating a new purchase intent', async () => {
  jest.mocked(api.post).mockRejectedValueOnce(new Error('network interrupted')).mockResolvedValueOnce({ data: { id: 'order' } });
  await expect(appCommerce.buy('owner', 'product', 'terms', false)).rejects.toThrow('network interrupted');
  await expect(appCommerce.buy('owner', 'product', 'terms', false)).resolves.toBe('order');
  const calls = jest.mocked(api.post).mock.calls;
  expect(calls[0][2]?.headers).toEqual(calls[1][2]?.headers);
  expect(calls[0][1]).toEqual({ productId: 'product', termsVersion: 'terms', acceptedTerms: true, portfolioConsent: false });
  expect(JSON.parse((await AsyncStorage.getItem(storageKey))!)).toEqual({ key: 'persistent-request-key', orderId: 'order' });
});
it('never renders a response from the previous account after logout or account switch', async () => {
  jest.mocked(api.get).mockImplementationOnce(async () => {
    mockOwner = { id: 'other' }; return { data: { id: 'private-order', state: 'PaymentPending' } };
  });
  await expect(appCommerce.order('owner', 'private-order')).rejects.toThrow('Phiên tài khoản đã thay đổi');
});
it('keeps the existing read-only plans flow available with an older backend', async () => {
  jest.mocked(api.get).mockRejectedValue({ status: 404 });
  expect(await appCommerce.catalog('owner')).toMatchObject({ enabled: false, checkoutEnabled: false, products: [] });
});
it('does not clear the current request key when reading a different historical cancelled order', async () => {
  await AsyncStorage.setItem(storageKey, JSON.stringify({ key: 'new-request', orderId: 'new-order' }));
  jest.mocked(api.get).mockResolvedValue({ data: { id: 'old-order', productId: 'product', state: 'Cancelled' } });
  await appCommerce.order('owner', 'old-order');
  expect(JSON.parse((await AsyncStorage.getItem(storageKey))!).key).toBe('new-request');
});
