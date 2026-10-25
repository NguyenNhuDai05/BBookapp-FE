import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Management from '../(mua)/services';
import PortfolioFeed from '../(mua)/manage-portfolio';
import { portfolioFixture } from '../../test-utils/portfolioFixture';

let mockTab = 'PORTFOLIO';
let mockItem = portfolioFixture();
const mockUpdate = jest.fn();
const mockCreate = jest.fn();
const mockVisibility = jest.fn();
const mockActive = jest.fn();
const mockState = { user: { id: 'artist', isDemoAccount: false } };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ tab: mockTab }), useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('expo-image', () => ({ Image: jest.requireActual('react-native').Image }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector: any) => selector(mockState) }));
jest.mock('../../hooks/useMuaProfile', () => ({ useMuaProfile: () => ({ data: { specialties: [] } }) }));
jest.mock('../../hooks/useMuaEligibility', () => ({ useMuaEligibility: () => ({ data: { requirements: [] } }) }));
jest.mock('../../hooks/useMuaPortfolio', () => ({ useMuaPortfolio: () => ({ data: [mockItem], updateItem: mockUpdate, createItem: mockCreate, setVisibility: mockVisibility }) }));
jest.mock('../../hooks/useMuaServices', () => ({
  useMuaServices: () => ({ data: [{ id: 's1', name: 'Makeup', status: 'ACTIVE', price: 100, durationMinutes: 60 }] }),
  useCreateService: () => ({}), useUpdateService: () => ({}), useDeleteService: () => ({}),
  useSetServiceActive: () => ({ mutate: mockActive }),
}));
jest.mock('../../components/mua/services/ServiceFormModal', () => ({ ServiceFormModal: () => null }));
jest.mock('../../components/mua/portfolio/PortfolioFormModal', () => ({ PortfolioFormModal: ({ visible, initialData, onSubmit }: any) => {
  const { Text, TouchableOpacity } = jest.requireActual('react-native');
  return visible ? <TouchableOpacity accessibilityLabel="Lưu tác phẩm" onPress={() => onSubmit({ description: 'Đã sửa' })}><Text>{initialData?.id || 'Bài mới'}</Text></TouchableOpacity> : null;
} }));
jest.mock('../../components/feed/FollowPortfolioPost', () => ({ FollowPortfolioPost: ({ onOptions }: any) => {
  const { Text, TouchableOpacity } = jest.requireActual('react-native');
  return <TouchableOpacity onPress={onOptions}><Text>Tùy chọn</Text></TouchableOpacity>;
} }));
jest.mock('../../components/ui/ActionSheet', () => ({ ActionSheet: ({ visible, actions }: any) => {
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  return visible ? <View>{actions.map((a: any) => <TouchableOpacity key={a.id} onPress={a.onPress}><Text>{a.label}</Text></TouchableOpacity>)}</View> : null;
} }));
jest.mock('../../components/common/ConfirmDialog', () => ({ ConfirmDialog: () => null }));
jest.mock('../../components/feed/PortfolioCommentsSheet', () => ({ PortfolioCommentsSheet: () => null }));
jest.mock('../../services/api', () => ({ getApiError: (e: Error) => ({ message: e.message }) }));
beforeEach(() => { jest.clearAllMocks(); mockTab = 'PORTFOLIO'; mockItem = portfolioFixture(); mockUpdate.mockResolvedValue(undefined); mockVisibility.mockResolvedValue(undefined); });

it('opens the selected grid item in the editor and updates it instead of creating a new post', async () => {
  await render(<Management />);
  await fireEvent.press(screen.getByLabelText('Chỉnh sửa tác phẩm'));
  expect(screen.getByText('p1')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Lưu tác phẩm'));
  await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ id: 'p1', updates: { description: 'Đã sửa' } }));
  expect(mockCreate).not.toHaveBeenCalled();
});
it.each([false, true])('uses the same hide/reactivate API from the grid and post options (hidden=%s)', async isHidden => {
  mockItem = { ...mockItem, isHidden };
  const label = isHidden ? 'Kích hoạt lại tác phẩm' : 'Tạm ẩn tác phẩm';
  const grid = await render(<Management />);
  await fireEvent.press(screen.getByLabelText(label));
  expect(mockVisibility).toHaveBeenCalledWith({ itemId: 'p1', isHidden: !isHidden });
  await grid.unmount(); mockVisibility.mockClear();
  await render(<PortfolioFeed />);
  await fireEvent.press(screen.getByText('Tùy chọn'));
  await fireEvent.press(screen.getByText(label));
  expect(mockVisibility).toHaveBeenCalledWith({ itemId: 'p1', isHidden: !isHidden });
});
it('temporarily hides an active service through its status endpoint', async () => {
  mockTab = 'SERVICES';
  await render(<Management />);
  await fireEvent.press(screen.getByText('Tạm ẩn'));
  expect(mockActive).toHaveBeenCalledWith({ serviceId: 's1', isActive: false }, expect.any(Object));
});
