import { api } from './api';

export type PendingBankAccount={id:string;ownerId:string;ownerName?:string;bankCode:string;bankBin:string;bankName?:string;accountNumber:string;accountHolderName:string;method:'BANK'|'MOMO';qrCodeUrl?:string;createdAt:string};
export const adminBankAccountService={
  pending:async():Promise<PendingBankAccount[]> => (await api.get('/admin/bank-accounts/pending')).data,
  approve:async(item:PendingBankAccount):Promise<void> => { await api.post(`/admin/bank-accounts/${item.id}/approve`,{}); },
  reject:async(item:PendingBankAccount)=>{await api.post(`/admin/bank-accounts/${item.id}/reject`,{});},
};
