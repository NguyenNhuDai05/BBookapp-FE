import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Withdraw from '../(mua)/withdraw';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockCreate = jest.fn();
const mockRefresh = jest.fn();
const mockFocus: { callback?: () => void } = {};
let mockBanks: any[] = [];
let mockCanWithdraw = false;
const approved = { id: 'customer-bank', bankName: 'Vietcombank', bankCode: 'VCB', maskedAccountNumber: '****1234', accountHolderName: 'TEST ARTIST', isDefault: true, isActive: true, verificationStatus: 'APPROVED', isUsable: true, canReceiveMoney: true };
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }), useFocusEffect: (callback: () => void) => { mockFocus.callback = callback; } }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'request-key' }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (select: any) => select({ user: { isDemoAccount: false } }) }));
jest.mock('../../hooks/useBankAccounts', () => ({ useBankAccounts: () => ({ data: mockBanks, refetch: mockRefresh }) }));
jest.mock('../../hooks/useMuaEligibility', () => ({ useMuaEligibility: () => ({ data: { canWithdraw: mockCanWithdraw }, refetch: mockRefresh }) }));
jest.mock('../../hooks/useMuaBookings', () => ({ useEarningsSnapshot: () => ({ data: { availableTotal: 100000, receivables: [{ id: 'receipt', status: 1 }] }, refetch: mockRefresh }) }));
jest.mock('../../hooks/useMuaPayouts', () => ({ useCreateMuaPayout: () => ({ mutateAsync: mockCreate }) }));
jest.mock('../../services/api', () => ({ getApiError: () => ({ message: 'error' }) }));
jest.mock('../../components/ui/AppModal', () => ({ AppModal: ({ visible, primaryAction }: any) => {
  const { Text, TouchableOpacity } = jest.requireActual('react-native');
  return visible ? <TouchableOpacity onPress={primaryAction.onPress}><Text>{primaryAction.label}</Text></TouchableOpacity> : null;
} }));

beforeEach(() => { jest.clearAllMocks(); mockBanks = []; mockCanWithdraw = false; mockCreate.mockResolvedValue({ id: 'payout' }); });

it('leads artists without any receiving account to create one and keeps payout disabled', async () => {
  await render(<Withdraw />);
  await fireEvent.press(screen.getByText('Thêm tài khoản ngân hàng và chờ Admin duyệt trước khi rút tiền.'));
  expect(mockPush).toHaveBeenCalledWith('/(mua)/bank-account-form');
  await fireEvent.press(screen.getByText('Xác nhận rút 100.000đ'));
  expect(screen.queryByText('Gửi yêu cầu')).toBeNull();
  expect(mockCreate).not.toHaveBeenCalled();
});

it.each(['PENDING_ADMIN', 'REJECTED'])('blocks %s accounts even if other eligibility data permits withdrawal', async status => {
  mockBanks = [{ ...approved, verificationStatus: status, isUsable: false, canReceiveMoney: false }];
  mockCanWithdraw = true;
  await render(<Withdraw />);
  expect(screen.getByText(/Tài khoản nhận tiền cần được Admin duyệt/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Xác nhận rút 100.000đ'));
  expect(mockCreate).not.toHaveBeenCalled();
  expect(screen.queryByText('Gửi yêu cầu')).toBeNull();
  await fireEvent.press(screen.getByText('Quản lý tài khoản nhận tiền'));
  expect(mockPush).toHaveBeenCalledWith('/(mua)/bank-accounts');
});

it('uses an existing approved customer account for payout without creating a new account', async () => {
  mockBanks = [approved]; mockCanWithdraw = true;
  await render(<Withdraw />);
  await fireEvent.press(screen.getByText('Xác nhận rút 100.000đ'));
  await fireEvent.press(screen.getByText('Gửi yêu cầu'));
  await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ bankAccountId: 'customer-bank', receivableIds: ['receipt'], idempotencyKey: 'request-key' }));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(mua)/payouts/[id]', params: { id: 'payout' } });
});

it('keeps backend withdrawal restrictions for approved banks', async () => {
  mockBanks = [approved];
  await render(<Withdraw />);
  await fireEvent.press(screen.getByText('Xác nhận rút 100.000đ'));
  expect(screen.queryByText('Gửi yêu cầu')).toBeNull();
  expect(mockCreate).not.toHaveBeenCalled();
});

it('refreshes shared accounts, eligibility and funds when returning from setup', async () => {
  await render(<Withdraw />);
  mockFocus.callback?.();
  expect(mockRefresh).toHaveBeenCalledTimes(3);
});

it('enables payout after a pending bank is approved and state is refreshed', async () => {
  mockBanks = [{ ...approved, verificationStatus: 'PENDING_ADMIN', isUsable: false, canReceiveMoney: false }];
  const view = await render(<Withdraw />);
  await fireEvent.press(screen.getByText('Xác nhận rút 100.000đ'));
  expect(screen.queryByText('Gửi yêu cầu')).toBeNull();
  mockBanks = [approved]; mockCanWithdraw = true;
  await view.rerender(<Withdraw />);
  await fireEvent.press(screen.getByText('Xác nhận rút 100.000đ'));
  expect(screen.getByText('Gửi yêu cầu')).toBeTruthy();
});
