import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookingDetailScreen from '../booking/[id]';
import BookingsTab from '../(tabs)/bookings';
import ReviewScreen from '../booking/review';
import { bookingService } from '../../services/bookingService';
import { uploadImage } from '../../services/supabase';
import { PaymentStatus, type BookingDto, type BookingStatus } from '../../types/booking';

jest.setTimeout(20000);

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockBooking: BookingDto;
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => ({ id: 'booking', muaName: 'Artist' }),
  useIsFocused: () => false,
  useFocusEffect: jest.fn(),
}));
jest.mock('../../services/bookingService', () => ({ bookingService: {
  getBookingDetail: jest.fn(), getUserBookings: jest.fn(), submitReview: jest.fn(),
} }));
jest.mock('../../services/api', () => ({ getApiError: (error: Error) => ({ message: error.message }) }));
jest.mock('../../services/supabase', () => ({ uploadImage: jest.fn() }));
jest.mock('../../services/bookingPaymentFlow', () => ({ openDepositCheckout: jest.fn() }));
jest.mock('../../hooks/useMuaEligibility', () => ({ MUA_ELIGIBILITY_QUERY_KEY: ['mua-eligibility'] }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (select: any) => select({ user: { id: 'customer' } }) }));
jest.mock('../../store/useBookingStore', () => ({ useBookingStore: () => jest.fn() }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
jest.mock('../../components/booking/BookingChatButton', () => ({ BookingChatButton: () => null }));
jest.mock('../../components/booking/BookingConfirmationNotice', () => ({ BookingConfirmationNotice: () => null }));
jest.mock('../../components/booking/ReviewCounterpartActions', () => ({ ReviewCounterpartActions: () => null }));
jest.mock('../../components/booking/SamplePaymentConfirmation', () => ({ SamplePaymentConfirmation: () => null }));
jest.mock('../../components/booking/ComplaintEntry', () => ({ ComplaintEntry: () => null }));
jest.mock('../../components/booking/BookingLocationCard', () => ({ BookingLocationCard: () => null }));
jest.mock('../../components/booking/InternalBookingCalendar', () => ({ InternalBookingCalendar: () => null }));
jest.mock('../../components/BookingTimeline', () => ({ BookingTimeline: () => null }));

let client: QueryClient;
const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  mockBooking = {
    id: 'booking', status: 'COMPLETED', isReviewed: false,
    mua: { id: 'mua', name: 'Artist', avatarUrl: '', rating: 0, reviewCount: 0, location: '', yearsOfExp: 0 },
    customer: { id: 'customer', name: 'Customer', phone: '' },
    services: [], date: '2026-11-16', time: '10:00', address: '', locationType: 'AT_STUDIO',
    paymentStatus: PaymentStatus.RELEASED, paymentMethod: 'payOS', serviceTotal: 400000, travelFee: 0,
    totalAmount: 400000, depositRate: .3, depositAmount: 120000, platformFeeAmount: 32000,
    muaPayoutAmount: 88000, remainingAmount: 280000, createdAt: '', updatedAt: '',
  };
  jest.mocked(bookingService.getBookingDetail).mockImplementation(async () => mockBooking);
  jest.mocked(bookingService.getUserBookings).mockImplementation(async () => [mockBooking]);
  jest.mocked(bookingService.submitReview).mockImplementation(async () => {
    mockBooking = { ...mockBooking, isReviewed: true };
  });
});

afterEach(() => client.clear());

describe.each([
  ['booking details', BookingDetailScreen],
  ['booking list', BookingsTab],
] as const)('%s', (_name, Screen) => {
  it.each<BookingStatus>(['COMPLETED', 'AUTO_COMPLETED'])('opens the review form for an unreviewed %s booking', async status => {
    mockBooking.status = status;
    await render(<Screen />, { wrapper });
    await fireEvent.press(await screen.findByRole('button', { name: 'Đánh giá' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/booking/review', params: { id: 'booking', muaName: 'Artist' } });
  });

  it('disables reviewing an already reviewed booking', async () => {
    mockBooking.isReviewed = true;
    await render(<Screen />, { wrapper });
    const button = await screen.findByRole('button', { name: 'Đã đánh giá' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it.each<BookingStatus>(['WAITING_CUSTOMER', 'CANCELLED', 'DISPUTED'])('does not offer reviewing a %s booking', async status => {
    mockBooking.status = status;
    await render(<Screen />, { wrapper });
    await screen.findByText('Artist');
    expect(screen.queryByRole('button', { name: 'Đánh giá' })).toBeNull();
  });
});

it('submits without a photo, returns to booking details and refreshes the reviewed state in both screens', async () => {
  client.setQueryData(['reviews', 'mua'], []);
  client.setQueryData(['mua', 'mua'], { rating: 0 });
  const view = await render(<BookingDetailScreen />, { wrapper });
  await fireEvent.press(await screen.findByRole('button', { name: 'Đánh giá' }));
  await view.rerender(<BookingsTab />);
  await screen.findByRole('button', { name: 'Đánh giá' });
  await view.rerender(<ReviewScreen />);
  expect(screen.getByText('Artist')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: '5 sao' }));
  await fireEvent.press(screen.getByText('Gửi đánh giá'));
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  expect(bookingService.submitReview).toHaveBeenCalledTimes(1);
  expect(bookingService.submitReview).toHaveBeenCalledWith({ bookingId: 'booking', rating: 5, comment: '', imageUrl: undefined });
  expect(uploadImage).not.toHaveBeenCalled();
  expect(client.getQueryState(['reviews', 'mua'])?.isInvalidated).toBe(true);
  expect(client.getQueryState(['mua', 'mua'])?.isInvalidated).toBe(true);
  await view.rerender(<BookingDetailScreen />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Đã đánh giá' })).toBeDisabled());
  await view.rerender(<BookingsTab />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Đã đánh giá' })).toBeDisabled());
});
