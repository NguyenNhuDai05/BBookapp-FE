import { Platform } from 'react-native';
import { api } from './api';

export type VerificationPurpose = 'identity-front' | 'identity-back' | 'portrait' | 'certificate';
export async function uploadVerificationImage(uri: string, purpose: VerificationPurpose): Promise<string> {
  if (!/^(file:\/\/|content:\/\/|blob:)/.test(uri)) {
    throw new Error('Vui lòng chọn lại ảnh từ thiết bị.');
  }
  const form = new FormData();
  form.append('purpose', purpose);
  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then(response => response.blob());
    form.append('file', blob, 'verification-image.jpg');
  } else {
    form.append('file', { uri, name: 'verification-image.jpg', type: 'image/jpeg' } as any);
  }
  const response = await api.post<{ mediaId: string }>('/verification-media', form);
  return response.data.mediaId;
}
