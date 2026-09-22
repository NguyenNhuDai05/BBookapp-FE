import { api } from './api';
import type { AdminMuaApplicationDetail, AdminMuaApplicationListItem } from '../types/adminMuaApplication';
export const adminMuaApplicationService={
  list:async(status:string)=>(await api.get<AdminMuaApplicationListItem[]>('/admin/mua-applications',{params:{status,pageSize:50}})).data,
  detail:async(id:string)=>(await api.get<AdminMuaApplicationDetail>(`/admin/muas/${id}`)).data,
  approve:async(id:string)=>(await api.post(`/admin/mua-applications/${id}/approve`)).data,
  reject:async(id:string,reason:string)=>(await api.post(`/admin/mua-applications/${id}/reject`,{reason})).data,
};
