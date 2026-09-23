import { api } from './api';
import { mapRefundStatus } from '../utils/bookingStatus';
import type { RefundSummaryDto } from '../types/booking';
import type { AdminRefundDto, CustomerBankAccountDto, UpsertCustomerBankAccountRequest } from '../types/refund';

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
  getBankAccounts: async ():Promise<CustomerBankAccountDto[]> => (await api.get('/customer-bank-accounts')).data,
  addBankAccount: async (request:UpsertCustomerBankAccountRequest):Promise<CustomerBankAccountDto> => (await api.post('/customer-bank-accounts',{...request,qrCodeUrl:request.qrCodeUrl||undefined})).data,
  deleteBankAccount: async (id:string):Promise<void> => { await api.delete(`/customer-bank-accounts/${id}`); },
  setDestination: async (refundId:string,bankAccountId:string):Promise<RefundSummaryDto> => (await api.post(`/customer-refunds/${refundId}/destination`,{bankAccountId})).data,
  getAdminQueue: async ():Promise<AdminRefundDto[]> => ((await api.get('/Refund')).data as any[]).map(mapAdmin),
  getAdminById: async (id:string):Promise<AdminRefundDto> => mapAdmin((await api.get(`/Refund/${id}`)).data),
  start: async (id:string):Promise<AdminRefundDto> => mapAdmin((await api.post(`/Refund/${id}/start-processing`,{})).data),
  complete: async (id:string,reference:string):Promise<AdminRefundDto> => mapAdmin((await api.post(`/Refund/${id}/complete`,{reference})).data),
  fail: async (id:string,failureCode:string,failureMessage:string):Promise<AdminRefundDto> => mapAdmin((await api.post(`/Refund/${id}/fail`,{failureCode,failureMessage})).data),
  retry: async (id:string):Promise<AdminRefundDto> => mapAdmin((await api.post(`/Refund/${id}/retry`,{})).data),
};
