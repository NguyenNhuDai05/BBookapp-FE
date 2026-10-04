import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { muaPayoutService } from '../services/muaPayoutService';
import type { CreatePayoutRequest } from '../types/payout';
import { MUA_ELIGIBILITY_QUERY_KEY } from './useMuaEligibility';

export const MUA_PAYOUTS_KEY = ['mua','payouts'] as const;
export const muaPayoutKey = (id:string) => ['mua','payouts',id] as const;

export const useMuaPayouts = () => useQuery({queryKey:MUA_PAYOUTS_KEY,queryFn:()=>muaPayoutService.getPayouts(),refetchOnWindowFocus:true});
export const useMuaPayout = (id:string) => useQuery({queryKey:muaPayoutKey(id),queryFn:()=>muaPayoutService.getPayout(id),enabled:Boolean(id),refetchOnWindowFocus:true,refetchInterval:q=>{const s=q.state.data?.status;return s==='PENDING'||s==='MANUAL_ACTION_REQUIRED'||s==='PROCESSING'?15000:false;}});

export const useCreateMuaPayout = () => {const q=useQueryClient();return useMutation({mutationFn:(request:CreatePayoutRequest)=>muaPayoutService.createPayout(request),retry:false,onSuccess:async payout=>{q.setQueryData(muaPayoutKey(payout.id),payout);void q.invalidateQueries({queryKey:MUA_PAYOUTS_KEY});void q.invalidateQueries({queryKey:['mua-earnings']});void q.invalidateQueries({queryKey:MUA_ELIGIBILITY_QUERY_KEY});if(payout.provider==='SIMULATED')await Promise.all([q.invalidateQueries({queryKey:MUA_PAYOUTS_KEY}),q.invalidateQueries({queryKey:['mua-earnings']}),q.invalidateQueries({queryKey:muaPayoutKey(payout.id)})]);}});};
