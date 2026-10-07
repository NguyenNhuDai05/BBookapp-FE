import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ChatRoomScreen from '../../../app/chat/[id]';
import { chatService, type MessageDto } from '../../../services/chatService';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { moderationService } from '../../../services/moderationService';
const mockPush = jest.fn(); const mockBack = jest.fn(); const mockHandlers: Record<string, any> = {};
const mockOff = jest.fn();
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'room' }), useIsFocused: () => true, useRouter: () => ({ push: mockPush, back: mockBack, canGoBack: () => true, replace: jest.fn() }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: jest.fn(async () => {}) }) }));
jest.mock('expo-image', () => ({ Image: jest.requireActual('react-native').Image }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
jest.mock('../../../services/chatService', () => ({ chatService: { getRooms: jest.fn(), getMessages: jest.fn(), markRead: jest.fn(async () => {}), sendMessage: jest.fn(), uploadImage: jest.fn(), reactToMessage: jest.fn() } }));
jest.mock('../../../services/authService', () => ({ authService: { getMe: jest.fn(async () => ({ id: 'me', role: 'Customer' })) } }));
jest.mock('../../../services/api', () => ({ getApiError: (error: any) => ({ message: error.message || 'Lỗi mạng' }) }));
jest.mock('../../../services/moderationService', () => ({ moderationService: { block: jest.fn(async () => {}) } }));
jest.mock('../../../services/signalRService', () => ({ signalRService: {
  joinRoom: jest.fn(async () => {}), leaveRoom: jest.fn(async () => {}), setTyping: jest.fn(async () => {}),
  onMessageReceived: (callback: any) => { mockHandlers.message = callback; return mockOff; },
  onMessageUpdated: (callback: any) => { mockHandlers.update = callback; return mockOff; },
  onMessagesRead: (callback: any) => { mockHandlers.read = callback; return mockOff; },
  onTypingChanged: (callback: any) => { mockHandlers.typing = callback; return mockOff; },
} }));
jest.mock('../../PrivateMediaImage', () => ({ PrivateMediaImage: (props: any) => { const { View } = require('react-native'); return <View testID="chat-image" {...props} />; } }));
jest.mock('../../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: any) => { const { View } = require('react-native'); return visible ? <View>{children}</View> : null; } }));
jest.mock('../../ui/ActionSheet', () => ({ ActionSheet: ({ visible, actions }: any) => { const { View, Text, TouchableOpacity } = require('react-native'); return visible ? <View>{actions.map((action: any) => <TouchableOpacity key={action.id} onPress={action.onPress}><Text>{action.label}</Text></TouchableOpacity>)}</View> : null; } }));
jest.mock('../../ui/AppModal', () => ({ AppModal: ({ visible, primaryAction }: any) => { const { Text, TouchableOpacity } = require('react-native'); return visible ? <TouchableOpacity onPress={primaryAction.onPress}><Text>{primaryAction.label}</Text></TouchableOpacity> : null; } }));
jest.mock('../../ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
jest.mock('../../moderation/ReportSheet', () => ({ ReportSheet: ({ target }: any) => { const { Text } = require('react-native'); return target ? <Text>{`report:${target.type}:${target.id}`}</Text> : null; } }));
const msg = (messageId = '1', content = 'Chào bạn', senderId = 'artist'): MessageDto => ({ messageId, content, senderId, chatRoomId: 'room', sentAt: '2026-10-07T09:00:00Z', reactions: [], isRead: false });
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(chatService.getRooms).mockResolvedValue([{ chatRoomId: 'room', customerId: 'me', muaId: 'artist', muaName: 'Nguyễn Đại', createdAt: '', unreadCount: 0 }]);
  jest.mocked(chatService.getMessages).mockResolvedValue([msg()]);
  jest.mocked(chatService.sendMessage).mockResolvedValue(msg('sent', 'Xin chào ❤️', 'me'));
});
const open = async () => { await render(<ChatRoomScreen />); await waitFor(() => expect(screen.getByText('Chào bạn')).toBeTruthy()); };
it('hides per-message safety, empty reactions and timestamps; keeps real read status', async () => {
  await open();
  expect(screen.queryByText('Báo cáo / Chặn')).toBeNull(); expect(screen.queryByText('♡')).toBeNull();
  expect(screen.queryByText('Đã gửi')).toBeNull(); expect(screen.getByText('Tin nhắn riêng')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Chào bạn'));
  expect(screen.getByText(/\d{2}:\d{2}/)).toBeTruthy();
});
it('opens incoming reply/copy/report and existing reaction API via long press', async () => {
  await open(); await fireEvent(screen.getByLabelText('Chào bạn'), 'longPress');
  expect(screen.getByText('Trả lời')).toBeTruthy(); expect(screen.getByText('Sao chép')).toBeTruthy();
  expect(screen.getByText('Báo cáo tin nhắn')).toBeTruthy();
  await fireEvent.press(screen.getByText('Trả lời')); expect(screen.getByText('Đang trả lời')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Nhập tin nhắn'), 'Xin chào ❤️');
  await fireEvent.press(screen.getByLabelText('Gửi tin nhắn'));
  await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledWith('room', 'Xin chào ❤️', undefined, '1'));
});
it('puts report/block in conversation menu and searches loaded messages', async () => {
  await open(); await fireEvent.press(screen.getByLabelText('Tùy chọn cuộc trò chuyện'));
  expect(screen.getByText('Chặn người dùng')).toBeTruthy(); expect(screen.getByText('Báo cáo người dùng')).toBeTruthy();
  await fireEvent.press(screen.getByText('Tìm trong cuộc trò chuyện'));
  await fireEvent.changeText(screen.getByLabelText('Tìm trong cuộc trò chuyện'), 'chào');
  await waitFor(() => expect(screen.getByText('1/1')).toBeTruthy());
  expect(screen.getByText(/Chỉ tìm trong tin nhắn đã tải/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Kết quả tiếp'));
  await fireEvent.press(screen.getByLabelText('Đóng tìm kiếm'));
  await fireEvent.press(screen.getByLabelText('Tùy chọn cuộc trò chuyện'));
  await fireEvent.press(screen.getByText('Báo cáo người dùng'));
  expect(screen.getByText('report:User:artist')).toBeTruthy();
});
it('keeps image upload/send payload and shows the returned media', async () => {
  await open();
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file://photo.jpg' }] } as any);
  jest.mocked(chatService.uploadImage).mockResolvedValue('media:photo');
  jest.mocked(chatService.sendMessage).mockResolvedValue({ ...msg('image', undefined, 'me'), content: undefined, imageMediaId: 'photo' });
  await fireEvent.press(screen.getByLabelText('Chọn ảnh'));
  await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledWith('room', undefined, 'media:photo', undefined));
  expect(chatService.uploadImage).toHaveBeenCalledWith('file://photo.jpg', 'room');
  await waitFor(() => expect(screen.getByTestId('chat-image')).toBeTruthy());
});
it('keeps draft on send failure and allows retry', async () => {
  await open(); jest.mocked(chatService.sendMessage).mockRejectedValueOnce(new Error('Mất kết nối'));
  await fireEvent.changeText(screen.getByLabelText('Nhập tin nhắn'), 'Xin chào ❤️');
  await fireEvent.press(screen.getByLabelText('Gửi tin nhắn'));
  await waitFor(() => expect(screen.getByText('Mất kết nối')).toBeTruthy());
  expect(screen.getByLabelText('Nhập tin nhắn').props.value).toBe('Xin chào ❤️');
  await fireEvent.press(screen.getByText('Thử lại'));
  await waitFor(() => expect(screen.getByLabelText('Nhập tin nhắn').props.value).toBe(''));
  expect(chatService.sendMessage).toHaveBeenCalledTimes(2);
});
it('merges realtime duplicate and removes all listeners on unmount', async () => {
  await open(); await act(async () => { mockHandlers.message(msg()); });
  expect(screen.getAllByText('Chào bạn')).toHaveLength(1);
  await screen.unmount(); expect(mockOff).toHaveBeenCalledTimes(4);
});
it('keeps quick action navigation unchanged', async () => {
  await open(); await fireEvent.press(screen.getByText('Đặt lịch'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/mua-detail', params: { id: 'artist', tab: 'Dịch vụ' } });
  await fireEvent.press(screen.getByText('Portfolio'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/mua-detail', params: { id: 'artist', tab: 'Portfolio' } });
});
it('sends an actual reaction only on user action and renders the returned badge', async () => {
  await open(); jest.mocked(chatService.reactToMessage).mockResolvedValue({ ...msg(), reactions: [{ emoji: '❤️', count: 1, reactedByMe: true, userIds: ['me'] }] });
  expect(chatService.reactToMessage).not.toHaveBeenCalled();
  await fireEvent(screen.getByLabelText('Chào bạn'), 'longPress');
  await fireEvent.press(screen.getByLabelText('Thả cảm xúc ❤️'));
  await waitFor(() => expect(screen.getByLabelText('❤️: 1 cảm xúc')).toBeTruthy());
  expect(chatService.reactToMessage).toHaveBeenCalledWith('room', '1', '❤️');
});
it('loads an older page with the existing timestamp cursor', async () => {
  const history = Array.from({ length: 50 }, (_, index) => ({ ...msg(`history-${index}`, index === 49 ? 'Chào bạn' : `Tin ${index}`), sentAt: new Date(Date.UTC(2026, 9, 7, 9, index)).toISOString() }));
  jest.mocked(chatService.getMessages).mockResolvedValueOnce(history).mockResolvedValueOnce([msg('older', 'Tin cũ')]);
  await open(); await fireEvent.press(screen.getByText('Tải tin nhắn trước'));
  await waitFor(() => expect(chatService.getMessages).toHaveBeenCalledWith('room', history[0].sentAt));
  expect(screen.getByTestId('chat-message-list').props.maintainVisibleContentPosition).toEqual({ minIndexForVisible: 0 });
});
it('keeps the uploaded image for retry after a failed send', async () => {
  await open();
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file://photo.jpg' }] } as any);
  jest.mocked(chatService.uploadImage).mockResolvedValue('media:photo');
  jest.mocked(chatService.sendMessage).mockRejectedValueOnce(new Error('Gửi ảnh thất bại')).mockResolvedValueOnce({ ...msg('image', '', 'me'), imageMediaId: 'photo' });
  await fireEvent.press(screen.getByLabelText('Chọn ảnh'));
  await waitFor(() => expect(screen.getByText('Gửi ảnh thất bại')).toBeTruthy());
  await fireEvent.press(screen.getByText('Thử lại'));
  await waitFor(() => expect(screen.getByTestId('chat-image')).toBeTruthy());
  expect(chatService.uploadImage).toHaveBeenCalledTimes(1);
  expect(chatService.sendMessage).toHaveBeenCalledTimes(2);
});
it('shows initial network error with an explicit retry', async () => {
  jest.mocked(chatService.getMessages).mockRejectedValueOnce(new Error('Lỗi mạng')).mockResolvedValueOnce([msg()]);
  await render(<ChatRoomScreen />);
  await waitFor(() => expect(screen.getByText('Không thể tải cuộc trò chuyện')).toBeTruthy());
  await fireEvent.press(screen.getByText('Thử lại'));
  await waitFor(() => expect(screen.getByText('Chào bạn')).toBeTruthy());
});
it.each([360, 393, 430])('keeps bubble and composer sizing within %ipx viewport', async width => {
  const native = require('react-native');
  const dimension = jest.spyOn(native, 'useWindowDimensions').mockReturnValue({ width, height: 800, scale: 1, fontScale: 1 });
  try {
    await open();
    const bubble = require('react-native').StyleSheet.flatten(screen.getByTestId('message-block-1').props.style);
    expect(bubble.maxWidth).toBeCloseTo((width - 24) * 0.76);
    expect(bubble.maxWidth + 43 + 24).toBeLessThan(width);
    expect(screen.getByLabelText('Nhập tin nhắn').props.multiline).toBe(true);
    expect(screen.getByLabelText('Nhập tin nhắn').props.submitBehavior).toBe('submit');
    expect(screen.getByText('Đặt lịch')).toBeTruthy(); expect(screen.getByText('Portfolio')).toBeTruthy();
  } finally { dimension.mockRestore(); }
});
it('copies content and reports a message only from the long-press menu', async () => {
  await open(); await fireEvent(screen.getByLabelText('Chào bạn'), 'longPress');
  await fireEvent.press(screen.getByText('Sao chép'));
  await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith('Chào bạn'));
  await fireEvent(screen.getByLabelText('Chào bạn'), 'longPress');
  await fireEvent.press(screen.getByText('Báo cáo tin nhắn'));
  expect(screen.getByText('report:Message:1')).toBeTruthy();
});
it('preserves block confirmation and existing moderation endpoint', async () => {
  await open(); await fireEvent.press(screen.getByLabelText('Tùy chọn cuộc trò chuyện'));
  await fireEvent.press(screen.getByText('Chặn người dùng'));
  expect(moderationService.block).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Chặn'));
  await waitFor(() => expect(moderationService.block).toHaveBeenCalledWith('artist'));
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
});
it('shows sending for slow requests, disables resubmission, then renders a real read receipt', async () => {
  await open();
  let finish!: (message: MessageDto) => void;
  jest.mocked(chatService.sendMessage).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  await fireEvent.changeText(screen.getByLabelText('Nhập tin nhắn'), 'Xin chào ❤️');
  await fireEvent.press(screen.getByLabelText('Gửi tin nhắn'));
  expect(screen.getByText('Đang gửi…')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Gửi tin nhắn'));
  expect(chatService.sendMessage).toHaveBeenCalledTimes(1);
  await act(async () => { finish(msg('sent', 'Xin chào ❤️', 'me')); });
  expect(screen.getAllByText('Đã gửi')).toHaveLength(1);
  await act(async () => { mockHandlers.read({ roomId: 'room', readerId: 'artist', readAt: '2026-10-07T09:01:00Z' }); });
  expect(screen.getAllByText('Đã xem')).toHaveLength(1);
  expect(screen.queryByText('Đang gửi…')).toBeNull();
});
