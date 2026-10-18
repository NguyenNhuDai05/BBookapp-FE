import { api } from '../services/api';
import { IPortfolioRepository } from './IPortfolioRepository';
import { PortfolioItemDto, CreatePortfolioItemRequest, PortfolioCommentDto, PortfolioWriteAck } from '../types/portfolio';
import { useAuthStore } from '../store/useAuthStore';
import { normalizePortfolio } from '../utils/portfolio';
import { PortfolioUncertainWriteError } from '../utils/portfolioWrite';

function acknowledgement(value: unknown): PortfolioWriteAck {
  if (!value || typeof value !== 'object' || !('message' in value) || typeof value.message !== 'string') throw new PortfolioUncertainWriteError();
  return { message: value.message };
}

export class ApiPortfolioRepository implements IPortfolioRepository {
  async getPortfolio(muaId: string): Promise<PortfolioItemDto[]> {
    if (muaId === 'me' && !useAuthStore.getState().user) return [];
    const endpoint = muaId === 'me' ? '/Mua/portfolio/me' : `/Mua/${muaId}/portfolio`;
    const response = await api.get(endpoint);
    if (!Array.isArray(response.data)) throw new Error('Danh sách portfolio không hợp lệ. Vui lòng tải lại.');
    return response.data.map(normalizePortfolio);
  }

  async createItem(muaId: string, data: CreatePortfolioItemRequest): Promise<PortfolioWriteAck> {
    const response = await api.post(`/Mua/portfolio`, data);
    return acknowledgement(response.data);
  }

  async updateItem(id: string, data: Partial<CreatePortfolioItemRequest>): Promise<PortfolioWriteAck> {
    const response = await api.put(`/mua/portfolio/${id}`, data);
    return acknowledgement(response.data);
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
    if (!Array.isArray(response.data)) throw new Error('Danh sách portfolio không hợp lệ.');
    return response.data.map(normalizePortfolio);
  }

}
