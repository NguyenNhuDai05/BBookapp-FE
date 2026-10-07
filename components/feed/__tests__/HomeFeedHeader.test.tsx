import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { HomeFeedHeader } from '../HomeFeedHeader';
import { AccountMenuTokens, Spacing } from '../../../constants/theme';

jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: React.PropsWithChildren) => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return React.createElement(View, null, children);
} }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('lucide-react-native', () => ({ Bell: () => null, Check: () => null, ChevronRight: () => null, CircleUserRound: () => null }));
jest.mock('../../../hooks/useAppMode', () => ({ useAppMode: () => ({ activeMode: 'CUSTOMER', hasMuaAccess: true, isModeSwitching: false, selectMode: jest.fn() }) }));
jest.mock('../../../store/useAuthStore', () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ user: { name: 'Account', email: 'test@example.test' } }) }));
jest.mock('../../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: React.PropsWithChildren<{visible: boolean}>) => visible ? children : null }));

afterEach(() => jest.restoreAllMocks());

it.each([320, 360, 390])('keeps the logo and separate notification/avatar touch targets within %sdp with large text', async width => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 844, scale: 1, fontScale: 1.5 });
  const notifications = jest.fn();
  const profile = jest.fn();
  await render(<HomeFeedHeader unreadCount={7} onNotificationsPress={notifications} onProfilePress={profile} />);
  const logo = StyleSheet.flatten(screen.getByLabelText('B-Book').props.style);
  expect(logo.width + AccountMenuTokens.touchSize * 2 + Spacing.sm * 2 + Spacing.base * 4).toBeLessThanOrEqual(width);
  expect(screen.queryByText('Khách hàng')).toBeNull();
  expect(screen.getByText('7')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('7 thông báo chưa đọc'));
  expect(notifications).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByLabelText('Mở tài khoản và chuyển chế độ'));
  expect(profile).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Tài khoản' }));
  expect(profile).toHaveBeenCalledTimes(1);
});
