import type { CreatePayoutRequest, MuaBankAccountDto, MuaPayoutDto, UpsertMuaBankAccountRequest } from '../types/payout';

export interface IMuaPayoutRepository {
  getBankAccounts(): Promise<MuaBankAccountDto[]>;
  addBankAccount(request: UpsertMuaBankAccountRequest): Promise<MuaBankAccountDto>;
  updateBankAccount(id: string, request: UpsertMuaBankAccountRequest): Promise<MuaBankAccountDto>;
  deleteBankAccount(id: string): Promise<void>;
  createPayout(request: CreatePayoutRequest): Promise<MuaPayoutDto>;
  getPayouts(): Promise<MuaPayoutDto[]>;
  getPayout(id: string): Promise<MuaPayoutDto>;
}
