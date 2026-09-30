import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ChatListScreen from '../ChatListScreen';
import { chatService, type ChatRoomDto } from '../../../services/chatService';
import { getChatPeer } from '../../../utils/chatPeer';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-image', () => ({ Image: jest.requireActual('react-native').Image }));
jest.mock('../../ui/ActionSheet', () => ({ ActionSheet: () => null }));
jest.mock('../../../services/chatService', () => ({ chatService: { getRooms: jest.fn(), markRead: jest.fn() } }));
jest.mock('../../../services/authService', () => ({ authService: { getMe: jest.fn(async () => ({ id: 'me' })) } }));
jest.mock('../../../services/signalRService', () => ({ signalRService: { connect: jest.fn(async () => {}), onMessageReceived: jest.fn(() => () => {}), onMessagesRead: jest.fn(() => () => {}) } }));
const room: ChatRoomDto = { chatRoomId: 'room-1', customerId: 'me', customerName: 'Tên của tôi', customerAvatar: 'https://example.com/self.jpg', muaId: 'artist', muaName: 'Nguyễn Phương Uyên', muaAvatar: 'https://example.com/uyen.jpg', unreadCount: 2, createdAt: '2026-09-30T10:00:00Z' };
beforeEach(() => { jest.clearAllMocks(); jest.mocked(chatService.getRooms).mockResolvedValue([room]); });
it('uses the actual other participant even when a MUA account is a customer in this room', async () => {
  await render(<ChatListScreen viewer="mua" />);
  await waitFor(() => expect(screen.getByText('Nguyễn Phương Uyên')).toBeTruthy());
  expect(screen.getByLabelText('Ảnh đại diện của Nguyễn Phương Uyên').props.source.uri).toBe(room.muaAvatar);
  for (const label of ['Tất cả', 'Khách hàng', 'MUA', 'Hệ thống']) expect(screen.queryByText(label)).toBeNull();
  expect(screen.queryByText('Tên của tôi')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Mở cuộc trò chuyện với Nguyễn Phương Uyên' }));
  expect(mockPush).toHaveBeenCalledWith('/chat/room-1');
});
it('searches the API name and falls back to initials for failed avatar downloads', async () => {
  await render(<ChatListScreen viewer="customer" />);
  await waitFor(() => expect(screen.getByText('Nguyễn Phương Uyên')).toBeTruthy());
  await fireEvent(screen.getByLabelText('Ảnh đại diện của Nguyễn Phương Uyên'), 'error', { nativeEvent: { error: 'offline' } });
  expect(screen.getByText('N')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Tìm cuộc trò chuyện'), 'Uyên');
  expect(screen.getByText('Nguyễn Phương Uyên')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Tìm cuộc trò chuyện'), 'không tồn tại');
  expect(screen.getByText('Không tìm thấy cuộc trò chuyện')).toBeTruthy();
});
it('selects the customer when the signed-in user is the room artist and supports peer fields', () => {
  expect(getChatPeer(room, 'ARTIST')).toMatchObject({ name: 'Tên của tôi', avatar: room.customerAvatar, id: 'me' });
  expect(getChatPeer({ ...room, otherUserName: 'Tên từ API', otherUserAvatar: 'https://example.com/peer.jpg', otherUserId: 'artist' }, 'me')).toMatchObject({ name: 'Tên từ API', avatar: 'https://example.com/peer.jpg' });
  expect(getChatPeer({ ...room, muaName: ' ', muaAvatar: undefined }, 'me').name).toBe('Người dùng B-Book');
});
