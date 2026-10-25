import { api } from './api';
export type SharedProfile = { muaId: string; name: string; avatarUrl?: string; city?: string; bio?: string; url: string; qrSvg: string };
export type SharedPost = { id: string; muaId: string; name: string; avatarUrl?: string; city?: string; title?: string; description?: string; createdAt: string; images: string[]; tags: string[]; url: string; qrSvg: string };
export const profileSharingService = {
  get: async (id: string, signal?: AbortSignal): Promise<SharedProfile> => (await api.get(`/profile-sharing/${encodeURIComponent(id)}`, { signal })).data,
  getPost: async (id: string, signal?: AbortSignal): Promise<SharedPost> => (await api.get(`/post-sharing/${encodeURIComponent(id)}`, { signal })).data,
};
