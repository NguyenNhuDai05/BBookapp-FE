import { buildChatRows, chatDayKey, findChatMatches, getMessageDateLabel, isSameMessageGroup, mergeChatMessages, normalizeChatReactions, parseChatDate, splitChatHighlight } from '../chatPresentation';
import type { MessageDto } from '../../services/chatService';
const message = (id: string, senderId = 'artist', sentAt = '2026-10-07T09:00:00Z'): MessageDto => ({ messageId: id, chatRoomId: 'room', senderId, sentAt, content: 'Xin chào bạn ❤️', isRead: false, reactions: [] });
it('groups five incoming messages and keeps one avatar at group end', () => {
  const messages = Array.from({ length: 5 }, (_, index) => message(String(index), 'artist', `2026-10-07T09:0${index}:00Z`));
  const rows = buildChatRows(messages, 'me');
  expect(rows.filter(row => row.groupEnd)).toHaveLength(1);
  expect(rows.filter(row => row.groupStart)).toHaveLength(1);
  expect(rows.filter(row => row.dateLabel)).toHaveLength(1);
});
it('separates senders and gaps over ten minutes', () => {
  expect(isSameMessageGroup(message('1'), message('2', 'me'))).toBe(false);
  expect(isSameMessageGroup(message('1'), message('2', 'ARTIST', '2026-10-07T09:10:00Z'))).toBe(true);
  expect(isSameMessageGroup(message('1'), message('2', 'artist', '2026-10-07T09:10:01Z'))).toBe(false);
});
it('uses device calendar days correctly across local midnight', () => {
  const before = new Date(2026, 9, 6, 23, 59).toISOString(); const after = new Date(2026, 9, 7, 0, 1).toISOString();
  expect(chatDayKey(before)).not.toBe(chatDayKey(after));
  expect(isSameMessageGroup(message('1', 'artist', before), message('2', 'artist', after))).toBe(false);
  expect(buildChatRows([message('1', 'artist', before), message('2', 'artist', after)], 'me', new Date(2026, 9, 7, 12)).map(row => row.dateLabel)).toEqual(['Hôm nay', 'Hôm qua']);
});
it('labels older days and years, and tolerates invalid timestamps', () => {
  const now = new Date(2026, 9, 7, 12);
  expect(getMessageDateLabel(new Date(2026, 9, 4, 12).toISOString(), now)).toBe('Chủ Nhật, 04/10');
  expect(getMessageDateLabel(new Date(2025, 11, 25, 12).toISOString(), now)).toBe('25/12/2025');
  expect(parseChatDate('not-a-date')).toBeNull();
  expect(getMessageDateLabel('not-a-date', now)).toBe('Ngày chưa xác định');
  expect(parseChatDate('2026-10-06T17:01:00')?.toISOString()).toBe('2026-10-06T17:01:00.000Z');
  expect(parseChatDate('2026-10-07T00:01:00+07:00')?.toISOString()).toBe('2026-10-06T17:01:00.000Z');
});
it('marks only the latest outgoing receipt, including same-minute messages', () => {
  const rows = buildChatRows([message('1', 'me'), message('2', 'me'), message('3')], 'ME');
  expect(rows.filter(row => row.showReadReceipt).map(row => row.message.messageId)).toEqual(['2']);
  expect(rows.find(row => row.message.messageId === '1')?.groupEnd).toBe(false);
});
it('deduplicates REST and realtime messages and keeps reaction updates', () => {
  const updated = { ...message('1'), reactions: [{ emoji: '❤️', count: 1, reactedByMe: false, userIds: ['ME'] }] };
  const merged = mergeChatMessages([message('1')], [updated]);
  expect(merged).toHaveLength(1);
  expect(normalizeChatReactions(merged[0], 'me').reactions[0].reactedByMe).toBe(true);
});
it('searches loaded content with Vietnamese, emoji and literal punctuation', () => {
  expect(findChatMatches([message('1'), message('2')], 'CHÀO')).toEqual(['1', '2']);
  expect(findChatMatches([message('1')], '  ')).toEqual([]);
  expect(splitChatHighlight('xin [chào] [CHÀO] ❤️', '[chào]').filter(part => part.match).map(part => part.text)).toEqual(['[chào]', '[CHÀO]']);
  expect(splitChatHighlight('Xin ❤️ bạn', '❤️').filter(part => part.match)).toEqual([{ text: '❤️', match: true }]);
});
