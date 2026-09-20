import { api } from "./api";

export type FeedItem = {
  id?: string;
  portfolioId: string;
  muaId: string;
  authorId?: string;
  title: string;
  imageUrls: string[];
  authorName: string;
  authorAvatar?: string;
  description?: string;
  likesCount: number;
  commentsCount?: number;
  savesCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  tags: string[];
  createdAt?: string;
  service?: unknown;
};

const unwrapFeed = (payload: unknown): FeedItem[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const response = payload as { data?: unknown; items?: unknown; results?: unknown };
  for (const key of ['data', 'items', 'results']) {
    const value = response[key as keyof typeof response];
    if (Array.isArray(value)) return value as FeedItem[];
  }
  return [];
};

export const getFeed = async (page: number = 1, limit: number = 20): Promise<FeedItem[]> => {
  const { data } = await api.get(`/Feed?page=${page}&limit=${limit}`);
  return unwrapFeed(data);
};
