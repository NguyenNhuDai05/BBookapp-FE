import 'react-native-url-polyfill/auto';
import { api, API_URL } from './api';
import { Platform } from 'react-native';
import { normalizeMediaUrl } from '../utils/mediaUrl';

// All BBook uploads go through the authenticated backend ownership ledger.
/** Uploads a picked device image to our API and returns a public HTTP URL. */
export const uploadImage = async (uri: string, purpose: 'avatar' | 'portfolio' | 'service' | 'review' = 'avatar'): Promise<string> => {
  if (!uri || (!uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('blob:'))) {
    return uri;
  }

  const fileName = uri.split('/').pop()?.split('?')[0] || `image-${Date.now()}.jpg`;
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  form.append('purpose', purpose);

  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then((response) => response.blob());
    form.append('file', blob, fileName);
  } else {
    form.append('file', { uri, name: fileName, type: contentType } as any);
  }

  const response = await api.post<{ url: string }>('/Upload/image', form);
  const returnedUrl = response.data.url;
  if (/^https?:\/\//i.test(returnedUrl)) return normalizeMediaUrl(returnedUrl);
  return `${API_URL.replace(/\/api\/?$/, '')}${returnedUrl}`;
};

export type BankQrScanResult = {
  url: string;
  method: 'BANK' | 'MOMO';
  bankBin?: string;
  accountNumber?: string;
  accountName?: string;
  requiresManualAccountName: boolean;
  requiresManualAccountNumber: boolean;
};

/** Uploads and decodes a bank/MoMo receive QR. The server rejects unrelated QR codes. */
export const uploadBankQr = async (uri: string): Promise<BankQrScanResult> => {
  const fileName = uri.split('/').pop()?.split('?')[0] || `bank-qr-${Date.now()}.jpg`;
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then(response => response.blob());
    form.append('file', blob, fileName);
  } else {
    form.append('file', { uri, name: fileName, type: contentType } as any);
  }
  const response = await api.post<BankQrScanResult>('/Upload/bank-qr', form);
  return { ...response.data, url: normalizeMediaUrl(response.data.url) };
};
