import { isAxiosError } from 'axios';
import { api } from './api';
import type { ExploreFilters, ExploreHome, ExploreKind, ExplorePage } from '../types/explore';

export const exploreService = {
  async home(signal?: AbortSignal): Promise<ExploreHome> {
    const { data } = await api.get<ExploreHome>('/Explore', { signal });
    return data;
  },
  async search(kind: ExploreKind, filters: ExploreFilters, q: string, cursor?: string, signal?: AbortSignal): Promise<ExplorePage> {
    const { data } = await api.get<ExplorePage>('/Explore/search', {
      params: { kind, ...filters, q: q.trim() || undefined, cursor, limit: 12 }, signal,
    });
    return data;
  },
};
export function exploreErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 410) return 'Phiên khám phá đã hết hạn. Làm mới để xem nội dung mới nhất.';
  if (isAxiosError(error) && error.response?.status === 404) return 'Khám phá đang được cập nhật. Vui lòng thử lại sau.';
  if (isAxiosError(error) && (error.response?.status || 0) >= 500) return 'Máy chủ chưa tải được nội dung này. Vui lòng thử lại.';
  if (isAxiosError(error) && error.response?.status === 429) return 'Bạn đang thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.';
  return 'Không tải được nội dung. Vui lòng kiểm tra kết nối và thử lại.';
}
export function isExploreSessionError(error: unknown): boolean {
  return isAxiosError(error) && [400, 410].includes(error.response?.status || 0);
}
