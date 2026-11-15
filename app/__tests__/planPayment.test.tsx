import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlanPayment from '../plan-payment';

const id = '00000000-0000-4000-8000-000000000001';
let mockOrder: any;
const mockOpen = jest.fn();
const mockRead = jest.fn(async (..._args: any[]) => mockOrder);
const mockState = { user: { id: 'owner', isDemoAccount: false } };
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: Object.assign((select: any) => select(mockState), { getState: () => mockState }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }), useLocalSearchParams: () => ({ id: '00000000-0000-4000-8000-000000000001', open: '1' }) }));
jest.mock('../../services/appCommerce', () => ({
  appCommerce: { order: (...args: any[]) => mockRead(...args), openCheckout: (...args: any[]) => mockOpen(...args) },
  commerceMessage: () => 'Không thể kiểm tra thanh toán',
  terminalOrder: (state: string) => ['Fulfilled', 'Cancelled', 'Refunded', 'Revoked'].includes(state),
}));
beforeEach(() => {
  jest.clearAllMocks(); mockOpen.mockResolvedValue(undefined);
  mockOrder = { id, productId: 'bbook_customer_ai_lifetime_v1', amountVnd: 20000, state: 'PaymentPending', expiresAt: new Date(Date.now() + 600000).toISOString(), checkoutUrl: 'https://pay.payos.vn/web/test' };
});
async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  const view = await render(<QueryClientProvider client={client}><PlanPayment /></QueryClientProvider>);
  return { client, view };
}
it('opens payOS once and waits for server verification after the browser closes', async () => {
  const { client, view } = await setup();
  await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(mockRead).toHaveBeenCalledWith('owner', id, true));
  expect(screen.getByText('Chờ thanh toán')).toBeTruthy();
  expect(screen.queryByText(/Quyền lợi đã được mở/)).toBeNull();
  mockOrder = { ...mockOrder, state: 'Fulfilled', checkoutUrl: null };
  await fireEvent.press(screen.getByText('Kiểm tra thanh toán'));
  await waitFor(() => expect(screen.getByText('Đã hoàn tất')).toBeTruthy());
  expect(mockOpen).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Thanh toán qua payOS')).toBeNull();
  await view.unmount(); client.clear();
});
it.each(['Cancelled', 'ManualReview', 'Fulfilled'])('does not open payment for %s orders', async state => {
  mockOrder.state = state;
  const { client, view } = await setup();
  await waitFor(() => expect(mockRead).toHaveBeenCalled());
  expect(mockOpen).not.toHaveBeenCalled();
  expect(screen.queryByText('Thanh toán qua payOS')).toBeNull();
  await view.unmount(); client.clear();
});
it('does not open an expired pending link', async () => {
  mockOrder.expiresAt = new Date(Date.now() - 60000).toISOString();
  const { client, view } = await setup();
  await waitFor(() => expect(screen.getByText('Chờ thanh toán')).toBeTruthy());
  expect(mockOpen).not.toHaveBeenCalled();
  await view.unmount(); client.clear();
});
