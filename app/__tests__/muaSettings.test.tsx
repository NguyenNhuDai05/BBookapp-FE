import React from 'react';
import { render, screen } from '@testing-library/react-native';
import Settings from '../(mua)/settings';
import type { MuaProfileDto } from '../../types/muaProfile';

const mockRefetch = jest.fn();
const mockCache = { invalidateQueries: jest.fn() };
const mockUser = { name: 'MUA', email: 'nguyenhuynhhoang060305@gmail.com', avatarUrl: 'https://example.com/old.jpg' };
let mockProfile: MuaProfileDto;
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }), useFocusEffect: (callback: () => void) => { const React = jest.requireActual<typeof import('react')>('react'); React.useEffect(callback, [callback]); } }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => mockCache }));
jest.mock('../../hooks/useMuaEligibility', () => ({ MUA_ELIGIBILITY_QUERY_KEY: ['mua', 'eligibility'] }));
jest.mock('../../hooks/useMuaProfile', () => ({ useMuaProfile: () => ({ data: mockProfile, isLoading: false, isRefetching: false, refetch: mockRefetch }) }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: () => ({ user: mockUser }) }));
jest.mock('../../hooks/useAppMode', () => ({ useAppMode: () => ({ selectMode: jest.fn() }) }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
jest.mock('../../services/api', () => ({ getApiError: () => ({ message: '' }) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockProfile = { id: 'mua-1', name: 'MUA', avatarUrl: 'https://example.com/new.jpg', verificationStatus: 'PENDINGREVIEW', profileStatus: 'DRAFT', reviewCount: 3, rating: 4.2 };
});

it('shows the actual avatar and metrics, a single-line email, and bronze rank', async () => {
  await render(<Settings />);
  expect(screen.getByLabelText('Ảnh đại diện MUA').props.source).toEqual([{ uri: mockProfile.avatarUrl }]);
  expect(screen.getByText(mockUser.email).props.numberOfLines).toBe(1);
  expect(screen.getByText(mockUser.email).props.ellipsizeMode).toBe('middle');
  expect(screen.getByText('Đồng')).toBeTruthy();
  expect(screen.getByText('3')).toBeTruthy();
  expect(screen.getByText('4.2')).toBeTruthy();
  expect(screen.queryByText('VIP')).toBeNull();
  expect(mockRefetch).toHaveBeenCalled();
  expect(mockCache.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['mua', 'eligibility'] });
});

it('shows approval after refreshed profile data even while the listing remains Draft', async () => {
  const view = await render(<Settings />);
  expect(screen.getByText('Đang chờ duyệt')).toBeTruthy();
  mockProfile = { ...mockProfile, verificationStatus: 'APPROVED' };
  await view.rerender(<Settings />);
  expect(screen.getByText('Đã xác minh')).toBeTruthy();
  expect(screen.getByText('Hồ sơ chưa công khai')).toBeTruthy();
  expect(screen.queryByText('Đang chờ duyệt')).toBeNull();
  mockProfile = { ...mockProfile, profileStatus: 'LISTED' };
  await view.rerender(<Settings />);
  expect(screen.getByText('Đang hiển thị trên BBook')).toBeTruthy();
});
