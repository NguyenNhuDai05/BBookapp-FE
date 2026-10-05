import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import EditProfile from '../(mua)/edit-profile';

const mockReplace = jest.fn();
const mockSave = jest.fn();
const mockUpdateUser = jest.fn();
const mockUpload = jest.fn();
let mockProfile = { id: 'mua-id', name: 'MUA', avatarUrl: 'https://example.com/old.jpg', bio: 'Tiểu sử cũ', phoneNumber: '0123456789', city: 'Hà Nội', operatingAreaIds: ['area'], experienceYears: 2 };
const mockState = { user: { id: 'mua-id', name: 'MUA' }, updateUser: mockUpdateUser };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('expo-image-picker', () => ({ MediaTypeOptions: { Images: 'Images' }, requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: async () => ({ canceled: false, assets: [{ uri: 'file:///new.jpg' }] }) }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector?: (state: typeof mockState) => unknown) => selector ? selector(mockState) : mockState }));
jest.mock('../../hooks/useMuaProfile', () => ({ useMuaProfile: () => ({ data: mockProfile, isLoading: false }), useUpdateMuaProfile: () => ({ mutateAsync: mockSave, isPending: false }) }));
jest.mock('../../hooks/useMuaStyles', () => ({ useMuaStyles: () => ({ data: [] }) }));
jest.mock('../../components/mua/OperatingAreaFields', () => ({ OperatingAreaFields: () => null }));
jest.mock('../../services/supabase', () => ({ uploadImage: (...args: unknown[]) => mockUpload(...args) }));
jest.mock('../../services/api', () => ({ getApiError: (error: Error) => ({ message: error.message }) }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
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
