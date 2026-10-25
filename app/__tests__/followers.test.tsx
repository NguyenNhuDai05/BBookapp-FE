import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import FollowersScreen from '../followers';
const mockPush = jest.fn();
let mockSearch = '';
let mockPage: any;
const mockNext = jest.fn();
const mockRefresh = jest.fn(async () => {});
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector: any) => selector({ user: { id: 'owner' } }) }));
jest.mock('../../components/profile/ProfileShareSheet', () => ({ ProfileShareSheet: () => null }));
jest.mock('../../hooks/useFollowers', () => ({ useFollowerSummary: () => ({ data: { followersCount: 2 }, refetch: mockRefresh }), useFollowers: (search: string) => { mockSearch = search; return mockPage; } }));
beforeEach(() => { jest.clearAllMocks(); mockPage = { isRefetching: false, data: { pages: [{ totalCount: 2 }] }, items: [{ userId: 'customer', name: 'Khách hàng' }, { userId: 'artist', name: 'Chuyên gia', publicMuaId: 'artist' }], refetch: mockRefresh, fetchNextPage: mockNext }; });
it('lists customer names without inventing private customer routes and only opens a public MUA', async () => {
  await render(<FollowersScreen />);
  expect(screen.getByText('Khách hàng')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Hồ sơ Khách hàng' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Hồ sơ Chuyên gia' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/mua-detail', params: { id: 'artist' } });
  await fireEvent.changeText(screen.getByLabelText('Tìm người theo dõi'), 'My'); expect(mockSearch).toBe('My');
});
it('offers retry on an initial failure without claiming there are no followers', async () => {
  mockPage = { ...mockPage, isError: true, data: undefined, items: [] };
  await render(<FollowersScreen />);
  expect(screen.getByText('Chưa tải được danh sách người theo dõi.')).toBeTruthy();
  expect(screen.queryByText(/Bạn chưa có người theo dõi/)).toBeNull();
  await fireEvent.press(screen.getByText('Thử lại')); expect(mockRefresh).toHaveBeenCalled();
});
it('offers profile sharing when the server confirms an empty follower list', async () => {
  mockPage = { ...mockPage, data: { pages: [{ totalCount: 0 }] }, items: [] };
  await render(<FollowersScreen />);
  expect(screen.getByText('0 người theo dõi')).toBeTruthy(); expect(screen.getByText('Chia sẻ hồ sơ')).toBeTruthy();
});
