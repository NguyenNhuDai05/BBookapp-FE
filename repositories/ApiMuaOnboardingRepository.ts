import { api } from '../services/api';
import { IMuaOnboardingRepository } from './IMuaOnboardingRepository';
import type { MuaDraft } from '../types/onboarding';

export class ApiMuaOnboardingRepository implements IMuaOnboardingRepository {
  async saveDraft(userId: string, draft: MuaDraft): Promise<void> {
    try {
      await api.post('/Mua/onboarding/draft', { userId, ...draft });
    } catch (e) {
      console.error('Failed to save draft', e);
      throw e;
    }
  }

  async getDraft(userId: string): Promise<MuaDraft | null> {
    try {
      const { data } = await api.get(`/Mua/onboarding/draft/${userId}`);
      return data;
    } catch (e) {
      return null;
    }
  }

  async submitApplication(userId: string, draft: MuaDraft): Promise<{ success: boolean; applicationId: string }> {
    try {
      const { data } = await api.post('/Mua/onboarding/submit', { userId, ...draft });
      return { success: true, applicationId: data.applicationId || 'unknown' };
    } catch (e) {
      console.error('Failed to submit application', e);
      throw e;
    }
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
