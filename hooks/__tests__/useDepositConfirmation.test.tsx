import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDepositConfirmation } from '../useDepositConfirmation';
import { bookingService } from '../../services/bookingService';
import { PaymentStatus, type BookingDto } from '../../types/booking';
import { depositConfirmationState } from '../../utils/depositConfirmation';

let mockReview = false;
jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ user: { isDemoAccount: mockReview } }) }));
jest.mock('../../services/bookingService', () => ({ bookingService: { getBookingDetail: jest.fn(), reconcileDeposit: jest.fn() } }));
const pending = { id: 'booking', status: 'PENDING_PAYMENT', paymentStatus: PaymentStatus.UNPAID } as BookingDto;
const paid = { ...pending, status: 'PENDING_CONFIRMATION', paymentStatus: PaymentStatus.DEPOSIT_HELD } as BookingDto;
let onState: (state: AppStateStatus) => void;
const remove = jest.fn();
function setup(id = 'booking') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper, render: () => renderHook(() => useDepositConfirmation(id), { wrapper }) };
}
beforeEach(() => {
  mockReview = false; jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { onState = listener; return { remove }; });
  jest.mocked(bookingService.getBookingDetail).mockResolvedValue(pending);
  jest.mocked(bookingService.reconcileDeposit).mockResolvedValue(pending);
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

it('recovers a missed webhook through server reconciliation and refreshes the booking cache', async () => {
  jest.mocked(bookingService.reconcileDeposit).mockResolvedValue(paid);
  const test = setup(); const hook = await test.render();
  await waitFor(() => expect(hook.result.current.data?.paymentStatus).toBe(PaymentStatus.DEPOSIT_HELD));
  expect(test.client.getQueryData(['bookingDetail', 'booking'])).toEqual(paid);
  expect(bookingService.reconcileDeposit).toHaveBeenCalledWith('booking');
  await hook.unmount(); test.client.clear(); expect(remove).toHaveBeenCalled();
});

it('rechecks after returning from the wallet/browser and does not treat opening the browser as payment', async () => {
  const test = setup(); const hook = await test.render();
  await waitFor(() => expect(hook.result.current.data).toEqual(pending));
  const calls = jest.mocked(bookingService.reconcileDeposit).mock.calls.length;
  await act(async () => onState('background'));
  jest.mocked(bookingService.reconcileDeposit).mockResolvedValue(paid);
  await act(async () => onState('active'));
  await waitFor(() => expect(hook.result.current.data).toEqual(paid));
  expect(jest.mocked(bookingService.reconcileDeposit).mock.calls.length).toBeGreaterThan(calls);
  await hook.unmount(); test.client.clear();
});

it('exposes lookup errors for retry and never manufactures a paid booking', async () => {
  jest.mocked(bookingService.reconcileDeposit).mockRejectedValue(new Error('unavailable'));
  const test = setup(); const hook = await test.render();
  await waitFor(() => expect(hook.result.current.isError).toBe(true));
  expect(hook.result.current.data).toBeUndefined();
  jest.mocked(bookingService.reconcileDeposit).mockResolvedValue(paid);
  await act(async () => { hook.result.current.retry(); });
  await waitFor(() => expect(hook.result.current.data).toEqual(paid));
  await hook.unmount(); test.client.clear();
});

it('does not reconcile a missing booking ID or a review account with the real provider', async () => {
  const missing = setup(''); const first = await missing.render();
  expect(bookingService.getBookingDetail).not.toHaveBeenCalled();
  await first.unmount(); missing.client.clear();
  mockReview = true;
  const sample = setup(); const second = await sample.render();
  await waitFor(() => expect(second.result.current.data).toEqual(pending));
  expect(bookingService.reconcileDeposit).not.toHaveBeenCalled();
  await second.unmount(); sample.client.clear();
});

it('stops the pending wait after 90 seconds and allows an explicit retry', async () => {
  jest.useFakeTimers();
  const test = setup(); const hook = await test.render();
  await act(async () => { await jest.advanceTimersByTimeAsync(100); });
  expect(hook.result.current.data).toEqual(pending);
  await act(async () => { await jest.advanceTimersByTimeAsync(90_000); });
  expect(hook.result.current.timedOut).toBe(true);
  const calls = jest.mocked(bookingService.reconcileDeposit).mock.calls.length;
  await act(async () => { await jest.advanceTimersByTimeAsync(30_000); });
  expect(bookingService.reconcileDeposit).toHaveBeenCalledTimes(calls);
  await act(async () => { hook.result.current.retry(); await jest.advanceTimersByTimeAsync(100); });
  expect(hook.result.current.timedOut).toBe(false);
  expect(jest.mocked(bookingService.reconcileDeposit).mock.calls.length).toBeGreaterThan(calls);
  await hook.unmount(); test.client.clear();
});

it.each([PaymentStatus.PAID_LEGACY, PaymentStatus.DEPOSIT_HELD, PaymentStatus.RELEASED, PaymentStatus.FROZEN])('recognizes confirmed money status %s', status => {
  expect(depositConfirmationState({ ...pending, paymentStatus: status })).toBe('success');
});
it.each([PaymentStatus.REFUND_PENDING, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.FORFEITED])('does not spin forever on refund/policy status %s', status => {
  expect(depositConfirmationState({ ...pending, paymentStatus: status })).toBe('refund');
});
