import {useMemo,useState} from 'react';
import type {BankAccount,BankAccountDraft,BankAccountOtpResponse} from '../types/bankAccount';
import {useAddBankAccount,useRequestBankAccountOtp,useUpdateBankAccount} from './useBankAccounts';

export function useBankAccountOtpFlow(id:string|undefined,draft:BankAccountDraft|undefined){
  const requestOtp=useRequestBankAccountOtp();const add=useAddBankAccount();const update=useUpdateBankAccount();
  const [issued,setIssued]=useState<{id?:string;draft:BankAccountDraft;info:BankAccountOtpResponse}|null>(null);
  const draftKey=useMemo(()=>draft?JSON.stringify(draft):'', [draft]);
  // Invalidate immediately during render, including when an older request resolves late.
  const session=issued&&issued.id===id&&JSON.stringify(issued.draft)===draftKey?issued:null;
  const send=async()=>{if(!draft)throw new Error('Thông tin tài khoản chưa hợp lệ.');const snapshot={...draft};const info=await requestOtp.mutateAsync({request:snapshot,id});setIssued({id,draft:snapshot,info});return info;};
  const confirm=async(otp:string):Promise<BankAccount>=>{if(!session)throw new Error('Vui lòng gửi lại mã OTP.');const request={...session.draft,otp};return id?update.mutateAsync({id,request}):add.mutateAsync(request);};
  return{session,send,confirm,reset:()=>setIssued(null),isSending:requestOtp.isPending,isConfirming:add.isPending||update.isPending};
}
