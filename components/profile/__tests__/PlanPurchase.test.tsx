import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { PlanPurchase } from '../PlanPurchase';
const mockBuy = jest.fn(); const mockPush = jest.fn(); const mockRefetch = jest.fn();
let mockCatalog: any;
jest.mock('../../../hooks/useAppCommerce', () => ({ useAppCommerce: () => mockCatalog }));
jest.mock('../../../services/appCommerce', () => ({ appCommerce: { buy: (...args: any[]) => mockBuy(...args) }, commerceMessage: () => 'Lỗi thanh toán' }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../../store/useAuthStore', () => {
  const state = { user: { id: 'owner' } };
  return { useAuthStore: Object.assign((selector: any) => selector(state), { getState: () => state }) };
});
beforeEach(() => {
  jest.clearAllMocks(); mockBuy.mockResolvedValue('order');
  mockCatalog = { refetch: mockRefetch, data: { enabled: true, checkoutEnabled: true, role: 'Customer', termsVersion: 'legacy', products: [{ id: 'custom_ai', name: 'AI riêng', amountVnd: 35000, days: null, version: 2, termsVersion: 'product-v2' }] } };
});
it('uses the selected product price and terms and requires consent', async () => {
  await render(<PlanPurchase />);
  await fireEvent.press(screen.getByText('Mua và kích hoạt'));
  expect(mockBuy).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('checkbox'));
  await fireEvent.press(screen.getByText('Mua và kích hoạt'));
  await waitFor(() => expect(mockBuy).toHaveBeenCalledWith('owner', 'custom_ai', 'product-v2', false));
  expect(mockPush).toHaveBeenCalled();
});
it('requires fresh consent when the catalog version or price changes', async () => {
  const result = await render(<PlanPurchase />);
  await fireEvent.press(screen.getByRole('checkbox'));
  mockCatalog = { ...mockCatalog, data: { ...mockCatalog.data, products: [{ ...mockCatalog.data.products[0], version: 3, amountVnd: 40000 }] } };
  await result.rerender(<PlanPurchase />);
  expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(false);
  await fireEvent.press(screen.getByText('Mua và kích hoạt')); expect(mockBuy).not.toHaveBeenCalled();
});
