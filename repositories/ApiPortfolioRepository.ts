import { api } from '../services/api';
import { IPortfolioRepository } from './IPortfolioRepository';
import { PortfolioItemDto, CreatePortfolioItemRequest, PortfolioCommentDto } from '../types/portfolio';
import { useAuthStore } from '../store/useAuthStore';

export class ApiPortfolioRepository implements IPortfolioRepository {
  async getPortfolio(muaId: string): Promise<PortfolioItemDto[]> {
    if (muaId === 'me' && !useAuthStore.getState().user) return [];
    const endpoint = muaId === 'me' ? '/Mua/portfolio/me' : `/Mua/${muaId}/portfolio`;
    const response = await api.get(endpoint);
    return (response.data || []).map((item: any) => ({
        ...item,
        id: item.id || item.portfolioId,
        imageUrl: item.imageUrl || item.imageUrls?.[0] || '',
        imageUrls: item.imageUrls || [],
        category: item.category || (item.tags || []).join(', '),
        isCover: Boolean(item.isCover || item.isPinned),
        order: Number(item.order || 0),
        updatedAt: item.updatedAt || item.createdAt,
    }));
  }

  async createItem(muaId: string, data: CreatePortfolioItemRequest): Promise<PortfolioItemDto> {
    const response = await api.post(`/Mua/portfolio`, data);
    return response.data;
  }

  async updateItem(id: string, data: Partial<CreatePortfolioItemRequest>): Promise<PortfolioItemDto> {
    const response = await api.put(`/mua/portfolio/${id}`, data);
    return response.data;
  }

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/mua/portfolio/${id}`);
  }

  async setVisibility(id: string, isHidden: boolean): Promise<void> {
    await api.patch(`/Mua/portfolio/${id}/visibility`, { isHidden });
  }

  async toggleLike(id: string): Promise<void> {
    await api.post(`/Mua/portfolio/${id}/like`);
  }

  async toggleSave(id: string): Promise<void> {
    await api.post(`/Mua/portfolio/${id}/save`);
  }

  async getComments(id: string): Promise<PortfolioCommentDto[]> {
    const response = await api.get<PortfolioCommentDto[]>(`/Mua/portfolio/${id}/comments`);
    return response.data;
  }

  async addComment(id: string, content: string): Promise<PortfolioCommentDto> {
    const response = await api.post<PortfolioCommentDto>(`/Mua/portfolio/${id}/comments`, { content });
    return response.data;
  }

  async replyToComment(id: string, commentId: string, content: string): Promise<PortfolioCommentDto> {
    const response = await api.post<PortfolioCommentDto>(`/Mua/portfolio/${id}/comments/${commentId}/replies`, { content });
    return response.data;
  }

  async getFavorites(type: 'liked' | 'saved'): Promise<PortfolioItemDto[]> {
    const response = await api.get<PortfolioItemDto[]>('/Mua/portfolio/favorites', { params: { type } });
    return response.data;
  }

}
