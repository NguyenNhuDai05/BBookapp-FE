import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostActionSheet } from '../PostActionSheet';
import { OverlayProvider } from '../../ui/OverlayProvider';
import { DialogHost } from '../../ui/DialogHost';
import { dialogStore } from '../../ui/dialogStore';
import { moderationService } from '../../../services/moderationService';

jest.setTimeout(20000);
const mockInvalidate = jest.fn(async () => {});
let mockViewerId: string | undefined = 'viewer';
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mockInvalidate }) }));
jest.mock('../../../store/useAuthStore', () => ({ useAuthStore: (selector: any) => selector({ user: mockViewerId ? { id: mockViewerId } : undefined }) }));
jest.mock('../../../services/moderationService', () => ({ moderationService: { block: jest.fn() } }));
jest.mock('../../../services/api', () => ({ getApiError: (error: Error) => ({ message: error.message }) }));
jest.mock('../../moderation/ReportSheet', () => ({ ReportSheet: () => null }));
jest.mock('../../profile/ProfileShareSheet', () => ({ PostShareSheet: ({ postId }: any) => require('react').createElement(require('react-native').Text, null, `Share target: ${postId}`) }));
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } };
const Wrapper = ({ children }: React.PropsWithChildren) => <SafeAreaProvider initialMetrics={metrics}><OverlayProvider>{children}<DialogHost /></OverlayProvider></SafeAreaProvider>;
function FeedOptions() {
  const [post, setPost] = useState<{ authorId: string; authorName: string } | null>({ authorId: 'artist-id', authorName: 'Phạm Tuyết Nhi' });
  return <PostActionSheet visible={Boolean(post)} authorId={post?.authorId} authorName={post?.authorName} portfolioId="post-id" onClose={() => setPost(null)} />;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockViewerId = 'viewer';
  jest.mocked(moderationService.block).mockResolvedValue({ blocked: true });
  while (dialogStore.getSnapshot()) dialogStore.dismiss(dialogStore.getSnapshot()!.id);
});

it('keeps the selected MUA after the feed clears its selection and sends the block request', async () => {
  await render(<FeedOptions />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Chặn người dùng' }));
  expect(screen.getByText('Chặn Phạm Tuyết Nhi?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Chặn' }));
  await waitFor(() => expect(moderationService.block).toHaveBeenCalledWith('artist-id'));
  expect(mockInvalidate).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Đã chặn')).toBeTruthy();
});
it('keeps the exact post selected for sharing after closing the feed options', async () => {
  await render(<FeedOptions />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Chia sẻ bài viết' }));
  expect(screen.getByText('Share target: post-id')).toBeTruthy();
  expect(moderationService.block).not.toHaveBeenCalled();
});
it.each(['artist-id', undefined])('keeps sharing available to self/guest %s without exposing block actions', async viewer => {
  mockViewerId = viewer; await render(<FeedOptions />, { wrapper: Wrapper });
  expect(screen.getByRole('button', { name: 'Chia sẻ bài viết' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Chặn người dùng' })).toBeNull();
});

it('keeps a failed confirmation retryable with the original target and displays the server error', async () => {
  jest.mocked(moderationService.block).mockRejectedValueOnce(new Error('Không thể chặn lúc này.'));
  await render(<FeedOptions />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Chặn người dùng' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Chặn' }));
  expect(screen.getByText('Không thể chặn lúc này.')).toBeTruthy();
  expect(mockInvalidate).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Đã hiểu' }));
  expect(screen.getByText('Chặn Phạm Tuyết Nhi?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Chặn' }));
  expect(moderationService.block).toHaveBeenNthCalledWith(2, 'artist-id');
  expect(screen.getByText('Đã chặn')).toBeTruthy();
});

it('does not send a block request when the confirmation is cancelled', async () => {
  await render(<FeedOptions />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Chặn người dùng' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Hủy' }));
  expect(moderationService.block).not.toHaveBeenCalled();
  expect(mockInvalidate).not.toHaveBeenCalled();
});

it('sends only one request while blocking and prevents cancellation until it finishes', async () => {
  let finish!: (value: unknown) => void;
  jest.mocked(moderationService.block).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await render(<FeedOptions />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Chặn người dùng' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Chặn' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Đang chặn…' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Hủy' }));
  expect(moderationService.block).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Chặn Phạm Tuyết Nhi?')).toBeTruthy();
  await act(async () => { finish({ blocked: true }); });
  await screen.findByText('Đã chặn');
});
