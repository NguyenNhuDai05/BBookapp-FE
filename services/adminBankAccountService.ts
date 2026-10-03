import { api } from './api';

export type PendingBankAccount={id:string;ownerId:string;ownerName?:string;bankCode:string;bankBin:string;bankName?:string;accountNumber:string;accountHolderName:string;method:'BANK'|'MOMO';reviewToken:string;hasFinancialQr:boolean;qrCodeUrl?:string;createdAt:string};
export const adminBankAccountService={
  reviewQr:async(id:string)=>(await api.get<{accountId:string;imageDataUrl:string}>(`/admin/bank-accounts/${id}/financial-qr`)).data,
  pending:async():Promise<PendingBankAccount[]> => (await api.get('/admin/bank-accounts/pending')).data,
  approve:async(item:PendingBankAccount):Promise<void> => { await api.post(`/admin/bank-accounts/${item.id}/approve`,{reviewToken:item.reviewToken}); },
  reject:async(item:PendingBankAccount,reason:string,note?:string)=>{await api.post(`/admin/bank-accounts/${item.id}/reject`,{reviewToken:item.reviewToken,reason,note});},
};
