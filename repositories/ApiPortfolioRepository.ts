import { api } from '../services/api';
import { IPortfolioRepository } from './IPortfolioRepository';
import { PortfolioItemDto, CreatePortfolioItemRequest, PortfolioCommentDto } from '../types/portfolio';
import { useAuthStore } from '../store/useAuthStore';

export class ApiPortfolioRepository implements IPortfolioRepository {
  async getPortfolio(muaId: string): Promise<PortfolioItemDto[]> {
    try {
      let id = muaId;
      if (id === 'me') {
        const user = useAuthStore.getState().user;
        if (!user) return [];
        id = user.id;
      }
      const endpoint = `/mua/${id}/portfolio`;
      const response = await api.get(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return [];
    }
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
