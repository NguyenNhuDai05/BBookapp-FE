import { isAxiosError } from 'axios';
import { api } from "./api";
import { normalizePortfolio } from '../utils/portfolio';
import type { PortfolioTaggingDto } from '../types/portfolio';

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
  serviceId?: string | null;
  version?: number;
  tagging?: PortfolioTaggingDto;
};

export function normalizeFeedPortfolio(value: unknown): FeedItem {
  const item = normalizePortfolio(value);
  return { ...item, portfolioId: item.portfolioId || item.id, muaId: item.muaId || '', title: item.title || '',
    authorName: item.authorName || '', imageUrls: item.imageUrls || [], description: item.description || '',
    likesCount: item.likesCount || 0, tags: item.tags || [] };
}

const unwrapFeed = (payload: unknown): FeedItem[] => {
  if (Array.isArray(payload)) return payload.map(normalizeFeedPortfolio);
  if (!payload || typeof payload !== 'object') return [];

  const response = payload as { data?: unknown; items?: unknown; results?: unknown };
  for (const key of ['data', 'items', 'results']) {
    const value = response[key as keyof typeof response];
    if (Array.isArray(value)) return value.map(normalizeFeedPortfolio);
  }
  return [];
};

export const getFeed = async (page: number = 1, limit: number = 20): Promise<FeedItem[]> => {
  const { data } = await api.get(`/Feed?page=${page}&limit=${limit}`);
  return unwrapFeed(data);
};

export class FeedSessionExpiredError extends Error {
  constructor() { super('Phiên bảng tin đã hết hạn. Vui lòng làm mới để tiếp tục.'); }
}
export type FeedPage = { items: FeedItem[]; nextCursor: string | null };
export const getFeedPage = async (cursor?: string, limit = 10): Promise<FeedPage> => {
  try {
    const { data } = await api.get<FeedPage>('/Feed/scroll', { params: { cursor, limit } });
    return { ...data, items: data.items.map(normalizeFeedPortfolio) };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 410) throw new FeedSessionExpiredError();
    throw error;
  }
};
