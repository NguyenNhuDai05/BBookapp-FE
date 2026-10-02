import { api } from '../api';
import { uploadVerificationImage } from '../verificationMediaService';
jest.mock('../api', () => ({ api: { post: jest.fn() } }));

it('refuses public/signed URLs instead of uploading them as verification', async () => {
  await expect(uploadVerificationImage('https://example.com/cccd.jpg', 'identity-front')).rejects.toThrow('chọn lại ảnh');
  expect(api.post).not.toHaveBeenCalled();
});

it('uploads to private verification endpoint and returns only a durable media ID', async () => {
  jest.mocked(api.post).mockResolvedValueOnce({ data: { mediaId: 'owned-image-id' } });
  expect(await uploadVerificationImage('file:///picked.jpg', 'portrait')).toBe('owned-image-id');
  expect(api.post).toHaveBeenCalledWith('/verification-media', expect.any(FormData));
});
