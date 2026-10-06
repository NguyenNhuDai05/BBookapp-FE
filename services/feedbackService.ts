import { api } from './api';
export type FeedbackCategory = 'Bug' | 'Suggestion' | 'Other';
export const feedbackService = {
  create: async (body: { submissionId: string; category: FeedbackCategory; body: string }) =>
    (await api.post<{ id: string; status: string; createdAt: string }>('/feedback', body)).data,
};
