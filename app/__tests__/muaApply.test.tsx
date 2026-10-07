import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import MuaApplyScreen from '../mua-onboarding/apply';
const mockSubmit = jest.fn().mockResolvedValue({});

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn() }) }));
jest.mock('../../components/location/LocationPicker', () => ({ LocationPicker: () => null }));
jest.mock('../../services/locationService', () => ({ locationService: { catalog: jest.fn().mockResolvedValue(require('../../data/operatingAreas.json')) }, getCurrentLocationCandidate: jest.fn().mockResolvedValue({ latitude: 10.7, longitude: 106, accuracyQuality: 'normal', quality: 'area', source: 'gps', formattedAddress: 'Phường Bến Thành, TP.HCM' }) }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn(), getCurrentPositionAsync: jest.fn(), reverseGeocodeAsync: jest.fn(), Accuracy: { Balanced: 3 } }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector: any) => selector({ user: { name: 'Hoàng', email: 'hoang@example.com', avatarUrl: 'https://example.com/avatar.jpg' } }) }));
jest.mock('../../hooks/useMuaOnboarding', () => ({ useSubmitApplication: () => ({ mutateAsync: mockSubmit, isPending: false }) }));
jest.mock('../../hooks/useMuaStyles', () => ({ MUA_STYLES_QUERY_KEY: ['mua-styles'], useMuaStyles: () => ({ data: [1, 2, 3, 4, 5, 6].map(id => ({ styleId: id, name: `Style ${id}`, isActive: true })), isLoading: false, refetch: jest.fn() }) }));
jest.mock('../../services/supabase', () => ({ uploadImage: jest.fn().mockImplementation(async (uri: string) => uri) }));
jest.mock('../../services/muaStyleService', () => ({ muaStyleService: { selectOrCreate: jest.fn() } }));
jest.mock('../../services/api', () => ({ getApiError: () => ({ message: 'Lỗi' }) }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
jest.mock('../../components/ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: any) => visible ? children : null }));

const Wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}>{children}</QueryClientProvider>;

it('prefills Customer identity, keeps email read-only and does not request GPS on mount', async () => {
  await render(<MuaApplyScreen />, { wrapper: Wrapper });
  expect(screen.getByDisplayValue('Hoàng')).toBeTruthy();
  expect(screen.getByDisplayValue('hoang@example.com').props.editable).toBe(false);
  expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  const bio = screen.getByPlaceholderText('Chia sẻ ngắn về kinh nghiệm, phong cách và thế mạnh makeup của bạn...');
  expect(bio.props.maxLength).toBe(500);
  await fireEvent.changeText(bio, 'Giới thiệu');
  expect(screen.getByText('10/500')).toBeTruthy();
});

it('changes the operating district options when a province is selected', async () => {
  await render(<MuaApplyScreen />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: /Chọn tỉnh \/ thành phố/ }));
  await fireEvent.press(screen.getByText('Thành phố Hồ Chí Minh'));
  await fireEvent.press(screen.getByText('Chọn quận / huyện'));
  await fireEvent.press(screen.getByRole('checkbox', { name: /Quận Bình Thạnh/ }));
  await fireEvent.press(screen.getByRole('checkbox', { name: /Quận Gò Vấp/ }));
  expect(screen.getByRole('checkbox', { name: /Quận Bình Thạnh/ }).props.accessibilityState.checked).toBe(true);
  expect(screen.getByRole('checkbox', { name: /Quận Gò Vấp/ }).props.accessibilityState.checked).toBe(true);
  await fireEvent.press(screen.getByText('Xong'));
  expect(screen.getByText('Chọn thêm khu vực (2)')).toBeTruthy();
});

it('shows only a few suggestions initially and prevents choosing a sixth style', async () => {
  await render(<MuaApplyScreen />, { wrapper: Wrapper });
  expect(screen.queryByText('Style 6')).toBeNull();
  await fireEvent.press(screen.getByText('Thêm phong cách'));
  for (let id = 1; id <= 5; id++) {
    await fireEvent.press(screen.getAllByRole('button', { name: `Style ${id}` }).at(-1)!);
  }
  expect(screen.getAllByText('Đã chọn 5/5')).toHaveLength(2);
  expect(screen.getAllByRole('button', { name: 'Style 6' }).every(button => button.props.accessibilityState.disabled)).toBe(true);
});

it('creates a new MUA with a confirmed private GPS point and no workplace fields', async () => {
  mockSubmit.mockClear();
  await render(<MuaApplyScreen />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: /Chọn tỉnh \/ thành phố/ }));
  await fireEvent.press(screen.getByText('Thành phố Hồ Chí Minh'));
  await fireEvent.press(screen.getByText('Chọn quận / huyện'));
  await fireEvent.press(screen.getByRole('checkbox', { name: /Quận Bình Thạnh/ })); await fireEvent.press(screen.getByText('Xong'));
  await fireEvent.press(screen.getByRole('button', { name: 'Style 1' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Chọn vị trí hoạt động' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sử dụng vị trí hiện tại' }));
  await screen.findByText('Phường Bến Thành, TP.HCM');
  expect(mockSubmit).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Xác nhận vị trí' }));
  await fireEvent.press(screen.getByText('Tạo hồ sơ MUA'));
  expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({ latitude: 10.7, longitude: 106, operatingLocationConfirmed: true, operatingLocationLabel: 'Phường Bến Thành, TP.HCM' }));
  const payload = mockSubmit.mock.calls[0][0];
  for (const field of ['workLocationName', 'workLocationAddress', 'allowCustomerVisit', 'clearWorkLocation']) expect(Object.hasOwn(payload, field)).toBe(false);
});
