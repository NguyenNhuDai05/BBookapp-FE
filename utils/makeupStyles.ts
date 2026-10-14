import { isAxiosError } from 'axios';
import { getApiError } from '../services/api';

export type MakeupStyle = { styleId: number; name: string | null; isActive: boolean };
export type StyleSelection = { styleIds: number[]; newStyleNames: string[] };
export const styleDisplayName = (name: string | null | undefined) => (name || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
export const styleNameKey = (name: string | null | undefined) => styleDisplayName(name).toLowerCase();
export const validStyleName = (name: string | null | undefined) => {
  const display = styleDisplayName(name);
  return display.length > 0 && display.length <= 100 && !/[\u0000-\u001f\u007f-\u009f]/.test(display);
};
export function styleErrorMessage(error: unknown): string {
  const parsed = getApiError(error);
  if (parsed.code === 'STYLE_IN_USE' && isAxiosError(error)) {
    const services = error.response?.data?.services as { serviceName?: string }[] | undefined;
    return `Phong cách đang được sử dụng. Hãy bỏ phong cách khỏi các dịch vụ trước: ${services?.map(item => item.serviceName).filter(Boolean).join(', ') || 'dịch vụ hiện có'}.`;
  }
  const messages: Record<string, string> = {
    STYLE_INACTIVE: 'Phong cách này đã ngừng sử dụng. Hãy tải lại danh sách và chọn phong cách khác.',
    STYLE_NAME_AMBIGUOUS: 'Tên phong cách bị trùng trong danh mục. Hãy chọn phong cách có sẵn hoặc dùng tên khác.',
    STYLE_PAYLOAD_CONFLICT: 'Danh sách phong cách đã thay đổi. Hãy tải lại và kiểm tra trước khi lưu.',
    SERVICE_REQUEST_CONFLICT: 'Lần lưu trước có nội dung khác. Hãy kiểm tra danh sách dịch vụ trước khi tạo lại.',
    STYLE_CREATE_RATE_LIMITED: 'Bạn đã thêm nhiều phong cách mới. Vui lòng thử lại sau.',
    MUA_STYLE_LIMIT_EXCEEDED: 'MUA có tối đa 20 phong cách. Hãy bỏ bớt phong cách chưa dùng trước khi thêm.',
    SERVICE_STYLE_LIMIT_EXCEEDED: 'Mỗi dịch vụ có tối đa 5 phong cách.',
  };
  return messages[parsed.code || ''] || parsed.message || 'Không thể lưu. Vui lòng thử lại.';
}
