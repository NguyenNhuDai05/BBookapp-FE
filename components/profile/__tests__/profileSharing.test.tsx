import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ProfileShareSheet, PostShareSheet } from '../ProfileShareSheet';
import { FollowersBadge } from '../FollowersBadge';
import { profileSharingService } from '../../../services/profileSharingService';
jest.mock('../../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: any) => visible ? children : null }));
jest.mock('../../../store/useAuthStore', () => ({ useAuthStore: (selector: any) => selector({ user: { id: 'viewer' } }) }));
jest.mock('../../../services/profileSharingService', () => ({ profileSharingService: { get: jest.fn(), getPost: jest.fn() } }));
jest.mock('../../../services/api', () => ({ getApiError: (e: any) => ({ status: e.status, message: e.message }) }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
const profile = { muaId: 'artist', name: 'Lý Huỳnh My', city: 'Hà Nội', url: 'https://beautybook-v3bi.onrender.com/mua/artist', qrSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><rect width="2" height="2"/></svg>' };
let client: QueryClient;
beforeEach(() => { jest.clearAllMocks(); client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); jest.mocked(profileSharingService.get).mockResolvedValue(profile); jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction }); });
afterEach(() => { client.clear(); jest.restoreAllMocks(); });
const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
it('shares and copies the same canonical URL and shows QR only when requested', async () => {
  await render(<ProfileShareSheet visible muaId="artist" onClose={jest.fn()} />, { wrapper });
  await screen.findByText('Lý Huỳnh My');
  await fireEvent.press(screen.getByRole('button', { name: 'Chia sẻ liên kết hồ sơ' }));
  expect(Share.share).toHaveBeenCalledWith({ message: expect.stringContaining(profile.url) }, expect.any(Object));
  expect(screen.queryByText('Đã chia sẻ')).toBeNull();
  await fireEvent.press(screen.getByText('Sao chép liên kết'));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(profile.url);
  expect(screen.getByText('Đã sao chép liên kết')).toBeTruthy();
  await fireEvent.press(screen.getByText('Mã QR hồ sơ'));
  expect(screen.getByLabelText('Mã QR mở hồ sơ BBook')).toBeTruthy();
});
it('shares, copies and displays QR for the exact post rather than its author profile', async () => {
  const post = { ...profile, id: 'post', images: [], tags: [], createdAt: '', url: 'https://bbookmakeup.com/posts/10000000-0000-0000-0000-000000000002' };
  jest.mocked(profileSharingService.getPost).mockResolvedValue(post);
  await render(<PostShareSheet visible postId="post" onClose={jest.fn()} />, { wrapper }); await screen.findByText('Lý Huỳnh My');
  expect(profileSharingService.getPost).toHaveBeenCalledWith('post', expect.anything()); expect(profileSharingService.get).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Chia sẻ liên kết bài viết' }));
  expect(Share.share).toHaveBeenCalledWith({ message: `Xem bài viết của ${post.name} trên BBook: ${post.url}` }, expect.anything());
  await fireEvent.press(screen.getByText('Sao chép liên kết')); expect(Clipboard.setStringAsync).toHaveBeenCalledWith(post.url);
  await fireEvent.press(screen.getByText('Mã QR bài viết')); expect(screen.getByLabelText('Mã QR mở bài viết BBook')).toBeTruthy();
});
it('refuses stale sharing when a post was hidden or removed', async () => {
  client.setQueryData(['post-share', 'viewer', 'post'], { ...profile, id: 'post' });
  jest.mocked(profileSharingService.getPost).mockRejectedValue({ status: 404 });
  await render(<PostShareSheet visible postId="post" onClose={jest.fn()} />, { wrapper });
  await screen.findByText('Bài viết chưa công khai hoặc chưa sẵn sàng để chia sẻ.');
  expect(screen.queryByText('Sao chép liên kết')).toBeNull(); expect(Share.share).not.toHaveBeenCalled();
});
it('does not show stale share actions when a previously public profile becomes unavailable', async () => {
  client.setQueryData(['profile-share', 'viewer', 'artist'], profile);
  jest.mocked(profileSharingService.get).mockRejectedValue({ status: 404 });
  await render(<ProfileShareSheet visible muaId="artist" onClose={jest.fn()} />, { wrapper });
  await screen.findByText('Hồ sơ chưa công khai hoặc chưa sẵn sàng để chia sẻ.');
  expect(screen.queryByText('Sao chép liên kết')).toBeNull();
  expect(Share.share).not.toHaveBeenCalled();
});
it('does not fetch or share when the sheet is closed', async () => {
  await render(<ProfileShareSheet visible={false} muaId="artist" onClose={jest.fn()} />, { wrapper });
  expect(profileSharingService.get).not.toHaveBeenCalled();
});
it('displays zero only when it is a real count and makes the owner badge open the list', async () => {
  const press = jest.fn(); const view = await render(<FollowersBadge loading onPress={press} />);
  expect(screen.queryByText('0')).toBeNull();
  await view.rerender(<FollowersBadge error onRetry={press} />); expect(screen.queryByText('0')).toBeNull();
  await view.rerender(<FollowersBadge count={0} onPress={press} />);
  await fireEvent.press(screen.getByRole('button', { name: '0 người theo dõi. Xem danh sách' })); expect(press).toHaveBeenCalledTimes(1);
});
it('shows share failure with copy fallback without claiming success', async () => {
  jest.mocked(Share.share).mockRejectedValue(new Error('no activity'));
  await render(<ProfileShareSheet visible muaId="artist" onClose={jest.fn()} />, { wrapper }); await screen.findByText('Lý Huỳnh My');
  await fireEvent.press(screen.getByRole('button', { name: 'Chia sẻ liên kết hồ sơ' }));
  expect(screen.getByText('Chưa thể mở chia sẻ. Bạn có thể sao chép liên kết.')).toBeTruthy();
});
