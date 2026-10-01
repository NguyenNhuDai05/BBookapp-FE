import { api } from './api';
import { mapRefundStatus, mapRefundSummary } from '../utils/bookingStatus';
import type { RefundSummaryDto } from '../types/booking';
import type { AdminRefundDto } from '../types/refund';

const mapAdmin = (x:any):AdminRefundDto => ({
  refundId:String(x.refundId??''),bookingId:String(x.bookingId??''),customerId:String(x.customerId??''),customerName:x.customerName,
  amount:Number(x.amount??0),status:mapRefundStatus(x.status),reason:String(x.reason??''),providerReference:x.providerReference,
  destinationBankBin:x.destinationBankBin,destinationBankName:x.destinationBankName,destinationAccountNumber:x.destinationAccountNumber,
  maskedDestinationAccountNumber:x.maskedDestinationAccountNumber,destinationAccountName:x.destinationAccountName,
  destinationQrCodeUrl:x.destinationQrCodeUrl,
  createdAt:String(x.createdAt??''),processingAt:x.processingAt,completedAt:x.completedAt,failedAt:x.failedAt,
  failureCode:x.failureCode,failureMessage:x.failureMessage,
});

export const refundService = {
  getCustomerRefunds: async (page = 1, pageSize = 20):Promise<{items:RefundSummaryDto[];total:number;page:number;pageSize:number}> => {
    const data = (await api.get('/customer-refunds', { params: { page, pageSize } })).data;
    return { ...data, items: (data.items ?? []).map((item:any) => mapRefundSummary(item)!) };
  },
  getCustomerById: async (refundId:string):Promise<RefundSummaryDto> => mapRefundSummary((await api.get(`/customer-refunds/${refundId}`)).data)!,
  setDestination: async (refundId:string,bankAccountId:string):Promise<RefundSummaryDto> => (await api.post(`/customer-refunds/${refundId}/destination`,{bankAccountId})).data,
  getAdminQueue: async ():Promise<AdminRefundDto[]> => ((await api.get('/Refund')).data as any[]).map(mapAdmin),
  getAdminById: async (id:string):Promise<AdminRefundDto> => mapAdmin((await api.get(`/Refund/${id}`)).data),
  start: async (id:string):Promise<AdminRefundDto> => mapAdmin((await api.post(`/Refund/${id}/start-processing`,{})).data),
  complete: async (id:string,reference:string):Promise<AdminRefundDto> => mapAdmin((await api.post(`/Refund/${id}/complete`,{reference})).data),
  fail: async (id:string,failureCode:string,failureMessage:string):Promise<AdminRefundDto> => mapAdmin((await api.post(`/Refund/${id}/fail`,{failureCode,failureMessage})).data),
  retry: async (id:string):Promise<AdminRefundDto> => mapAdmin((await api.post(`/Refund/${id}/retry`,{})).data),
};
