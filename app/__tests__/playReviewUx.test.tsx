import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Identity from '../(mua)/identity-verification';
import Banks from '../(mua)/bank-accounts';
import Withdraw from '../(mua)/withdraw';
import Earnings from '../(mua)/earnings';
import ChangePassword from '../change-password';
import { SamplePaymentConfirmation } from '../../components/booking/SamplePaymentConfirmation';
import { ReviewCounterpartActions } from '../../components/booking/ReviewCounterpartActions';
import type { BookingPaymentDto } from '../../types/booking';
import { REVIEW_FINANCIAL_NOTICE } from '../../utils/playReview';

let mockUser: any = { id: 'review', isDemoAccount: true, role: 'MUA', hasMuaProfile: true };
let mockActions: string[] = ['paymentSucceed'];
let mockCapability = true;
let mockMutationError: Error | undefined;
const mockPush = jest.fn(); const mockReplace = jest.fn(); const mockPayout = jest.fn(); const mockAction = jest.fn();
const mockBank = { id: 'sample-bank', bankCode: 'VCB', bankName: 'Vietcombank', maskedAccountNumber: '****0001', accountHolderName: 'BBOOK REVIEW ONLY', isActive: true, isUsable: false, verificationStatus: 'PENDING_ADMIN' };
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (select: any) => select({ user: mockUser }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }), useFocusEffect: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'key' }));
jest.mock('../../services/api', () => ({ getApiError: (e: any) => ({ message: e?.message || 'Thao tác hiện không khả dụng.' }) }));
jest.mock('../../services/verificationMediaService', () => ({ uploadVerificationImage: jest.fn() }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
jest.mock('../../components/PrivateMediaImage', () => ({ PrivateMediaImage: (props: any) => { const { Text } = jest.requireActual('react-native'); return <Text>{props.uri}</Text>; } }));
jest.mock('../../components/bank/BankDefaultPasswordModal', () => ({ BankDefaultPasswordModal: () => null }));
jest.mock('../../components/common/ConfirmDialog', () => ({ ConfirmDialog: () => null }));
jest.mock('../../components/common/FeedbackDialog', () => ({ FeedbackDialog: () => null }));
jest.mock('../../components/ui/AppModal', () => ({ AppModal: ({ visible, title, description, children, primaryAction }: any) => { const { Text, View, TouchableOpacity } = jest.requireActual('react-native'); return visible ? <View><Text>{title}</Text><Text>{description}</Text>{children}{primaryAction ? <TouchableOpacity disabled={primaryAction.disabled || primaryAction.loading} onPress={primaryAction.onPress}><Text>{primaryAction.label}</Text></TouchableOpacity> : null}</View> : null; } }));
jest.mock('../../hooks/useBooking', () => ({
  useBookingDetail: () => ({ data: { id: 'booking', customer: { id: 'review' }, availableDemoActions: mockActions } }),
  useDemoBookingAction: () => ({ mutateAsync: mockAction, isError: !!mockMutationError, error: mockMutationError }),
}));
jest.mock('../../hooks/useMuaEligibility', () => ({
  useMuaIdentity: () => ({ data: { identityFrontUrl: 'signed-front', identityBackUrl: 'signed-back', portraitUrl: 'signed-portrait' } }),
  useSaveMuaIdentity: () => ({ mutateAsync: jest.fn() }),
  useMuaEligibility: () => ({ data: { canWithdraw: false }, refetch: jest.fn() }),
}));
jest.mock('../../hooks/useBankAccounts', () => ({ useBankAccounts: () => ({ data: [mockBank], refetch: jest.fn() }), useDeleteBankAccount: () => ({ mutateAsync: jest.fn() }), useSetDefaultBankAccount: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('../../hooks/useMuaBookings', () => ({ useEarningsSnapshot: () => ({ data: { availableTotal: 110000, onHoldTotal: 0, frozenTotal: 0, payoutPendingTotal: 0, paidOutTotal: 0, canRequestSimulatedPayout: mockCapability, permittedSimulationBankAccountId: 'sample-bank', receivables: [{ id: 'receipt', status: 1 }] }, refetch: jest.fn() }) }));
jest.mock('../../hooks/useMuaPayouts', () => ({ useCreateMuaPayout: () => ({ mutateAsync: mockPayout }), useMuaPayouts: () => ({ data: [], refetch: jest.fn() }) }));
beforeEach(() => { jest.clearAllMocks(); mockUser = { id: 'review', isDemoAccount: true, role: 'MUA', hasMuaProfile: true }; mockActions = ['paymentSucceed']; mockCapability = true; mockMutationError = undefined; mockPayout.mockResolvedValue({ id: 'paid-payout', provider: 'SIMULATED', status: 'PAID' }); mockAction.mockResolvedValue({ id: 'booking' }); });

it('shows all signed sample identity images without upload/replace/submit or verification claim', async () => {
  await render(<Identity/>);
  for (const uri of ['signed-front', 'signed-back', 'signed-portrait']) expect(screen.getByText(uri)).toBeTruthy();
  expect(screen.queryByText('Thay ảnh')).toBeNull(); expect(screen.queryByText('Lưu xác minh')).toBeNull(); expect(screen.queryByText('Đã xác minh')).toBeNull();
  expect(screen.getByText(/Hồ sơ vẫn là bản nháp/)).toBeTruthy();
});
it('keeps the sample bank pending with mutations disabled', async () => {
  await render(<Banks/>);
  expect(screen.getByText(/Tài khoản mẫu ·/)).toBeTruthy();
  expect(screen.queryByText('Đặt làm mặc định')).toBeNull();
  expect(screen.getByText('BBOOK REVIEW ONLY')).toBeTruthy();
  expect(mockBank.isUsable).toBe(false);
});
it('requests sample payout despite production canWithdraw false and uses only the permitted bank', async () => {
  await render(<Withdraw/>);
  expect(screen.getByText('Rút tiền mẫu')).toBeTruthy();
  await fireEvent.press(screen.getByText('Xác nhận rút 110.000đ'));
  await fireEvent.press(screen.getByText('Gửi yêu cầu'));
  await waitFor(() => expect(mockPayout).toHaveBeenCalledWith({ bankAccountId: 'sample-bank', receivableIds: ['receipt'], idempotencyKey: 'key' }));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(mua)/payouts/[id]', params: { id: 'paid-payout' } });
});
it.each([false, true])('does not submit without server payout capability or review marker (normal=%s)', async normal => {
  if (normal) mockUser.isDemoAccount = false; else mockCapability = false;
  await render(<Withdraw/>);
  await fireEvent.press(screen.getByText('Xác nhận rút 110.000đ'));
  expect(mockPayout).not.toHaveBeenCalled(); expect(screen.queryByText('Gửi yêu cầu')).toBeNull();
});
it('shows the earnings sample withdraw entry only with capability', async () => {
  await render(<Earnings/>); await fireEvent.press(screen.getByText('Rút tiền mẫu'));
  expect(mockPush).toHaveBeenCalledWith('/(mua)/withdraw');
});
it('protects review password but keeps normal password inputs', async () => {
  const view = await render(<ChangePassword/>);
  expect(screen.getByText('Mật khẩu của tài khoản đánh giá được quản lý riêng.')).toBeTruthy();
  expect(screen.queryByText('Mật khẩu hiện tại')).toBeNull();
  mockUser.isDemoAccount = false; await view.rerender(<ChangePassword/>);
  expect(screen.getByText('Mật khẩu hiện tại')).toBeTruthy();
});
const sample = { provider: 'SIMULATED', bookingId: 'booking', amount: 150000, checkoutUrl: null } as BookingPaymentDto;
it('allows sample confirmation only with an explicit server action', async () => {
  const done = jest.fn(); await render(<SamplePaymentConfirmation payment={sample} onClose={jest.fn()} onSuccess={done}/>);
  expect(screen.getByText(REVIEW_FINANCIAL_NOTICE)).toBeTruthy();
  await fireEvent.press(screen.getByText('Xác nhận thanh toán'));
  await waitFor(() => expect(mockAction).toHaveBeenCalledWith({ bookingId: 'booking', action: 'paymentSucceed' }));
  expect(done).toHaveBeenCalledTimes(1);
});
it.each(['missing-action', 'normal-user', 'real-provider'])('hides sample confirmation for %s', async reason => {
  if (reason === 'missing-action') mockActions = []; if (reason === 'normal-user') mockUser.isDemoAccount = false;
  await render(<SamplePaymentConfirmation payment={reason === 'real-provider' ? { ...sample, provider: 'PAYOS' } : sample} onClose={jest.fn()} onSuccess={jest.fn()}/>);
  expect(screen.queryByText('Xác nhận thanh toán')).toBeNull(); expect(mockAction).not.toHaveBeenCalled();
});
it('never navigates to success when a stale sample action is rejected', async () => {
  mockAction.mockRejectedValue(new Error('Thao tác hiện không khả dụng.'));
  const done = jest.fn(); await render(<SamplePaymentConfirmation payment={sample} onClose={jest.fn()} onSuccess={done}/>);
  await fireEvent.press(screen.getByText('Xác nhận thanh toán')); await waitFor(() => expect(mockAction).toHaveBeenCalled());
  expect(done).not.toHaveBeenCalled();
});
it('renders exactly the counterpart actions granted by server and calls the correct one', async () => {
  const booking = { id: 'booking', customer: { id: 'review' }, availableDemoActions: ['counterpartReject'] } as import('../../types/booking').BookingDto;
  await render(<ReviewCounterpartActions booking={booking}/>);
  expect(screen.queryByText('MUA chấp nhận')).toBeNull();
  await fireEvent.press(screen.getByText('MUA từ chối'));
  expect(mockAction).toHaveBeenCalledWith({ bookingId: 'booking', action: 'counterpartReject' });
});
it.each(['missing-actions', 'normal-user', 'mua-participant'])('does not expose counterpart controls for %s', async reason => {
  if (reason === 'normal-user') mockUser.isDemoAccount = false;
  const booking = { id: 'booking', customer: { id: reason === 'mua-participant' ? 'sample-customer' : 'review' }, availableDemoActions: reason === 'missing-actions' ? undefined : ['counterpartAccept', 'counterpartReject'] } as import('../../types/booking').BookingDto;
  await render(<ReviewCounterpartActions booking={booking}/>);
  expect(screen.queryByText('MUA chấp nhận')).toBeNull(); expect(screen.queryByText('MUA từ chối')).toBeNull();
});
