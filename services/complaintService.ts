import { api } from './api';
import type { ComplaintDetail, ComplaintEligibility, ComplaintSummary } from '../types/complaint';
export const complaintService = {
  eligibility: async (bookingId: string) => (await api.get<ComplaintEligibility>(`/Booking/${bookingId}/complaint-eligibility`)).data,
  list: async (bookingId: string) => (await api.get<ComplaintSummary[]>(`/Booking/${bookingId}/complaints`)).data,
  detail: async (id: string) => (await api.get<ComplaintDetail>(`/complaints/${id}`)).data,
  create: async (bookingId: string, body: { category: string; description: string; requestedOutcome: string; requestedAmount?: number; imageUrls: string[] }) =>
    (await api.post<{ id: string }>(`/Booking/${bookingId}/complaints`, body)).data,
  message: async (id: string, body: { body: string; imageUrls: string[] }) => (await api.post<ComplaintDetail>(`/complaints/${id}/messages`, body)).data,
};
