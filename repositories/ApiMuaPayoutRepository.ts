import { api } from '../services/api';
import type { IMuaPayoutRepository } from './IMuaPayoutRepository';
import type { CreatePayoutRequest, MuaBankAccountDto, MuaPayoutDto, PayoutProvider, PayoutStatus, UpsertMuaBankAccountRequest } from '../types/payout';

const statusMap: Record<string, PayoutStatus> = { '0':'PENDING', PENDING:'PENDING', '1':'MANUAL_ACTION_REQUIRED', MANUALACTIONREQUIRED:'MANUAL_ACTION_REQUIRED', MANUAL_ACTION_REQUIRED:'MANUAL_ACTION_REQUIRED', '2':'PROCESSING', PROCESSING:'PROCESSING', '3':'PAID', PAID:'PAID', '4':'FAILED', FAILED:'FAILED' };
const providerMap: Record<string, PayoutProvider> = { '0':'MANUAL', MANUAL:'MANUAL', '1':'PAYOS', PAYOS:'PAYOS' };
const mapStatus = (value: unknown) => statusMap[String(value ?? '').replace(/\s/g, '').toUpperCase()] ?? 'UNKNOWN';
const mapProvider = (value: unknown) => providerMap[String(value ?? '').replace(/\s/g, '').toUpperCase()] ?? 'UNKNOWN';
const mapBank = (value: any): MuaBankAccountDto => ({ id:String(value.id), bankCode:String(value.bankCode ?? ''), bankName:value.bankName || undefined, maskedAccountNumber:String(value.maskedAccountNumber ?? ''), accountHolderName:String(value.accountHolderName ?? ''), isDefault:Boolean(value.isDefault), isActive:Boolean(value.isActive), verificationStatus:String(value.verificationStatus ?? 'Entered') });
const mapPayout = (value: any): MuaPayoutDto => ({ id:String(value.id), amount:Number(value.amount), status:mapStatus(value.status), provider:mapProvider(value.provider), bankCode:String(value.bankCode ?? ''), bankName:value.bankName || undefined, maskedAccountNumber:String(value.maskedAccountNumber ?? ''), accountHolderName:String(value.accountHolderName ?? ''), providerReference:value.providerReference || undefined, idempotencyKey:String(value.idempotencyKey ?? ''), receivableIds:Array.isArray(value.receivableIds)?value.receivableIds.map(String):[], createdAt:String(value.createdAt ?? ''), processingAt:value.processingAt || undefined, paidAt:value.paidAt || undefined, failedAt:value.failedAt || undefined, reconciledAt:value.reconciledAt || undefined, failureCode:value.failureCode || undefined, failureMessage:value.failureMessage || undefined });

export class ApiMuaPayoutRepository implements IMuaPayoutRepository {
  async getBankAccounts(){const {data}=await api.get('/mua/bank-accounts');if(!Array.isArray(data))throw new Error('Dữ liệu tài khoản ngân hàng không hợp lệ.');return data.map(mapBank);}
  async addBankAccount(request:UpsertMuaBankAccountRequest){const {data}=await api.post('/mua/bank-accounts',request);return mapBank(data);}
  async updateBankAccount(id:string,request:UpsertMuaBankAccountRequest){const {data}=await api.put(`/mua/bank-accounts/${id}`,request);return mapBank(data);}
  async deleteBankAccount(id:string){await api.delete(`/mua/bank-accounts/${id}`);}
  async createPayout(request:CreatePayoutRequest){const {data}=await api.post('/mua/payouts',request);return mapPayout(data);}
  async getPayouts(){const {data}=await api.get('/mua/payouts');if(!Array.isArray(data))throw new Error('Dữ liệu payout không hợp lệ.');return data.map(mapPayout);}
  async getPayout(id:string){const {data}=await api.get(`/mua/payouts/${id}`);return mapPayout(data);}
}
