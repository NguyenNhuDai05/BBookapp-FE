import { api } from './api';
export type ReportTarget = { type: 'User' | 'Portfolio' | 'Comment' | 'Review' | 'Message'; id: string };
export const moderationService = {
  report: async (target: ReportTarget, reason: string, description: string) => (await api.post('/moderation/reports', { targetType: target.type, targetId: target.id, reason, description })).data,
  block: async (id: string) => (await api.put(`/moderation/blocks/${id}`)).data,
  unblock: async (id: string) => (await api.delete(`/moderation/blocks/${id}`)).data,
  blocks: async (): Promise<{ userId: string; fullName?: string }[]> => (await api.get('/moderation/blocks')).data,
};
