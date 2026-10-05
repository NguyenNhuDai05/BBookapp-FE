import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OverlayProvider } from '../../../ui/OverlayProvider';
import { PortfolioFormModal } from '../PortfolioFormModal';
import { uploadImage } from '../../../../services/supabase';

jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: async () => ({ canceled: false, assets: [{ uri: 'file:///new.jpg' }] }) }));
jest.mock('../../../../services/supabase', () => ({ uploadImage: jest.fn(async (uri: string) => uri) }));
jest.mock('../../../../services/api', () => ({ getApiError: () => ({ message: 'Không thể lưu' }) }));
jest.mock('../../../../hooks/useMuaServices', () => ({ useMuaServices: () => ({ data: [] }) }));
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } };
const Wrapper = ({ children }: React.PropsWithChildren) => <SafeAreaProvider initialMetrics={metrics}><OverlayProvider>{children}</OverlayProvider></SafeAreaProvider>;
beforeEach(() => jest.clearAllMocks());

it('removes a single image, clears the remaining images and allows choosing again', async () => {
  const save = jest.fn();
  await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'] }} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByLabelText('Xóa ảnh 1'));
  expect(screen.queryByLabelText('Xóa ảnh 2')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Xóa tất cả ảnh'));
  expect(screen.queryByLabelText('Xóa ảnh 1')).toBeNull();
  await fireEvent.press(screen.getByText('Lưu'));
  expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm'));
  await fireEvent.press(screen.getByText('Lưu'));
  expect(uploadImage).toHaveBeenCalledWith('file:///new.jpg', 'portfolio');
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ imageUrls: ['file:///new.jpg'] }));
});

it('saves text inserted in the middle and uploads only the retained image', async () => {
  const save = jest.fn();
  await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ description: 'hôm nay đi chơi', imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'] }} />, { wrapper: Wrapper });
  const input = screen.getByLabelText('Mô tả tác phẩm');
  expect(input.props.value).toBeUndefined();
  await fireEvent.changeText(input, 'hôm nay tôi đi chơi');
  await fireEvent.press(screen.getByLabelText('Xóa ảnh 1'));
  await fireEvent.press(screen.getByText('Lưu'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ description: 'hôm nay tôi đi chơi', imageUrls: ['https://example.com/2.jpg'] }));
  expect(uploadImage).not.toHaveBeenCalledWith('https://example.com/1.jpg', 'portfolio');
});

it('starts a fresh form when reopened', async () => {
  const view = await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} />, { wrapper: Wrapper });
  await fireEvent.changeText(screen.getByLabelText('Tên tác phẩm'), 'Bản nháp');
  await view.rerender(<PortfolioFormModal visible={false} onClose={jest.fn()} onSubmit={jest.fn()} />);
  await view.rerender(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={{ title: 'Tác phẩm khác' }} />);
  expect(screen.getByLabelText('Tên tác phẩm').props.defaultValue).toBe('Tác phẩm khác');
});
