import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Checkout from '../checkout';
import { useBookingStore } from '../../store/useBookingStore';
const mockCreate = jest.fn(); const mockPay = jest.fn(); const mockPush = jest.fn();
let mockArtist = { id: 'mua', name: 'Artist', allowCustomerVisit: true, workLocationAddress: 'Server studio address', workLocationName: 'Studio' };
jest.mock('react-native-safe-area-context', () => ({ ...jest.requireActual('react-native-safe-area-context'), useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }) }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-key' }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector: any) => selector({ activeMode: 'CUSTOMER', user: { id: 'customer' }, switchMode: jest.fn() }) }));
jest.mock('../../hooks/useBooking', () => ({ useCreateBooking: () => ({ mutateAsync: mockCreate, isPending: false }), usePayBookingDeposit: () => ({ mutateAsync: mockPay, isPending: false }) }));
jest.mock('../../hooks/useMuaDetail', () => ({ useMuaDetail: () => ({ muaInfo: mockArtist, loading: false }) }));
jest.mock('../../services/api', () => ({ getApiError: (error: any) => ({ message: error.message }) }));
jest.mock('../../services/bookingPaymentFlow', () => ({ openDepositCheckout: jest.fn().mockResolvedValue('external') }));
jest.mock('../../components/booking/DatePickerSheet', () => ({ DatePickerSheet: () => null }));
jest.mock('../../components/booking/TimePickerSheet', () => ({ TimePickerSheet: () => null }));
jest.mock('../../components/booking/AddressPickerSheet', () => ({ AddressPickerSheet: () => null }));
jest.mock('../../components/common/ConfirmDialog', () => ({ ConfirmDialog: () => null }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks(); mockArtist = { id: 'mua', name: 'Artist', allowCustomerVisit: true, workLocationAddress: 'Server studio address', workLocationName: 'Studio' };
  const store = useBookingStore.getState(); store.resetDraft(); store.setMua({ id: 'mua', name: 'Artist', avatarUrl: '', rating: 0, reviewCount: 0, location: '', yearsOfExp: 0 }); store.addService({ id: 'service', name: 'Service', price: 100000, durationMinutes: 60, participantsCount: 1 }); store.setDate('2099-01-01'); store.setTime('10:00'); store.setAddress('Customer address', { latitude: 20, longitude: 100 });
  mockCreate.mockResolvedValue({ id: 'booking' }); mockPay.mockResolvedValue({ provider: 'PAYOS' });
});
it('sends only MUA ID and mode for studio destination, not cached studio address or customer GPS', async () => {
  await render(<Checkout />); await fireEvent.press(screen.getByText('○ Đến nơi làm việc của MUA'));
  expect(screen.getByText('Server studio address')).toBeTruthy();
  await fireEvent.press(screen.getByText('Xác nhận và thanh toán'));
  await waitFor(() => expect(mockCreate).toHaveBeenCalled());
  expect(mockCreate.mock.calls[0][0]).toMatchObject({ muaId: 'mua', serviceLocationType: 'MUA_WORK_LOCATION', address: '' });
  expect(mockCreate.mock.calls[0][0].serviceLatitude).toBeUndefined(); expect(mockCreate.mock.calls[0][0].serviceLocationName).toBeUndefined();
});
it('customer destination keeps manually entered address and optional GPS', async () => {
  await render(<Checkout />); await fireEvent.press(screen.getByText('Xác nhận và thanh toán'));
  await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ serviceLocationType: 'CUSTOMER_ADDRESS', address: 'Customer address', serviceLatitude: 20, serviceLongitude: 100 })));
});
it('hides studio option when consent is off, and blocks a stale studio draft', async () => {
  useBookingStore.getState().setWorkLocation('mua', 'Stale studio'); mockArtist.allowCustomerVisit = false;
  await render(<Checkout />); expect(screen.queryByText(/Đến nơi làm việc của MUA/)).toBeNull();
  await fireEvent.press(screen.getByText('Xác nhận và thanh toán')); expect(mockCreate).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('○ MUA đến địa điểm của bạn')); expect(screen.getByText('Customer address')).toBeTruthy();
});
