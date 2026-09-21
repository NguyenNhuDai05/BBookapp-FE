import { api } from './api';
import type { AdminNotificationCampaign, AdminNotificationUser, CreateAdminNotificationRequest, PagedResult } from '../types/adminNotification';

export const adminNotificationService = {
  async getCampaigns(page = 1) {
    return (await api.get<PagedResult<AdminNotificationCampaign>>('/admin/notifications', { params: { page, pageSize: 20 } })).data;
  },
  async searchUsers(search: string, role?: string) {
    return (await api.get<PagedResult<AdminNotificationUser>>('/admin/notifications/users', { params: { search, role, page: 1, pageSize: 30 } })).data;
  },
  async create(request: CreateAdminNotificationRequest) {
    return (await api.post<AdminNotificationCampaign>('/admin/notifications', request)).data;
  },
};
