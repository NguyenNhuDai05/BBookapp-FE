import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OverlayProvider } from '../../../ui/OverlayProvider';
import { ServiceFormModal } from '../ServiceFormModal';
import { uploadImage } from '../../../../services/supabase';
import * as ImagePicker from 'expo-image-picker';
const mockNetworkError = jest.fn(() => false);
let mockApiCode: string | undefined;
let mockCatalogStyles = [{ styleId: 2, name: 'Tự nhiên', isActive: true }];
jest.mock('../../../../hooks/useMuaStyles', () => ({ useMuaStyles: () => ({ data: mockCatalogStyles, isLoading: false, isError: false, refetch: jest.fn() }) }));

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => '11111111-1111-4111-8111-111111111111') }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('../../../../services/supabase', () => ({ uploadImage: jest.fn(async (uri: string) => uri) }));
jest.mock('../../../../services/api', () => ({ getApiError: () => ({ message: 'Không thể lưu', code: mockApiCode, isNetworkError: mockNetworkError() }) }));
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } };
const Wrapper = ({ children }: React.PropsWithChildren) => <SafeAreaProvider initialMetrics={metrics}><OverlayProvider>{children}</OverlayProvider></SafeAreaProvider>;
beforeEach(() => { jest.clearAllMocks(); mockNetworkError.mockReturnValue(false); mockApiCode = undefined; mockCatalogStyles = [{ styleId: 2, name: 'Tự nhiên', isActive: true }]; });

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

it('clears all images and disables saving until another image is added', async () => {
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={{ name: 'Dịch vụ', description: 'Mô tả', price: 100000, durationMinutes: 60, imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'] }} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByLabelText('Xóa tất cả ảnh'));
  expect(screen.queryByLabelText('Xóa ảnh 1')).toBeNull();
  expect(screen.getByText('Tối thiểu 1 ảnh')).toBeTruthy();
  expect(screen.getByLabelText('Lưu thay đổi').props.accessibilityState.disabled).toBe(true);
});

it('retains an insertion in the middle of a sentence through another form update and saves it', async () => {
  const save = jest.fn();
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ name: 'Dịch vụ', description: 'hôm nay đi chơi', price: 100000, durationMinutes: 60, imageUrls: ['https://example.com/1.jpg'] }} />, { wrapper: Wrapper });
  const input = screen.getByLabelText('Mô tả dịch vụ');
  expect(input.props.value).toBeUndefined();
  await fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 8, end: 8 } } });
  await fireEvent.changeText(input, 'hôm nay tôi đi chơi');
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), 'Tự nhiên');
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ description: 'hôm nay tôi đi chơi' }));
});

it('preserves inactive styles and legacy tags by omitting style fields on an unrelated edit', async () => {
  const save = jest.fn();
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ id: 'service', name: 'Dịch vụ', description: 'Mô tả', price: 100000, durationMinutes: 60, imageUrls: ['https://example.com/1.jpg'], tags: ['Dịp cũ'], styleIds: [9], styleTags: [{ styleId: 9, name: 'Style cũ', isActive: false }] }} />, { wrapper: Wrapper });
  expect(screen.getByText('Style cũ · Ngừng sử dụng ×')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Giá dịch vụ'), '200000');
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  expect(save.mock.calls[0][0]).not.toHaveProperty('styleIds');
  expect(save.mock.calls[0][0]).not.toHaveProperty('tags');
  expect(save.mock.calls[0][0]).not.toHaveProperty('requestId');
});

it('sends selected IDs and local new names, without pre-creating a catalog entry', async () => {
  const save = jest.fn();
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={save} availableStyles={[{ styleId: 2, name: 'Tự nhiên', isActive: true }]} initialData={{ id: 's', name: 'Dịch vụ', description: 'Mô tả', price: 100000, durationMinutes: 60, imageUrls: ['https://example.com/1.jpg'] }} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByLabelText('Chọn Tự nhiên'));
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), '  Phong   cách mới ');
  await fireEvent.press(screen.getByText('Thêm “Phong cách mới”'));
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ styleIds: [2], newStyleNames: ['Phong cách mới'] }));
  expect(save.mock.calls[0][0]).not.toHaveProperty('tags');
});

it('retries an uncertain create with the same requestId and immutable payload', async () => {
  mockNetworkError.mockReturnValue(true);
  const save = jest.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(undefined);
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={save} />, { wrapper: Wrapper });
  await fireEvent.changeText(screen.getByLabelText('Tên dịch vụ'), 'Dịch vụ');
  await fireEvent.changeText(screen.getByLabelText('Mô tả dịch vụ'), 'Mô tả');
  await fireEvent.changeText(screen.getByLabelText('Giá dịch vụ'), '100000');
  await fireEvent.changeText(screen.getByLabelText('Thời gian dịch vụ'), '60');
  jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as any);
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file://1.jpg' }] } as any);
  await fireEvent.press(screen.getByText('Chọn ảnh'));
  await fireEvent.press(screen.getByLabelText('Lưu dịch vụ'));
  expect(screen.getByLabelText('Tên dịch vụ').props.editable).toBe(false);
  await fireEvent.press(screen.getByLabelText('Lưu dịch vụ'));
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0]);
  expect(save.mock.calls[0][0].requestId).toBe('11111111-1111-4111-8111-111111111111');
  expect(uploadImage).toHaveBeenCalledTimes(1);
});


it('selects an additional catalog style beyond specialties without saving the profile first', async () => {
  mockCatalogStyles = [{ styleId: 1, name: 'Chuyên môn hiện tại', isActive: true }, { styleId: 2, name: 'Ngoài chuyên môn', isActive: true }];
  const save = jest.fn(); const reload = jest.fn();
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={save} availableStyles={[mockCatalogStyles[0]]} onReloadStyles={reload} initialData={{ id: 's', name: 'Dịch vụ', description: 'Mô tả', price: 100000, durationMinutes: 60, imageUrls: ['https://example.com/1.jpg'] }} />, { wrapper: Wrapper });
  expect(screen.getByText('Chuyên môn của bạn')).toBeTruthy();
  expect(screen.getAllByLabelText('Chọn Chuyên môn hiện tại')).toHaveLength(1);
  await fireEvent.press(screen.getByLabelText('Chọn Ngoài chuyên môn'));
  expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ styleIds: [2], newStyleNames: [] }));
});
it('removing a service style sends only service replacement, never profile deletion', async () => {
  mockCatalogStyles = [{ styleId: 2, name: 'Tự nhiên', isActive: true }];
  const save = jest.fn();
  await render(<ServiceFormModal visible onClose={jest.fn()} onSubmit={save} availableStyles={mockCatalogStyles} initialData={{ id: 's', name: 'Dịch vụ', description: 'Mô tả', price: 100000, durationMinutes: 60, imageUrls: ['https://example.com/1.jpg'], styleIds: [2], styleTags: mockCatalogStyles }} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByLabelText('Bỏ Tự nhiên')); await fireEvent.press(screen.getByLabelText('Lưu thay đổi'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ styleIds: [], newStyleNames: [] }));
  expect(save.mock.calls[0][0]).not.toHaveProperty('tags');
});
it('does not close or report success when the backend rejects the specialty union', async () => {
  mockApiCode = 'MUA_STYLE_LIMIT_EXCEEDED';
  const close = jest.fn(); const save = jest.fn().mockRejectedValue(new Error('Tổng chuyên môn vượt 20; chưa lưu'));
  await render(<ServiceFormModal visible onClose={close} onSubmit={save} initialData={{ id: 's', name: 'Dịch vụ', description: 'Mô tả', price: 100000, durationMinutes: 60, imageUrls: ['https://example.com/1.jpg'] }} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByLabelText('Lưu thay đổi')); expect(close).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toBeTruthy(); expect(screen.getByText(/Tổng chuyên môn sẽ vượt 20/)).toBeTruthy();
});
