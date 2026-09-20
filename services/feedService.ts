import { api } from "./api";

export type FeedItem = Record<string, any>;

const unwrapFeed = (payload: unknown): FeedItem[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const response = payload as Record<string, unknown>;
  for (const key of ['data', 'items', 'results']) {
    if (Array.isArray(response[key])) return response[key] as FeedItem[];
  }
  return [];
};

export const getFeed = async (page: number = 1, limit: number = 20): Promise<FeedItem[]> => {
  const { data } = await api.get(`/Feed?page=${page}&limit=${limit}`);
  return unwrapFeed(data);
};
