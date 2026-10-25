import { api } from './api';
export type FollowStatus = { muaId: string; isFollowing: boolean; followersCount: number };
export type FollowedMua = { muaId: string; name: string; avatarUrl?: string };
export type FollowerSummary = { muaId: string; followersCount: number };
export type Follower = { userId: string; name: string; avatarUrl?: string; followedAt: string; publicMuaId?: string };
export type FollowerPage = { items: Follower[]; totalCount: number; nextCursor: string | null; hasMore: boolean };
export const followService = {
  ownSummary: async (): Promise<FollowerSummary> => (await api.get('/Follow/me/summary')).data,
  followers: async (cursor: string | null, q: string, signal?: AbortSignal): Promise<FollowerPage> =>
    (await api.get('/Follow/me/followers', { params: { cursor: cursor || undefined, q: q || undefined, limit: 20 }, signal })).data,
  status: async (id: string): Promise<FollowStatus> => (await api.get('/Follow/' + encodeURIComponent(id))).data,
  set: async (id: string, following: boolean): Promise<FollowStatus> =>
    (await (following ? api.put('/Follow/' + encodeURIComponent(id)) : api.delete('/Follow/' + encodeURIComponent(id)))).data,
  list: async (page: number): Promise<FollowedMua[]> => (await api.get('/Follow', { params: { page, limit: 20 } })).data,
};
