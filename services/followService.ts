import { api } from './api';
export type FollowStatus = { muaId: string; isFollowing: boolean; followersCount: number };
export type FollowedMua = { muaId: string; name: string; avatarUrl?: string };
export const followService = {
  status: async (id: string): Promise<FollowStatus> => (await api.get('/Follow/' + encodeURIComponent(id))).data,
  set: async (id: string, following: boolean): Promise<FollowStatus> =>
    (await (following ? api.put('/Follow/' + encodeURIComponent(id)) : api.delete('/Follow/' + encodeURIComponent(id)))).data,
  list: async (page: number): Promise<FollowedMua[]> => (await api.get('/Follow', { params: { page, limit: 20 } })).data,
};
