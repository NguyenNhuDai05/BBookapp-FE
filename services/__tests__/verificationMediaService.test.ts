import { api } from '../api';
import { uploadVerificationImage } from '../verificationMediaService';
import { Image } from 'react-native';
import { manipulateAsync } from 'expo-image-manipulator';
jest.mock('../api', () => ({ api: { post: jest.fn() } }));
jest.mock('expo-image-manipulator', () => ({ manipulateAsync: jest.fn(), SaveFormat: { JPEG: 'jpeg' } }));
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(FormData.prototype, 'append');
  jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => { success?.(1200, 1600); return Promise.resolve({ width: 1200, height: 1600 }); });
  jest.mocked(manipulateAsync).mockResolvedValue({ uri: 'file:///normalized.jpg', width: 1200, height: 1600 });
});

it('refuses public/signed URLs instead of uploading them as verification', async () => {
  await expect(uploadVerificationImage('https://example.com/cccd.jpg', 'identity-front')).rejects.toThrow('chọn lại ảnh');
  expect(api.post).not.toHaveBeenCalled();
});

it('uploads to private verification endpoint and returns only a durable media ID', async () => {
  jest.mocked(api.post).mockResolvedValueOnce({ data: { mediaId: 'owned-image-id' } });
  expect(await uploadVerificationImage('file:///picked.jpg', 'portrait')).toBe('owned-image-id');
  expect(api.post).toHaveBeenCalledWith('/verification-media', expect.any(FormData));
  expect(manipulateAsync).toHaveBeenCalledWith('file:///picked.jpg', [], { format: 'jpeg', compress: 0.85 });
  expect(FormData.prototype.append).toHaveBeenCalledWith('file', {
    uri: 'file:///normalized.jpg', name: 'verification-image.jpg', type: 'image/jpeg',
  });
});

it.each([[8000, 6000, { width: 2560 }], [6000, 8000, { height: 2560 }]])('bounds a %s x %s camera image without cropping', async (width, height, resize) => {
  jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => { success?.(width, height); return Promise.resolve({ width, height }); });
  jest.mocked(api.post).mockResolvedValueOnce({ data: { mediaId: 'private-id' } });
  await uploadVerificationImage('file:///camera.heic', 'identity-front');
  expect(manipulateAsync).toHaveBeenCalledWith('file:///camera.heic', [{ resize }], { format: 'jpeg', compress: 0.85 });
});

it('does not upload original bytes or fall back to public storage when conversion fails', async () => {
  jest.mocked(manipulateAsync).mockRejectedValueOnce(new Error('Unsupported image'));
  await expect(uploadVerificationImage('file:///broken.heic', 'portrait')).rejects.toThrow('chụp lại');
  expect(api.post).not.toHaveBeenCalled();
});
