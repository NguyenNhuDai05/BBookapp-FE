import type { MuaDraft } from '../types/onboarding';

export interface IMuaOnboardingRepository {
  saveDraft(userId: string, draft: MuaDraft): Promise<void>;
  getDraft(userId: string): Promise<MuaDraft | null>;
  submitApplication(userId: string, draft: MuaDraft): Promise<{ success: boolean; applicationId: string }>;
  uploadPortfolioImage(localUri: string): Promise<string>;
}
