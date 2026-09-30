import type { ModalVariant } from './AppModal';
import { DEFAULT_ERROR_MESSAGE, NETWORK_MESSAGE, sanitizeUiMessage } from '../../utils/uiMessage';

export type DialogButton = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void | Promise<unknown> };
export type DialogRequest = { id: number; title: string; message: string; variant: ModalVariant; buttons: DialogButton[]; cancelable: boolean; onDismiss?: () => void };
let queue: DialogRequest[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
export const dialogStore = {
  subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => queue[0] ?? null,
  dismiss: (id: number) => { queue = queue.filter(request => request.id !== id); emit(); },
  enqueue: (request: Omit<DialogRequest, 'id'>) => { queue = [...queue, { ...request, id: ++nextId }]; emit(); },
};

export function inferDialogVariant(title: string, buttons: DialogButton[]): ModalVariant {
  if (buttons.some(button => button.style === 'destructive')) return 'destructive';
  if (/không thể|thất bại|không thành công|lỗi|mất kết nối|OAuth/i.test(title)) return 'error';
  if (buttons.length > 1) return 'confirm';
  if (/thành công|đã (lưu|thêm|gửi|cập nhật)/i.test(title)) return 'success';
  if (/thiếu|chưa|quyền|bắt buộc|không hợp lệ/i.test(title)) return 'warning';
  return 'info';
}

/** Explicit compatibility API: preserves legacy callback semantics without native Alert. */
export const AppAlert = {
  alert(title: string, message?: string, buttons?: DialogButton[], options?: { cancelable?: boolean; onDismiss?: () => void }) {
    const safeMessage = message ? sanitizeUiMessage(message) : '';
    const isNetwork = safeMessage === NETWORK_MESSAGE;
    const actions = buttons?.length ? buttons.map(button => ({ ...button, text: button.text === 'OK' ? 'Đã hiểu' : button.text })) : [{ text: /đăng nhập.*thất bại/i.test(title) ? 'Thử lại' : 'Đã hiểu' }];
    dialogStore.enqueue({ title: isNetwork ? 'Mất kết nối' : sanitizeUiMessage(title, 'Thông báo'), message: safeMessage,
      variant: isNetwork ? 'error' : inferDialogVariant(title, actions), buttons: actions, cancelable: options?.cancelable ?? true, onDismiss: options?.onDismiss });
  },
  error(error: unknown) { AppAlert.alert('Không thể thực hiện', sanitizeUiMessage(error instanceof Error ? error.message : error, DEFAULT_ERROR_MESSAGE)); },
};
