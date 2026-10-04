import { getApiError } from '../api';
import { REVIEW_PROTECTED_NOTICE } from '../../utils/playReview';
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
it.each(['PLAY_REVIEW_OPERATION_BLOCKED', 'PLAY_REVIEW_ACCOUNT_PROTECTED'])('maps %s without rendering the internal server message', code => {
  const result = getApiError({ isAxiosError: true, response: { status: 403, data: { code, message: 'System.Policy Internal Demo provider not permitted' } } });
  expect(result.code).toBe(code);
  expect(result.message).not.toContain('System.Policy'); expect(result.message).not.toContain('PLAY_REVIEW');
  if (code === 'PLAY_REVIEW_ACCOUNT_PROTECTED') expect(result.message).toBe(REVIEW_PROTECTED_NOTICE);
});
it('preserves normal business errors', () => {
  expect(getApiError({ isAxiosError: true, response: { status: 409, data: { code: 'BOOKING_CONFLICT', message: 'Giờ hẹn không còn trống.' } } }).message).toBe('Giờ hẹn không còn trống.');
});
