import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import EditProfile from '../(mua)/edit-profile';
import type { MuaProfileDto } from '../../types/muaProfile';
import type { OperatingArea } from '../../types/location';

const mockReplace = jest.fn();
const mockSave = jest.fn();
const mockUpdateUser = jest.fn();
const mockUpload = jest.fn();
let mockProfile: MuaProfileDto = { id: 'mua-id', name: 'MUA', avatarUrl: 'https://example.com/old.jpg', bio: 'Tiểu sử cũ', phoneNumber: '0123456789', city: 'Hà Nội', operatingAreaIds: ['area'], experienceYears: 2, verificationStatus: 'DRAFT' };
let mockAreaChange: Partial<OperatingArea> = {};
const mockState = { user: { id: 'mua-id', name: 'MUA' }, updateUser: mockUpdateUser };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('expo-image-picker', () => ({ MediaTypeOptions: { Images: 'Images' }, requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: async () => ({ canceled: false, assets: [{ uri: 'file:///new.jpg' }] }) }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector?: (state: typeof mockState) => unknown) => selector ? selector(mockState) : mockState }));
jest.mock('../../hooks/useMuaProfile', () => ({ useMuaProfile: () => ({ data: mockProfile, isLoading: false }), useUpdateMuaProfile: () => ({ mutateAsync: mockSave, isPending: false }) }));
jest.mock('../../hooks/useMuaStyles', () => ({ useMuaStyles: () => ({ data: [] }) }));
jest.mock('../../components/mua/OperatingAreaFields', () => ({ OperatingAreaFields: ({ value, onChange }: any) => {
  const React = jest.requireActual('react'); const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return React.createElement(TouchableOpacity, { accessibilityLabel: 'Test location change', onPress: () => onChange({ ...value, ...mockAreaChange }) }, React.createElement(Text, null, 'Change location'));
} }));
jest.mock('../../services/supabase', () => ({ uploadImage: (...args: unknown[]) => mockUpload(...args) }));
jest.mock('../../services/api', () => ({ getApiError: (error: Error & { code?: string }) => ({ message: error.message, code: error.code }) }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockAreaChange = {};
  mockProfile = { id: 'mua-id', name: 'MUA', avatarUrl: 'https://example.com/old.jpg', bio: 'Tiểu sử cũ', phoneNumber: '0123456789', city: 'Hà Nội', operatingAreaIds: ['area'], experienceYears: 2, verificationStatus: 'DRAFT' };
  mockSave.mockResolvedValue(undefined);
  mockUpload.mockResolvedValue('https://example.com/new.jpg');
});

it('saves the new avatar and edited bio without the original profile overwriting them, then returns to Profile', async () => {
  await render(<EditProfile />);
  await waitFor(() => expect(screen.getByDisplayValue('Tiểu sử cũ')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('Thay đổi ảnh đại diện'));
  await fireEvent.changeText(screen.getByDisplayValue('Tiểu sử cũ'), 'Tiểu sử mới');
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  await waitFor(() => expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: 'https://example.com/new.jpg', bio: 'Tiểu sử mới', operatingAreaIds: ['area'] })));
  expect(mockUpload).toHaveBeenCalledWith('file:///new.jpg');
  expect(mockUpdateUser).toHaveBeenCalledWith({ name: 'MUA', avatarUrl: 'https://example.com/new.jpg' });
  expect(mockReplace).toHaveBeenCalledWith('/(mua)/profile');
});

it('preserves unsaved edits when profile data refreshes', async () => {
  const view = await render(<EditProfile />);
  await waitFor(() => expect(screen.getByDisplayValue('Tiểu sử cũ')).toBeTruthy());
  await fireEvent.changeText(screen.getByDisplayValue('Tiểu sử cũ'), 'Bản nháp');
  mockProfile = { ...mockProfile };
  await view.rerender(<EditProfile />);
  expect(screen.getByDisplayValue('Bản nháp')).toBeTruthy();
});

it('keeps the editor open and shows the API error if saving fails', async () => {
  mockSave.mockRejectedValueOnce(new Error('Ảnh không hợp lệ.'));
  await render(<EditProfile />);
  await waitFor(() => expect(screen.getByDisplayValue('Tiểu sử cũ')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('Thay đổi ảnh đại diện'));
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  await waitFor(() => expect(screen.getByText('Ảnh không hợp lệ.')).toBeTruthy());
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockUpdateUser).not.toHaveBeenCalled();
});

it('confirmation alone of a legacy point enables save and preserves the operating branch', async () => {
  mockProfile = { ...mockProfile, latitude: 10.7, longitude: 106, operatingLocationConfirmed: false };
  mockAreaChange = { operatingLocationConfirmed: true };
  await render(<EditProfile />); await waitFor(() => expect(screen.getByDisplayValue('Tiểu sử cũ')).toBeTruthy());
  expect(screen.getByLabelText('Lưu thay đổi').props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByLabelText('Test location change'));
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  await waitFor(() => expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ latitude: 10.7, longitude: 106, operatingLocationConfirmed: true })));
});
it('a partial workplace update error keeps the confirmed candidate and never navigates as success', async () => {
  mockProfile = { ...mockProfile, workLocationAddress: 'Old workplace', allowCustomerVisit: true, latitude: 20, longitude: 100, operatingLocationConfirmed: true };
  mockAreaChange = { workLocationAddress: undefined, allowCustomerVisit: false, latitude: 10.7, longitude: 106, clearWorkLocation: true };
  mockSave.mockRejectedValueOnce(new Error('Đã xóa địa điểm tiếp khách nhưng chưa lưu vị trí mới. Vui lòng bấm Lưu để thử lại.'));
  await render(<EditProfile />); await waitFor(() => expect(screen.getByDisplayValue('Tiểu sử cũ')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('Test location change')); await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  await screen.findByText(/chưa lưu vị trí mới/); expect(mockReplace).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi')); await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(mua)/profile'));
  expect(mockSave).toHaveBeenLastCalledWith(expect.objectContaining({ latitude: 10.7, longitude: 106, clearWorkLocation: true }));
});

it('keeps inactive specialty history while saving a new draft name in the final profile request', async () => {
  mockProfile = { ...mockProfile, specialties: [{ styleId: 9, name: 'Phong cách cũ', isActive: false }] };
  await render(<EditProfile />);
  await screen.findByText('Phong cách cũ · Ngừng sử dụng ×');
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), 'Makeup mới');
  await fireEvent.press(screen.getByText('Thêm “Makeup mới”'));
  expect(mockSave).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ styleIds: [9], newStyleNames: ['Makeup mới'] }));
});

it('shows the services blocking removal and preserves the unsaved selection on 409', async () => {
  mockProfile = { ...mockProfile, specialties: [{ styleId: 1, name: 'Style 1', isActive: true }, { styleId: 2, name: 'Style 2', isActive: true }] };
  mockSave.mockRejectedValueOnce(Object.assign(new Error('In use'), { isAxiosError: true, code: 'STYLE_IN_USE', response: { data: { services: [{ serviceId: 's', serviceName: 'Cô dâu' }] } } }));
  await render(<EditProfile />);
  await screen.findByLabelText('Bỏ Style 1');
  await fireEvent.press(screen.getByLabelText('Bỏ Style 1'));
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  await screen.findByText(/Hãy bỏ phong cách khỏi các dịch vụ trước: Cô dâu/);
  expect(mockReplace).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Bỏ Style 2')).toBeTruthy();
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ styleIds: [2] }));
});
