import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { muaPayoutService } from '../services/muaPayoutService';
import type { CreatePayoutRequest, UpsertMuaBankAccountRequest } from '../types/payout';
import { MUA_ELIGIBILITY_QUERY_KEY } from './useMuaEligibility';

export const MUA_BANK_ACCOUNTS_KEY = ['mua','bank-accounts'] as const;
export const MUA_PAYOUTS_KEY = ['mua','payouts'] as const;
export const muaPayoutKey = (id:string) => ['mua','payouts',id] as const;

export const useMuaBankAccounts = () => useQuery({queryKey:MUA_BANK_ACCOUNTS_KEY,queryFn:()=>muaPayoutService.getBankAccounts()});
export const useMuaPayouts = () => useQuery({queryKey:MUA_PAYOUTS_KEY,queryFn:()=>muaPayoutService.getPayouts()});
export const useMuaPayout = (id:string) => useQuery({queryKey:muaPayoutKey(id),queryFn:()=>muaPayoutService.getPayout(id),enabled:Boolean(id)});

export const useAddMuaBankAccount = () => {const q=useQueryClient();return useMutation({mutationFn:(request:UpsertMuaBankAccountRequest)=>muaPayoutService.addBankAccount(request),retry:false,onSuccess:()=>{void q.invalidateQueries({queryKey:MUA_BANK_ACCOUNTS_KEY});void q.invalidateQueries({queryKey:MUA_ELIGIBILITY_QUERY_KEY});}});};
export const useUpdateMuaBankAccount = () => {const q=useQueryClient();return useMutation({mutationFn:({id,request}:{id:string;request:UpsertMuaBankAccountRequest})=>muaPayoutService.updateBankAccount(id,request),retry:false,onSuccess:()=>void q.invalidateQueries({queryKey:MUA_BANK_ACCOUNTS_KEY})});};
export const useDeleteMuaBankAccount = () => {const q=useQueryClient();return useMutation({mutationFn:(id:string)=>muaPayoutService.deleteBankAccount(id),retry:false,onSuccess:()=>{void q.invalidateQueries({queryKey:MUA_BANK_ACCOUNTS_KEY});void q.invalidateQueries({queryKey:MUA_ELIGIBILITY_QUERY_KEY});}});};
export const useCreateMuaPayout = () => {const q=useQueryClient();return useMutation({mutationFn:(request:CreatePayoutRequest)=>muaPayoutService.createPayout(request),retry:false,onSuccess:payout=>{q.setQueryData(muaPayoutKey(payout.id),payout);void q.invalidateQueries({queryKey:MUA_PAYOUTS_KEY});void q.invalidateQueries({queryKey:['mua-earnings']});void q.invalidateQueries({queryKey:MUA_ELIGIBILITY_QUERY_KEY});}});};
