import { DEFAULT_ERROR_MESSAGE, NETWORK_MESSAGE, sanitizeUiMessage } from '../uiMessage';

it.each(['Network Error', 'Failed to fetch', 'Network request failed'])('maps transport failure %s', message => {
  expect(sanitizeUiMessage(message)).toBe(NETWORK_MESSAGE);
});
it.each(['undefined', '[object Object]', 'AxiosError: request failed', 'Request failed with status code 500', '<html>error</html>'])('hides technical message %s', message => {
  expect(sanitizeUiMessage(message)).toBe(DEFAULT_ERROR_MESSAGE);
});
it('preserves meaningful backend business errors', () => {
  expect(sanitizeUiMessage('Tài khoản đang chờ duyệt.')).toBe('Tài khoản đang chờ duyệt.');
});
