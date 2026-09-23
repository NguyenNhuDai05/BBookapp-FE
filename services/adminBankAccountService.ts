import { api } from './api';

export type PendingBankAccount={id:string;ownerType:'CUSTOMER'|'MUA';ownerId:string;ownerName?:string;bankCode:string;bankName?:string;accountNumber:string;accountHolderName:string;method:'BANK'|'MOMO';qrCodeUrl?:string;createdAt:string};
export const adminBankAccountService={
  pending:async():Promise<PendingBankAccount[]> => (await api.get('/admin/bank-accounts/pending')).data,
  approve:async(item:PendingBankAccount)=>{await api.post(`/admin/bank-accounts/${item.ownerType}/${item.id}/approve`,{});},
  reject:async(item:PendingBankAccount)=>{await api.post(`/admin/bank-accounts/${item.ownerType}/${item.id}/reject`,{});},
};
