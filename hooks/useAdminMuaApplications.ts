import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { adminMuaApplicationService as service } from '../services/adminMuaApplicationService';
import type { RejectMuaApplicationRequest } from '../types/adminMuaApplication';
export const useAdminMuaApplications=(status:string)=>useQuery({queryKey:['admin','mua-applications',status],queryFn:()=>service.list(status)});
export const useAdminMuaApplication=(id:string)=>useQuery({queryKey:['admin','mua-applications','detail',id],queryFn:()=>service.detail(id),enabled:Boolean(id)});
export const useReviewMuaApplication=(id:string)=>{const client=useQueryClient();return useMutation({mutationFn:(x:{approved:boolean;rejection?:RejectMuaApplicationRequest})=>x.approved?service.approve(id):service.reject(id,x.rejection??{reason:'Hồ sơ chưa đáp ứng yêu cầu.',reasonCodes:['OTHER'],items:[]}),onSuccess:()=>{void client.invalidateQueries({queryKey:['admin','mua-applications']});void client.invalidateQueries({queryKey:['admin','mua-applications','detail',id]});}})};
