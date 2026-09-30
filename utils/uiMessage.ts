export const NETWORK_MESSAGE = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.';
export const DEFAULT_ERROR_MESSAGE = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';

/** Keep meaningful business messages; never render transport errors or serialized objects. */
export function sanitizeUiMessage(value: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  if (typeof value !== 'string') return fallback;
  const message = value.trim();
  if (!message || /^(undefined|null|\[object Object\])$/i.test(message)) return fallback;
  if (/network error|failed to fetch|network request failed|ECONN|ETIMEDOUT|timeout of \d+/i.test(message)) return NETWORK_MESSAGE;
  if (/AxiosError|Request failed with status code|Internal Server Error|Unhandled|System\.|stack trace|^<!doctype|^<html|^\s*[\[{].*[\]}]\s*$/i.test(message)) return fallback;
  return message;
}
