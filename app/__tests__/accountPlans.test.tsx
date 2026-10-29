import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AccountPlansScreen from '../account-plans';
const mockSync = jest.fn(); const mockBack = jest.fn();
let mockResult: any;
jest.mock('../../hooks/useAccountPlans', () => ({ useAccountPlans: () => mockResult }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
beforeEach(() => { jest.clearAllMocks(); mockResult = { enabled: true, isPending: false, isFetching: false, isError: false, sync: { isPending: false, mutate: mockSync }, data: { role: 'Customer', ai: { purchased: true, hasAccess: true }, orders: [], evaluatedAt: '2026-10-29T09:00:00Z' } }; });
it('shows confirmed lifetime access with sync only and no purchase action', async () => {
  await render(<AccountPlansScreen />);
  expect(screen.getByText('Đã mở khóa vĩnh viễn')).toBeTruthy();
  expect(screen.queryByText(/Thanh toán|payOS|Google Play Billing|Mua ngay/)).toBeNull();
  await fireEvent.press(screen.getByText('Đồng bộ quyền lợi')); expect(mockSync).toHaveBeenCalledTimes(1);
});
it('shows expired promotion without blocking normal bookings and keeps the receipt reference', async () => {
  mockResult.data = { ...mockResult.data, role: 'MUA', mua: { visibilityStatus: 'Expired' }, orders: [{ id: 'reference-1', productId: 'bbook_visibility_30d_v1', amountVnd: 75000, state: 'ManualReview', createdAt: '2026-10-29T09:00:00Z' }] };
  await render(<AccountPlansScreen />);
  expect(screen.getByText('Đã hết thời hạn quảng bá')).toBeTruthy();
  expect(screen.getByText('Đang được hỗ trợ kiểm tra')).toBeTruthy();
  expect(screen.getByText('Mã đơn: reference-1')).toBeTruthy();
  expect(screen.getByText(/Hết quảng bá vẫn nhận booking/)).toBeTruthy();
});
it('keeps last known access visible when a sync request fails and permits retry', async () => {
  mockResult.sync.isError = true;
  await render(<AccountPlansScreen />);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Đã mở khóa vĩnh viễn')).toBeTruthy();
  await fireEvent.press(screen.getByText('Đồng bộ quyền lợi')); expect(mockSync).toHaveBeenCalled();
});
it('does not interpret an unpurchased but currently free feature as a paid lifetime purchase', async () => {
  mockResult.data.ai = { purchased: false, hasAccess: true };
  await render(<AccountPlansScreen />);
  expect(screen.getByText('Tính năng hiện sẵn dùng')).toBeTruthy();
  expect(screen.queryByText('Đã mở khóa vĩnh viễn')).toBeNull();
});
