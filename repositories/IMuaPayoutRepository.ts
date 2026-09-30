import type { CreatePayoutRequest, MuaPayoutDto } from '../types/payout';

export interface IMuaPayoutRepository {
  createPayout(request: CreatePayoutRequest): Promise<MuaPayoutDto>;
  getPayouts(): Promise<MuaPayoutDto[]>;
  getPayout(id: string): Promise<MuaPayoutDto>;
}
