import type { MuaProfileDto, PayoutSettingsDto, MuaUpdateDto } from '../types/muaProfile';

export interface IMuaProfileRepository {
  getProfile(muaId: string): Promise<MuaProfileDto>;
  updateProfile(data: MuaUpdateDto): Promise<void>;
  getPayoutSettings(muaId: string): Promise<PayoutSettingsDto | null>;
  updatePayoutSettings(muaId: string, settings: PayoutSettingsDto): Promise<void>;
}
