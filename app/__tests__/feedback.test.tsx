import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import FeedbackScreen from '../feedback';
const mockCreate = jest.fn();
let mockDemo = false;
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('expo-crypto', () => ({ randomUUID: () => '11111111-1111-1111-1111-111111111111' }));
jest.mock('../../services/feedbackService', () => ({ feedbackService: { create: (...args: unknown[]) => mockCreate(...args) } }));
jest.mock('../../services/api', () => ({ getApiError: () => ({ message: 'Không thể kết nối máy chủ' }) }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { isDemoAccount: mockDemo } }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.setTimeout(30000);
beforeEach(() => { jest.clearAllMocks(); mockDemo = false; });

it('validates content before sending and confirms only a successful backend response', async () => {
  mockCreate.mockResolvedValue({ id: 'receipt-1' });
  await render(<FeedbackScreen />);
  await fireEvent.press(screen.getByLabelText('Gửi phản hồi'));
  expect(mockCreate).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Nội dung phản hồi'), 'Ứng dụng gặp lỗi khi mở lịch hẹn');
  await fireEvent.press(screen.getByLabelText('Gửi phản hồi'));
  await waitFor(() => expect(screen.getByText('Mã phản hồi: receipt-1')).toBeTruthy());
  expect(mockCreate).toHaveBeenCalledWith({ submissionId: '11111111-1111-1111-1111-111111111111', category: 'Suggestion', body: 'Ứng dụng gặp lỗi khi mở lịch hẹn' });
});
it('retains submission ID when retrying a failed request and blocks repeated taps', async () => {
  let reject!: (error: Error) => void;
  mockCreate.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
  await render(<FeedbackScreen />);
  await fireEvent.changeText(screen.getByLabelText('Nội dung phản hồi'), 'Góp ý cho màn hình đặt lịch');
  await fireEvent.press(screen.getByLabelText('Gửi phản hồi'));
  await fireEvent.press(screen.getByLabelText('Gửi phản hồi'));
  expect(mockCreate).toHaveBeenCalledTimes(1);
  await act(async () => { reject(new Error('network')); });
  await waitFor(() => expect(screen.getByText('Không thể kết nối máy chủ')).toBeTruthy());
  expect(screen.queryByText('Đã nhận phản hồi của bạn')).toBeNull();
  mockCreate.mockResolvedValueOnce({ id: 'receipt-2' });
  await fireEvent.press(screen.getByLabelText('Gửi phản hồi'));
  await waitFor(() => expect(screen.getByText('Mã phản hồi: receipt-2')).toBeTruthy());
  expect(mockCreate.mock.calls[1][0].submissionId).toEqual(mockCreate.mock.calls[0][0].submissionId);
});
it('does not submit demo account feedback', async () => {
  mockDemo = true;
  await render(<FeedbackScreen />);
  await fireEvent.press(screen.getByLabelText('Gửi phản hồi'));
  expect(mockCreate).not.toHaveBeenCalled();
});
