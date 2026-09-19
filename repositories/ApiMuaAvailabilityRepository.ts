import { IMuaAvailabilityRepository } from './IMuaAvailabilityRepository';
import type { DailyAvailabilityDto } from '../types/availability';

export class ApiMuaAvailabilityRepository implements IMuaAvailabilityRepository {
  async getAvailability(muaId: string, month: string): Promise<DailyAvailabilityDto[]> {
    console.warn(`Monthly availability is not supported by the current API (${muaId}, ${month}).`);
    return [];
  }

  async updateAvailability(muaId: string, date: string, updates: Partial<DailyAvailabilityDto>): Promise<void> {
    throw new Error(`Updating availability is not supported by the current API (${muaId}, ${date}, ${Boolean(updates)}).`);
  }
}
