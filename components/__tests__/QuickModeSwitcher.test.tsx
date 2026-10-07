import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { QuickModeSwitcher } from '../QuickModeSwitcher';

const mockPush = jest.fn();
const mockSelect = jest.fn();
let mockAccess = false;
let mockBusy = false;
let mockMode: 'CUSTOMER' | 'MUA' = 'CUSTOMER';
const mockUser = { name: 'Nguyễn Như Đại', email: 'test@example.test', avatarUrl: 'https://example.test/avatar.jpg' };
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('lucide-react-native', () => ({ Check: () => null, ChevronRight: () => null, CircleUserRound: () => null }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ user: mockUser }) }));
jest.mock('../../hooks/useAppMode', () => ({ useAppMode: () => ({ activeMode: mockMode, hasMuaAccess: mockAccess, isModeSwitching: mockBusy, selectMode: mockSelect }) }));
jest.mock('../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: React.PropsWithChildren<{visible: boolean}>) => visible ? children : null }));

beforeEach(() => { jest.clearAllMocks(); mockAccess = false; mockBusy = false; mockMode = 'CUSTOMER'; });

it('offers the existing onboarding route to a Customer without MUA access', async () => {
  await render(<QuickModeSwitcher />);
  await fireEvent.press(screen.getByLabelText('Mở tài khoản và chuyển chế độ'));
  expect(screen.queryByRole('button', { name: 'Chuyên viên trang điểm' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Trở thành chuyên viên trang điểm' }));
  expect(mockPush).toHaveBeenCalledWith('/mua-onboarding');
  expect(mockSelect).not.toHaveBeenCalled();
});

it('shows the selected Customer context and calls the shared switch for an MUA account', async () => {
  mockAccess = true;
  await render(<QuickModeSwitcher />);
  await fireEvent.press(screen.getByLabelText('Mở tài khoản và chuyển chế độ'));
  expect(screen.getByRole('button', { name: 'Khách hàng' }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Chuyên viên trang điểm' }));
  expect(mockSelect).toHaveBeenCalledWith('MUA');
  expect(mockPush).not.toHaveBeenCalled();
});

it('disables the entire trigger while switching', async () => {
  mockBusy = true;
  await render(<QuickModeSwitcher />);
  const button = screen.getByLabelText('Mở tài khoản và chuyển chế độ');
  expect(button.props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(button);
  expect(screen.queryByRole('button', { name: 'Trở thành chuyên viên trang điểm' })).toBeNull();
});

it('shows account identity only after opening the avatar, without a visible mode trigger', async () => {
  await render(<QuickModeSwitcher />);
  expect(screen.queryByText('Khách hàng')).toBeNull();
  expect(screen.queryByText(mockUser.name)).toBeNull();
  const trigger = screen.getByLabelText('Mở tài khoản và chuyển chế độ');
  expect(screen.getByLabelText('Ảnh đại diện tài khoản').props.source).toEqual({ uri: mockUser.avatarUrl });
  await fireEvent.press(trigger);
  expect(screen.getByText(mockUser.name)).toBeTruthy();
  expect(screen.getByText(mockUser.email)).toBeTruthy();
  expect(mockPush).not.toHaveBeenCalled();
});

it('keeps the Customer profile entry and the original Home profile callback', async () => {
  const onProfilePress = jest.fn();
  const view = await render(<QuickModeSwitcher onProfilePress={onProfilePress} />);
  await fireEvent.press(screen.getByLabelText('Mở tài khoản và chuyển chế độ'));
  await fireEvent.press(screen.getByRole('button', { name: 'Tài khoản' }));
  expect(onProfilePress).toHaveBeenCalledTimes(1);
  expect(mockPush).not.toHaveBeenCalled();
  await view.rerender(<QuickModeSwitcher />);
  await fireEvent.press(screen.getByLabelText('Mở tài khoản và chuyển chế độ'));
  expect(screen.queryByRole('button', { name: 'Cài đặt' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Tài khoản' }));
  expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile');
});

it('selects MUA and returns to Customer through the existing shared switch', async () => {
  mockAccess = true; mockMode = 'MUA';
  await render(<QuickModeSwitcher />);
  await fireEvent.press(screen.getByLabelText('Mở tài khoản và chuyển chế độ'));
  expect(screen.getByRole('button', { name: 'Chuyên viên trang điểm' }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Khách hàng' }));
  expect(mockSelect).toHaveBeenCalledWith('CUSTOMER');
});

it('opens existing MUA Profile and Settings routes', async () => {
  mockAccess = true; mockMode = 'MUA';
  await render(<QuickModeSwitcher />);
  await fireEvent.press(screen.getByLabelText('Mở tài khoản và chuyển chế độ'));
  await fireEvent.press(screen.getByRole('button', { name: 'Tài khoản' }));
  expect(mockPush).toHaveBeenLastCalledWith('/(mua)/profile');
  await fireEvent.press(screen.getByLabelText('Mở tài khoản và chuyển chế độ'));
  await fireEvent.press(screen.getByRole('button', { name: 'Cài đặt' }));
  expect(mockPush).toHaveBeenLastCalledWith('/(mua)/settings');
});
