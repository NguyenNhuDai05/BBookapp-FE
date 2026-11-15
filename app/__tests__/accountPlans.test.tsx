import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AccountPlansScreen from '../account-plans';
const mockSync = jest.fn(); const mockBack = jest.fn();
let mockResult: any;
let mockMode = 'CUSTOMER';
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (select: any) => select({ activeMode: mockMode }) }));
jest.mock('../../hooks/useAccountPlans', () => ({ useAccountPlans: () => mockResult }));
jest.mock('../../components/profile/PlanPurchase', () => ({ PlanPurchase: () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
beforeEach(() => { jest.clearAllMocks(); mockMode = 'CUSTOMER'; mockResult = { enabled: true, isPending: false, isFetching: false, isError: false, sync: { isPending: false, mutate: mockSync }, data: { role: 'Customer', ai: { purchased: true, hasAccess: true }, orders: [], evaluatedAt: '2026-10-29T09:00:00Z' } }; });
it('shows confirmed lifetime access without manual web synchronization', async () => {
  await render(<AccountPlansScreen />);
  expect(screen.getByText('Đã mở khóa vĩnh viễn')).toBeTruthy();
  expect(screen.queryByText(/Thanh toán|payOS|Google Play Billing|Mua ngay/)).toBeNull();
  expect(screen.queryByText('Đồng bộ quyền lợi')).toBeNull();
});
it('shows expired promotion without blocking normal bookings and keeps the receipt reference', async () => {
  mockMode = 'MUA';
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
  await fireEvent.press(screen.getByText('Thử lại')); expect(mockSync).toHaveBeenCalled();
});
it('does not interpret an unpurchased but currently free feature as a paid lifetime purchase', async () => {
  mockResult.data.ai = { purchased: false, hasAccess: true };
  await render(<AccountPlansScreen />);
  expect(screen.getByText('Chưa kích hoạt')).toBeTruthy();
  expect(screen.queryByText('Đã mở khóa vĩnh viễn')).toBeNull();
});

it('shows only AI rights and receipts in customer mode even when the account is an artist',async()=>{
  mockResult.data.role='MUA'; mockResult.data.mua={visibilityStatus:'Active'};
  mockResult.data.orders=[{id:'ai',productId:'bbook_customer_ai_lifetime_v1',role:'Customer',amountVnd:20000,state:'Fulfilled',createdAt:'2026-11-15T00:00:00Z'},{id:'vis',productId:'bbook_visibility_30d_v1',role:'MUA',amountVnd:75000,state:'Fulfilled',createdAt:'2026-11-15T00:00:00Z'}];
  await render(<AccountPlansScreen/>);
  expect(screen.getByText('Trạng thái quyền lợi AI')).toBeTruthy();
  expect(screen.queryByText('Quảng bá MUA')).toBeNull();
  expect(screen.getByText('Mã đơn: ai')).toBeTruthy();expect(screen.queryByText('Mã đơn: vis')).toBeNull();
});
it('shows visibility without AI cards in MUA mode',async()=>{
  mockMode='MUA';await render(<AccountPlansScreen/>);
  expect(screen.getByText('Quảng bá MUA')).toBeTruthy();expect(screen.queryByText('Trạng thái quyền lợi AI')).toBeNull();
});
