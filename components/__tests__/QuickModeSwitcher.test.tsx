import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { QuickModeSwitcher } from '../QuickModeSwitcher';

const mockPush = jest.fn();
const mockSelect = jest.fn();
let mockAccess = false;
let mockBusy = false;
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('lucide-react-native', () => ({ Check: () => null, ChevronDown: () => null }));
jest.mock('../../hooks/useAppMode', () => ({ useAppMode: () => ({ activeMode: 'CUSTOMER', hasMuaAccess: mockAccess, isModeSwitching: mockBusy, selectMode: mockSelect }) }));
jest.mock('../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: React.PropsWithChildren<{visible: boolean}>) => visible ? children : null }));

beforeEach(() => { jest.clearAllMocks(); mockAccess = false; mockBusy = false; });

it('offers the existing onboarding route to a Customer without MUA access', async () => {
  await render(<QuickModeSwitcher />);
  await fireEvent.press(screen.getByLabelText('Chế độ hiện tại: Khách hàng'));
  expect(screen.queryByRole('button', { name: 'Chuyên viên trang điểm' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Trở thành chuyên viên trang điểm' }));
  expect(mockPush).toHaveBeenCalledWith('/mua-onboarding');
  expect(mockSelect).not.toHaveBeenCalled();
});

it('shows the selected Customer context and calls the shared switch for an MUA account', async () => {
  mockAccess = true;
  await render(<QuickModeSwitcher />);
  await fireEvent.press(screen.getByLabelText('Chế độ hiện tại: Khách hàng'));
  expect(screen.getByRole('button', { name: 'Khách hàng' }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Chuyên viên trang điểm' }));
  expect(mockSelect).toHaveBeenCalledWith('MUA');
  expect(mockPush).not.toHaveBeenCalled();
});

it('disables the entire trigger while switching', async () => {
  mockBusy = true;
  await render(<QuickModeSwitcher />);
  const button = screen.getByLabelText('Chế độ hiện tại: Khách hàng');
  expect(button.props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(button);
  expect(screen.queryByRole('button', { name: 'Trở thành chuyên viên trang điểm' })).toBeNull();
});
