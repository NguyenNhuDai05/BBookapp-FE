export type NotificationAudience = 'All' | 'Customer' | 'MUA' | 'SelectedUsers';

export type AdminNotificationCampaign = {
  id: string; title: string; body: string; audience: NotificationAudience;
  url?: string | null; recipientCount: number; status: string; createdAt: string;
};

export type AdminNotificationUser = {
  userId: string; fullName: string; email: string; role: string; avatarUrl?: string | null;
};

export type PagedResult<T> = { items: T[]; total: number; page: number; pageSize: number };

export type CreateAdminNotificationRequest = {
  title: string; body: string; audience: NotificationAudience; userIds: string[];
  url?: string; idempotencyKey: string;
};
