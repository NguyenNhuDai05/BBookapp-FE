import type { MessageDto } from '../services/chatService';

export const MESSAGE_GROUP_GAP_MS = 10 * 60 * 1000;
// ASP.NET timestamps originate from UTC. Preserve explicit offsets; normalize
// legacy ISO timestamps without a zone instead of interpreting them as local.
export function parseChatDate(value?: string): Date | null {
  if (!value) return null;
  const normalized = /T/.test(value) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? `${value}Z` : value;
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}
export function chatDayKey(value?: string) {
  const date = parseChatDate(value);
  return date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : null;
}
export function getMessageDateLabel(value: string, now = new Date()) {
  const date = parseChatDate(value);
  if (!date) return 'Ngày chưa xác định';
  if (chatDayKey(value) === chatDayKey(now.toISOString())) return 'Hôm nay';
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (chatDayKey(value) === chatDayKey(yesterday.toISOString())) return 'Hôm qua';
  const dayMonth = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (date.getFullYear() !== now.getFullYear()) return `${dayMonth}/${date.getFullYear()}`;
  return `${['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][date.getDay()]}, ${dayMonth}`;
}
export function isSameMessageGroup(previous?: MessageDto, next?: MessageDto) {
  if (!previous || !next || previous.senderId.toLowerCase() !== next.senderId.toLowerCase()) return false;
  const a = parseChatDate(previous.sentAt); const b = parseChatDate(next.sentAt);
  return !!a && !!b && chatDayKey(previous.sentAt) === chatDayKey(next.sentAt)
    && b.getTime() >= a.getTime() && b.getTime() - a.getTime() <= MESSAGE_GROUP_GAP_MS;
}
export function mergeChatMessages(previous: MessageDto[], incoming: MessageDto[]) {
  const byId = new Map(previous.map(message => [message.messageId, message]));
  incoming.forEach(message => byId.set(message.messageId, message));
  return [...byId.values()].sort((a, b) => (parseChatDate(a.sentAt)?.getTime() ?? 0) - (parseChatDate(b.sentAt)?.getTime() ?? 0) || a.messageId.localeCompare(b.messageId));
}
export function normalizeChatReactions(message: MessageDto, currentUserId?: string | null): MessageDto {
  return { ...message, reactions: (message.reactions || []).map(reaction => ({
    ...reaction, reactedByMe: reaction.userIds ? reaction.userIds.some(id => id.toLowerCase() === currentUserId?.toLowerCase()) : reaction.reactedByMe,
  })) };
}
export type ChatRow = { message: MessageDto; own: boolean; groupStart: boolean; groupEnd: boolean; dateLabel?: string; showReadReceipt: boolean };
export function buildChatRows(messages: MessageDto[], currentUserId: string | null, now = new Date()): ChatRow[] {
  const userId = currentUserId?.toLowerCase();
  const latestOutgoing = [...messages].reverse().find(message => message.senderId.toLowerCase() === userId)?.messageId;
  return messages.map((message, index) => ({
    message, own: message.senderId.toLowerCase() === userId,
    groupStart: !isSameMessageGroup(messages[index - 1], message),
    groupEnd: !isSameMessageGroup(message, messages[index + 1]),
    dateLabel: index === 0 || chatDayKey(messages[index - 1].sentAt) !== chatDayKey(message.sentAt) ? getMessageDateLabel(message.sentAt, now) : undefined,
    showReadReceipt: message.messageId === latestOutgoing,
  })).reverse(); // inverted FlatList: newest at index zero
}
export function getChatTime(value: string) {
  return parseChatDate(value)?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) ?? 'Chưa rõ giờ';
}
export function findChatMatches(messages: MessageDto[], query: string) {
  const needle = query.trim().toLocaleLowerCase('vi-VN');
  return needle ? messages.filter(message => message.content?.toLocaleLowerCase('vi-VN').includes(needle)).map(message => message.messageId) : [];
}
export function splitChatHighlight(content: string, query: string) {
  const needle = query.trim().toLocaleLowerCase('vi-VN');
  if (!needle) return [{ text: content, match: false }];
  const lower = content.toLocaleLowerCase('vi-VN');
  const parts: { text: string; match: boolean }[] = []; let start = 0; let index: number;
  while ((index = lower.indexOf(needle, start)) >= 0) {
    if (index > start) parts.push({ text: content.slice(start, index), match: false });
    parts.push({ text: content.slice(index, index + needle.length), match: true }); start = index + needle.length;
  }
  if (start < content.length) parts.push({ text: content.slice(start), match: false });
  return parts;
}
