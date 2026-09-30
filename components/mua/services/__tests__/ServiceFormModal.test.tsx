import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OverlayProvider } from '../../../ui/OverlayProvider';
import { ServiceFormModal } from '../ServiceFormModal';
import { uploadImage } from '../../../../services/supabase';
import * as ImagePicker from 'expo-image-picker';

jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('../../../../services/supabase', () => ({ uploadImage: jest.fn(async (uri: string) => uri) }));
jest.mock('../../../../services/api', () => ({ getApiError: () => ({ message: 'Không thể lưu' }) }));
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } };
const Wrapper = ({ children }: React.PropsWithChildren) => <SafeAreaProvider initialMetrics={metrics}><OverlayProvider>{children}</OverlayProvider></SafeAreaProvider>;
beforeEach(() => jest.clearAllMocks());

it('keeps input contents and focus through updates without showing validation errors on blur', async () => {
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} />, { wrapper: Wrapper });
  const input = screen.getByLabelText('Tên dịch vụ');
  await fireEvent(input, 'focus');
  await fireEvent.changeText(input, 'Cô dâu');
  await fireEvent(input, 'blur');
  expect(screen.getByDisplayValue('Cô dâu')).toBeTruthy();
  expect(screen.getByText('6/100')).toBeTruthy();
  expect(screen.queryByText('Vui lòng nhập tên dịch vụ.')).toBeNull();
  expect(screen.queryByText('Danh mục')).toBeNull();
});

it('saves all illustration images and the visibility setting', async () => {
  const save = jest.fn(); const close = jest.fn();
  await render(<ServiceFormModal visible onClose={close} onSubmit={save} initialData={{ name: 'Cô dâu', description: 'Trang điểm cô dâu', price: 1500000, durationMinutes: 180, imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'], visibility: false }} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  expect(uploadImage).toHaveBeenCalledTimes(2);
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'], imageUrl: 'https://example.com/1.jpg', isActive: false }));
  expect(close).toHaveBeenCalledTimes(1);
});

it('selects multiple photos but caps the gallery at five', async () => {
  jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as any);
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: Array.from({ length: 6 }, (_, index) => ({ uri: `file://${index}.jpg` })) } as any);
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByText('Chọn ảnh'));
  expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsMultipleSelection: true, selectionLimit: 5 }));
  expect(screen.getByText('5/5 ảnh')).toBeTruthy();
  expect(screen.queryByLabelText('Thêm ảnh minh họa')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Xóa ảnh 1'));
  expect(screen.getByText('4/5 ảnh')).toBeTruthy();
});
