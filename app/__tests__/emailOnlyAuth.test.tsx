import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import Login from '../(auth)/login';
import Register from '../(auth)/register';
import VerifyEmail from '../(auth)/verify-email';
import ForgotPassword from '../(auth)/forgot-password';
import { useRegistrationStore } from '../../store/useRegistrationStore';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const mockLogin = jest.fn();
const mockAuth = { requestRegistrationOtp: jest.fn(), register: jest.fn(), requestPasswordReset: jest.fn(), resetPassword: jest.fn() };
const mockAlert = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}), Redirect: () => null }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: Object.assign(
  (select: (state: object) => unknown) => select({ login: mockLogin }),
  { getState: () => ({ user: { role: 'CUSTOMER' } }) },
) }));
jest.mock('../../services/authService', () => ({ get authService() { return mockAuth; } }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: (...args: unknown[]) => mockAlert(...args) } }));
jest.mock('../../services/api', () => ({ getApiError: () => ({ message: 'Không thể xác minh mã.' }) }));

beforeEach(() => {
  jest.resetAllMocks();
  useRegistrationStore.getState().clear();
  mockLogin.mockResolvedValue(true);
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

it('requests password reset OTP, then submits it with the new password', async () => {
  await render(<ForgotPassword />);
  await fireEvent.changeText(screen.getByDisplayValue(''), 'an@example.com');
  await fireEvent.press(screen.getByText('Gửi mã OTP'));
  expect(mockAuth.requestPasswordReset).toHaveBeenCalledWith('an@example.com');
  const inputs = screen.getAllByDisplayValue('');
  await fireEvent.changeText(inputs[0], '123456');
  await fireEvent.changeText(inputs[1], 'newsecret123');
  await fireEvent.changeText(inputs[2], 'newsecret123');
  await fireEvent.press(screen.getByText('Đặt lại mật khẩu'));
  expect(mockAuth.resetPassword).toHaveBeenCalledWith('an@example.com', '123456', 'newsecret123');
  expect(mockAlert).toHaveBeenLastCalledWith('Thành công', expect.any(String), expect.any(Array));
});
