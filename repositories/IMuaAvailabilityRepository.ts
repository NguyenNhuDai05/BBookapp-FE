import type { DailyAvailabilityDto } from '../types/availability';

export interface IMuaAvailabilityRepository {
  getAvailability(muaId: string, month: string): Promise<DailyAvailabilityDto[]>;
  updateAvailability(muaId: string, date: string, updates: Partial<DailyAvailabilityDto>): Promise<void>;
}
