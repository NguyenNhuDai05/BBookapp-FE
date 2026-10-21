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
it('identifies a suspended Render service without exposing its HTML response', () => {
 const result = getApiError({isAxiosError:true,response:{status:503,headers:{'x-render-routing':'suspend-by-user'},data:'<html>Service Suspended</html>'}});
 expect(result.code).toBe('SERVICE_SUSPENDED');
 expect(result.message).toContain('tạm ngừng');expect(result.message).not.toContain('html');
 expect(result.isNetworkError).toBe(false);
});
it.each([500,502,503,504])('gives an actionable server error for HTTP %s', status => {
 const result = getApiError({isAxiosError:true,response:{status,data:{message:'Internal database failure'}}});
 expect(result.message).toContain('Máy chủ');expect(result.message).not.toContain('database');
});
