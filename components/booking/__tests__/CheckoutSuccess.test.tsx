import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CheckoutSuccessScreen from '../../../app/checkout/success';
import { PaymentStatus } from '../../../types/booking';

let mockParams: { bookingId?: string } = { bookingId: 'booking' };
const mockRetry = jest.fn();
let mockConfirmation: Record<string, unknown>;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('../../../hooks/useDepositConfirmation', () => ({ useDepositConfirmation: () => mockConfirmation }));
jest.mock('../../../store/useAuthStore', () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ user: { isDemoAccount: false } }) }));
jest.mock('../../../store/useBookingStore', () => ({ useBookingStore: () => ({ draft: { date: 'wrong', time: 'wrong' }, resetDraft: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('lucide-react-native', () => ({ CheckCircle: () => null, ShieldCheck: () => null, Clock: () => null, Home: () => null, FileText: () => null }));
jest.mock('expo-web-browser', () => ({ dismissBrowser: jest.fn() }));
const booking = { id: 'booking', status: 'PENDING_PAYMENT', paymentStatus: PaymentStatus.UNPAID,
  mua: { name: 'Artist' }, date: '2026-10-26', time: '10:00', services: [], address: 'Address',
  totalAmount: 50000, depositAmount: 15000, remainingAmount: 35000, travelFee: 0, depositRate: .3 };
beforeEach(() => {
  mockParams = { bookingId: 'booking' }; jest.clearAllMocks();
  mockConfirmation = { data: booking, isLoading: false, isError: false, isFetching: false, timedOut: false, retry: mockRetry };
});

it('does not display payment success for an unconfirmed deposit and offers a check button', async () => {
  const screen = await render(<CheckoutSuccessScreen />);
  expect(screen.getByText('Đang xác nhận tiền cọc')).toBeTruthy();
  expect(screen.queryByText('Thanh toán thành công!')).toBeNull();
  await fireEvent.press(screen.getByText('Kiểm tra lại thanh toán'));
  expect(mockRetry).toHaveBeenCalledTimes(1);
}, 15_000); // React Native host components are loaded lazily on a cold Jest worker.
it('shows a finite wait message and a retry after timeout', async () => {
  mockConfirmation.timedOut = true;
  const screen = await render(<CheckoutSuccessScreen />);
  expect(screen.getByText('Chưa xác nhận được tiền cọc')).toBeTruthy();
  expect(screen.queryByText('Đang xác nhận tiền cọc')).toBeNull();
});
it('shows a connection error when lookup fails and handles a missing booking ID', async () => {
  mockConfirmation = { ...mockConfirmation, data: undefined, isError: true };
  const screen = await render(<CheckoutSuccessScreen />);
  expect(screen.getByText('Chưa kết nối được để xác nhận')).toBeTruthy();
  mockParams = {};
  await screen.rerender(<CheckoutSuccessScreen />);
  expect(screen.getByText('Thiếu mã lịch đặt')).toBeTruthy();
});
it('renders the receipt from verified server data, including the persisted appointment time', async () => {
  mockConfirmation.data = { ...booking, paymentStatus: PaymentStatus.DEPOSIT_HELD, status: 'PENDING_CONFIRMATION' };
  const screen = await render(<CheckoutSuccessScreen />);
  expect(screen.getByText('Thanh toán thành công!')).toBeTruthy();
  expect(screen.getByText('10:00 - 2026-10-26')).toBeTruthy();
  expect(screen.getByText(/MUA cần xác nhận trước 10:00 ngày 26\/10\/2026/)).toBeTruthy();
  expect(screen.queryByText('Chuyên gia có 24h để xác nhận lịch này')).toBeNull();
});
it('shows refund handling instead of a permanent waiting state', async () => {
  mockConfirmation.data = { ...booking, paymentStatus: PaymentStatus.REFUND_PENDING, status: 'CANCELLED' };
  const screen = await render(<CheckoutSuccessScreen />);
  expect(screen.getByText('Khoản cọc cần xem trạng thái xử lý')).toBeTruthy();
  expect(screen.queryByText('Đang xác nhận tiền cọc')).toBeNull();
});
