import { Platform } from 'react-native';
import { api } from './api';

export const financialMediaService = {
  uploadMomo: async (uri: string) => {
    const name = uri.split('/').pop()?.split('?')[0] || 'momo-qr.jpg';
    const extension = name.split('.').pop()?.toLowerCase();
    const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
    const form = new FormData();
    if (Platform.OS === 'web') form.append('file', await fetch(uri).then(response => response.blob()), name);
    else form.append('file', { uri, name, type } as any);
    const { data } = await api.post<{ financialQrMediaId: string; accountNumber?: string; accountName?: string }>('/financial-media/momo-qr', form);
    if (!/^[0-9a-f-]{36}$/i.test(data.financialQrMediaId)) throw new Error('QR riêng tư chưa được xác nhận.');
    return { financialQrMediaId: data.financialQrMediaId, accountNumber: data.accountNumber, accountName: data.accountName };
  },
  preview: async (id: string) => {
    const { data } = await api.get<{ imageDataUrl: string }>(`/financial-media/${id}/preview`);
    if (!data.imageDataUrl.startsWith('data:image/jpeg;base64,')) throw new Error('QR riêng tư chưa khả dụng.');
    return data.imageDataUrl;
  },
};
