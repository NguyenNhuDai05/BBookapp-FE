import { Platform } from 'react-native';
import { api } from './api';
import type { AiMakeupCapabilities, AiMakeupPhoto, AiMakeupResult } from '../types/aiMakeup';

export const aiMakeupService = {
  async capabilities(signal?: AbortSignal): Promise<AiMakeupCapabilities> {
    return (await api.get<AiMakeupCapabilities>('/ai/makeup-recommendations/capabilities', { signal })).data;
  },
  async analyze(photo: AiMakeupPhoto, consentVersion: string, preferences: string, occasion: string, signal: AbortSignal): Promise<AiMakeupResult> {
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(photo.uri, { signal })).blob();
      form.append('image', blob, 'selfie.jpg');
    } else {
      form.append('image', { uri: photo.uri, type: 'image/jpeg', name: 'selfie.jpg' } as unknown as Blob);
    }
    form.append('consent', 'true'); form.append('adultConfirmed', 'true');
    form.append('consentVersion', consentVersion);
    form.append('preferences', preferences.slice(0, 200)); form.append('occasion', occasion.slice(0, 100));
    return (await api.post<AiMakeupResult>('/ai/makeup-recommendations', form, { signal, timeout: 70000,
      headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
};
