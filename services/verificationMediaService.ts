import { Image, Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { api } from './api';

export type VerificationPurpose = 'identity-front' | 'identity-back' | 'portrait' | 'certificate';
export async function uploadVerificationImage(uri: string, purpose: VerificationPurpose): Promise<string> {
  if (!/^(file:\/\/|content:\/\/|blob:)/.test(uri)) {
    throw new Error('Vui lòng chọn lại ảnh từ thiết bị.');
  }
  // A JPEG filename/MIME type does not convert camera/HEIC bytes. Bound the
  // decoded size before upload, keeping the aspect ratio and the whole document.
  let prepared: { uri: string };
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) =>
      Image.getSize(uri, (width, height) => resolve({ width, height }), reject));
    if (!Number.isFinite(dimensions.width) || !Number.isFinite(dimensions.height)
      || dimensions.width <= 0 || dimensions.height <= 0) throw new Error('Invalid dimensions');
    const longest = Math.max(dimensions.width, dimensions.height);
    const actions = longest > 2560
      ? [{ resize: dimensions.width >= dimensions.height ? { width: 2560 } : { height: 2560 } }]
      : [];
    prepared = await manipulateAsync(uri, actions, { format: SaveFormat.JPEG, compress: 0.85 });
  } catch {
    throw new Error('Không thể xử lý ảnh này. Vui lòng chụp lại hoặc chọn ảnh khác từ thiết bị.');
  }
  const form = new FormData();
  form.append('purpose', purpose);
  if (Platform.OS === 'web') {
    const blob = await fetch(prepared.uri).then(response => response.blob());
    form.append('file', blob, 'verification-image.jpg');
  } else {
    form.append('file', { uri: prepared.uri, name: 'verification-image.jpg', type: 'image/jpeg' } as any);
  }
  const response = await api.post<{ mediaId: string }>('/verification-media', form);
  return response.data.mediaId;
}
