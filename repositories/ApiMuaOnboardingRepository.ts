import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMuaOnboardingRepository } from './IMuaOnboardingRepository';
import type { MuaDraft } from '../types/onboarding';

export class ApiMuaOnboardingRepository implements IMuaOnboardingRepository {
  private draftKey(userId: string): string {
    return `mua_onboarding_draft:${userId}`;
  }

  async saveDraft(userId: string, draft: MuaDraft): Promise<void> {
    await AsyncStorage.setItem(this.draftKey(userId), JSON.stringify(draft));
  }

  async getDraft(userId: string): Promise<MuaDraft | null> {
    const stored = await AsyncStorage.getItem(this.draftKey(userId));
    return stored ? JSON.parse(stored) as MuaDraft : null;
  }

  async submitApplication(userId: string, draft: MuaDraft): Promise<{ success: boolean; applicationId: string }> {
    await AsyncStorage.removeItem(this.draftKey(userId));
    throw new Error('Legacy MUA draft submission is not supported. Use the current MUA application flow.');
  }

  async uploadPortfolioImage(localUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: localUri,
        name: 'portfolio.jpg',
        type: 'image/jpeg',
      } as any);

      const { data } = await api.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    } catch (e) {
      console.error('Failed to upload image', e);
      throw e;
    }
  }
}
