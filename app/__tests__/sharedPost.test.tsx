import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SharedPostScreen from '../shared-post';
import { profileSharingService } from '../../services/profileSharingService';
const mockPush = jest.fn(); let mockId: string; let mockViewer: string | undefined;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: mockId }), useRouter: () => ({ push: mockPush, canGoBack: () => false, replace: jest.fn() }), useFocusEffect: () => {} }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector: any) => selector({ user: mockViewer ? { id: mockViewer } : undefined }) }));
jest.mock('../../services/profileSharingService', () => ({ profileSharingService: { getPost: jest.fn() } }));
jest.mock('../../services/api', () => ({ getApiError: (error: any) => ({ status: error?.status }) }));
jest.mock('../../components/feed/PostActionSheet', () => ({ PostActionSheet: () => null }));
let client: QueryClient;
const post = { id: '10000000-0000-0000-0000-000000000002', muaId: '10000000-0000-0000-0000-000000000001', name: 'Phạm Tuyết Nhi', title: 'Makeup kỉ yếu', description: 'Mô tả của đúng bài viết', createdAt: '', images: ['https://media.test/one.jpg', 'https://media.test/two.jpg'], tags: [], url: '', qrSvg: '' };
const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
beforeEach(() => { jest.clearAllMocks(); mockId = post.id; mockViewer = undefined; client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); jest.mocked(profileSharingService.getPost).mockResolvedValue(post); });
afterEach(() => client.clear());
it.each([undefined, 'customer'])('opens the exact post for viewer %s and links to its server-resolved owner', async viewer => {
  mockViewer = viewer; await render(<SharedPostScreen />, { wrapper }); await screen.findByText(post.title);
  expect(profileSharingService.getPost).toHaveBeenCalledWith(post.id, expect.anything()); expect(screen.getByText(post.description)).toBeTruthy();
  expect(screen.getByLabelText('Ảnh tác phẩm 2')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Xem hồ sơ chuyên gia' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/mua-detail', params: { id: post.muaId } });
});
it('hides cached content when the server no longer permits the post', async () => {
  client.setQueryData(['shared-post', 'guest', post.id], post); jest.mocked(profileSharingService.getPost).mockRejectedValue({ status: 404 });
  await render(<SharedPostScreen />, { wrapper }); await screen.findByText('Bài viết không còn khả dụng'); expect(screen.queryByText(post.description)).toBeNull();
});
it('does not request a malformed post ID', async () => {
  mockId = 'invalid'; await render(<SharedPostScreen />, { wrapper }); expect(profileSharingService.getPost).not.toHaveBeenCalled(); expect(screen.getByText('Bài viết không còn khả dụng')).toBeTruthy();
});
it('distinguishes a temporary network failure from a hidden or deleted post', async () => {
  jest.mocked(profileSharingService.getPost).mockRejectedValue({ status: 503 });
  await render(<SharedPostScreen />, { wrapper }); await screen.findByText('Chưa tải được bài viết');
  expect(screen.getByText('Vui lòng kiểm tra kết nối và thử lại.')).toBeTruthy(); expect(screen.queryByText('Bài viết có thể đã được ẩn, xóa hoặc chưa công khai.')).toBeNull();
});
