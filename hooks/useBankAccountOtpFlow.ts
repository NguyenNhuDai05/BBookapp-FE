import {useEffect,useMemo,useState} from 'react';
import type {BankAccount,BankAccountDraft,BankAccountOtpResponse} from '../types/bankAccount';
import {useAddBankAccount,useRequestBankAccountOtp,useUpdateBankAccount} from './useBankAccounts';

export function useBankAccountOtpFlow(id:string|undefined,draft:BankAccountDraft|undefined){
  const requestOtp=useRequestBankAccountOtp();const add=useAddBankAccount();const update=useUpdateBankAccount();
  const [session,setSession]=useState<{draft:BankAccountDraft;info:BankAccountOtpResponse}|null>(null);
  const draftKey=useMemo(()=>draft?JSON.stringify(draft):'', [draft]);
  useEffect(()=>{if(session&&JSON.stringify(session.draft)!==draftKey)setSession(null);},[draftKey,session]);
  const send=async()=>{if(!draft)throw new Error('Thông tin tài khoản chưa hợp lệ.');const snapshot={...draft};const info=await requestOtp.mutateAsync({request:snapshot,id});setSession({draft:snapshot,info});return info;};
  const confirm=async(otp:string):Promise<BankAccount>=>{if(!session)throw new Error('Vui lòng gửi lại mã OTP.');const request={...session.draft,otp};return id?update.mutateAsync({id,request}):add.mutateAsync(request);};
  return{session,send,confirm,reset:()=>setSession(null),isSending:requestOtp.isPending,isConfirming:add.isPending||update.isPending};
}
