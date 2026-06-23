import { api } from '../services/api';
import { IMuaAvailabilityRepository } from './IMuaAvailabilityRepository';
import type { DailyAvailabilityDto } from '../types/availability';

export class ApiMuaAvailabilityRepository implements IMuaAvailabilityRepository {
  async getAvailability(muaId: string, month: string): Promise<DailyAvailabilityDto[]> {
    try {
      const { data } = await api.get('/MuaAvailability', {
        params: { muaId, month }
      });
      return data;
    } catch (e) {
      console.error('Failed to get availability', e);
      return [];
    }
  }

  async updateAvailability(muaId: string, date: string, updates: Partial<DailyAvailabilityDto>): Promise<void> {
    try {
      await api.put('/MuaAvailability', {
        muaId,
        date,
        ...updates
      });
    } catch (e) {
      console.error('Failed to update availability', e);
      throw e;
    }
  }
}
