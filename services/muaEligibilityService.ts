import { api } from './api';
import type { MuaEligibility } from '../types/muaEligibility';

export const muaEligibilityService = {
  async get(): Promise<MuaEligibility> {
    const response = await api.get<MuaEligibility>('/Mua/eligibility');
    const data = response.data;
    return {
      ...data,
      completionPercentage: Math.max(0, Math.min(100, Number(data.completionPercentage) || 0)),
      profileStatus: String(data.profileStatus || 'DRAFT').toUpperCase(),
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      missingRequirements: Array.isArray(data.missingRequirements) ? data.missingRequirements : [],
    };
  },
};
