import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import Login from '../(auth)/login';
import Register from '../(auth)/register';
import VerifyEmail from '../(auth)/verify-email';
import ForgotPassword from '../(auth)/forgot-password';
import ChangePassword from '../change-password';
import { useRegistrationStore } from '../../store/useRegistrationStore';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissAll: jest.fn() };
const mockLogin = jest.fn();
const mockLogout = jest.fn();
let mockUser: { email: string; role: string } | null = null;
let mockParams: Record<string, string> = {};
const mockAuth = { requestRegistrationOtp: jest.fn(), register: jest.fn(), requestPasswordReset: jest.fn(), verifyPasswordResetOtp: jest.fn(), completePasswordReset: jest.fn() };
const mockAlert = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, Redirect: () => null }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: Object.assign(
  (select: (state: object) => unknown) => select({ login: mockLogin, user: mockUser }),
  { getState: () => ({ user: mockUser ?? { role: 'CUSTOMER' }, isAuthenticated: !!mockUser, logout: mockLogout }) },
) }));
jest.mock('../../services/authService', () => ({ get authService() { return mockAuth; } }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: (...args: unknown[]) => mockAlert(...args) } }));
jest.mock('../../services/api', () => ({ getApiError: () => ({ message: 'Không thể xác minh mã.' }) }));

beforeEach(() => {
  jest.resetAllMocks();
  useRegistrationStore.getState().clear();
  mockLogin.mockResolvedValue(true);
  mockUser = null; mockParams = {};
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
});
afterEach(() => useRegistrationStore.getState().clear());

it('requires consent before requesting registration OTP and preserves the email flow', async () => {
  await render(<Register />);
  expect(screen.queryByText(/Google/i)).toBeNull();
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập họ và tên'), 'Nguyen An');
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập email'), 'an@example.com');
  await fireEvent.changeText(screen.getByPlaceholderText('Tạo mật khẩu'), 'secret123');
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập lại mật khẩu'), 'secret123');
  await fireEvent.press(screen.getByText('Tiếp tục'));
  expect(mockAuth.requestRegistrationOtp).not.toHaveBeenCalled();
  expect(useRegistrationStore.getState().draft).toBeNull();
  await fireEvent.press(screen.getByLabelText('Đồng ý với chính sách và điều khoản'));
  expect(screen.getByLabelText('Đồng ý với chính sách và điều khoản').props.accessibilityState.checked).toBe(true);
  await fireEvent.press(screen.getByText('Tiếp tục'));
  expect(mockAuth.requestRegistrationOtp).toHaveBeenCalledWith('an@example.com');
  expect(mockAuth.register).not.toHaveBeenCalled();
  expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/verify-email');
  expect(useRegistrationStore.getState().draft?.password).toBe('secret123');
});

it('creates an account only after submitting OTP and then logs in with email/password', async () => {
  useRegistrationStore.getState().begin({ fullName: 'An', email: 'an@example.com', password: 'secret123' });
  await render(<VerifyEmail />);
  await fireEvent.changeText(screen.getByLabelText('Mã OTP gồm 6 chữ số'), '123456');
  await fireEvent.press(screen.getByText('Xác minh'));
  expect(mockAuth.register).toHaveBeenCalledWith(expect.objectContaining({ email: 'an@example.com', password: 'secret123', otp: '123456' }));
  expect(mockLogin).toHaveBeenCalledWith('an@example.com', 'secret123');
  expect(useRegistrationStore.getState().draft).toBeNull();
  expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/home');
});

it('does not authenticate when the server rejects registration OTP', async () => {
  mockAuth.register.mockRejectedValue(new Error('OTP không hợp lệ'));
  useRegistrationStore.getState().begin({ fullName: 'An', email: 'an@example.com', password: 'secret123' });
  await render(<VerifyEmail />);
  await fireEvent.changeText(screen.getByLabelText('Mã OTP gồm 6 chữ số'), '123456');
  await fireEvent.press(screen.getByText('Xác minh'));
  expect(mockLogin).not.toHaveBeenCalled();
  expect(useRegistrationStore.getState().draft).not.toBeNull();
});

it('shows email login only and leaves the user on login after wrong credentials', async () => {
  mockLogin.mockResolvedValue(false);
  await render(<Login />);
  expect(screen.queryByText(/Google/i)).toBeNull();
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập email'), 'an@example.com');
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'wrong123');
  await fireEvent.press(screen.getAllByText('Đăng nhập')[1]);
  expect(mockLogin).toHaveBeenCalledWith('an@example.com', 'wrong123');
  expect(mockRouter.replace).not.toHaveBeenCalled();
  expect(mockAlert).toHaveBeenCalled();
});

it('logs in with email/password and opens home on success', async () => {
  await render(<Login />);
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập email'), 'an@example.com');
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'secret123');
  await fireEvent.press(screen.getAllByText('Đăng nhập')[1]);
  expect(mockLogin).toHaveBeenCalledWith('an@example.com', 'secret123');
  expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/home');
});

it('verifies OTP before opening new passwords and automatically returns to login', async () => {
  mockAuth.requestPasswordReset.mockResolvedValue({ resendAfterSeconds: 60, expiresInSeconds: 300 });
  mockAuth.verifyPasswordResetOtp.mockResolvedValue({ resetToken: 'verified-token', expiresInSeconds: 300 });
  await render(<ForgotPassword />);
  await fireEvent.changeText(screen.getByLabelText('Email tài khoản'), 'an@example.com');
  await fireEvent.press(screen.getByText('Gửi mã xác minh'));
  expect(mockAuth.requestPasswordReset).toHaveBeenCalledWith('an@example.com');
  expect(screen.queryByLabelText('Mật khẩu mới')).toBeNull();
  expect(screen.getByText(/Gửi lại sau/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Mã OTP gồm 6 chữ số'), '123456');
  await fireEvent.press(screen.getByText('Xác minh'));
  expect(mockAuth.verifyPasswordResetOtp).toHaveBeenCalledWith('an@example.com', '123456');
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'newsecret123');
  await fireEvent.changeText(screen.getByLabelText('Xác nhận mật khẩu mới'), 'newsecret123');
  expect(screen.getByLabelText('Mật khẩu mới').props.secureTextEntry).toBe(true);
  await fireEvent.press(screen.getByLabelText('Hiện mật khẩu mới'));
  expect(screen.getByLabelText('Mật khẩu mới').props.secureTextEntry).toBe(false);
  expect(screen.getByLabelText('Xác nhận mật khẩu mới').props.secureTextEntry).toBe(true);
  await fireEvent.press(screen.getByText('Lưu mật khẩu mới'));
  expect(mockAuth.completePasswordReset).toHaveBeenCalledWith('an@example.com', 'verified-token', 'newsecret123');
  expect(mockRouter.dismissAll).toHaveBeenCalled();
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { email: 'an@example.com', passwordReset: '1' } });
});

it('keeps rejected OTP on verification and prevents password mismatch submission', async () => {
  mockAuth.verifyPasswordResetOtp.mockRejectedValueOnce(new Error('OTP sai'));
  await render(<ForgotPassword />);
  await fireEvent.changeText(screen.getByLabelText('Email tài khoản'), 'an@example.com');
  await fireEvent.press(screen.getByText('Gửi mã xác minh'));
  await fireEvent.changeText(screen.getByLabelText('Mã OTP gồm 6 chữ số'), '123456');
  await fireEvent.press(screen.getByText('Xác minh'));
  expect(screen.queryByLabelText('Mật khẩu mới')).toBeNull();
  mockAuth.verifyPasswordResetOtp.mockResolvedValue({ resetToken: 'token', expiresInSeconds: 300 });
  await fireEvent.press(screen.getByText('Xác minh'));
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'newsecret123');
  await fireEvent.changeText(screen.getByLabelText('Xác nhận mật khẩu mới'), 'different123');
  await fireEvent.press(screen.getByText('Lưu mật khẩu mới'));
  expect(mockAuth.completePasswordReset).not.toHaveBeenCalled();
  expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toBeTruthy();
});

it('enforces resend countdown and clears the previously entered code', async () => {
  jest.useFakeTimers();
  try {
    await render(<ForgotPassword />);
    await fireEvent.changeText(screen.getByLabelText('Email tài khoản'), 'an@example.com');
    await fireEvent.press(screen.getByText('Gửi mã xác minh'));
    await fireEvent.changeText(screen.getByLabelText('Mã OTP gồm 6 chữ số'), '123456');
    await fireEvent.press(screen.getByText('Gửi lại sau 60s'));
    expect(mockAuth.requestPasswordReset).toHaveBeenCalledTimes(1);
    await act(async () => { jest.advanceTimersByTime(60000); });
    await fireEvent.press(screen.getByText('Gửi lại mã'));
    expect(mockAuth.requestPasswordReset).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText('Mã OTP gồm 6 chữ số').props.value).toBe('');
  } finally { jest.useRealTimers(); }
});

it.each(['CUSTOMER', 'MUA'])('starts %s recovery with current email and logs out after reset', async role => {
  mockUser = { email: 'account@example.com', role };
  const view = await render(<ChangePassword />);
  await fireEvent.press(screen.getByText('Quên mật khẩu?'));
  expect(mockAuth.requestPasswordReset).toHaveBeenCalledWith('account@example.com');
  mockParams = mockRouter.push.mock.calls[0][0].params;
  await view.unmount();
  await render(<ForgotPassword />);
  expect(screen.queryByLabelText('Email tài khoản')).toBeNull();
  mockAuth.verifyPasswordResetOtp.mockResolvedValue({ resetToken: 'account-token', expiresInSeconds: 300 });
  await fireEvent.changeText(screen.getByLabelText('Mã OTP gồm 6 chữ số'), '123456');
  await fireEvent.press(screen.getByText('Xác minh'));
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'newsecret123');
  await fireEvent.changeText(screen.getByLabelText('Xác nhận mật khẩu mới'), 'newsecret123');
  await fireEvent.press(screen.getByText('Lưu mật khẩu mới'));
  expect(mockAuth.completePasswordReset).toHaveBeenCalledWith('account@example.com', 'account-token', 'newsecret123');
  expect(mockLogout).toHaveBeenCalledTimes(1);
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { email: 'account@example.com', passwordReset: '1' } });
});
