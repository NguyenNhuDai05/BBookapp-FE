import { api } from '../services/api';
import { IPortfolioRepository } from './IPortfolioRepository';
import { PortfolioItemDto, CreatePortfolioItemRequest } from '../types/portfolio';
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

  async reorderItems(muaId: string, itemIds: string[]): Promise<void> {
    await api.put(`/mua/portfolio/reorder`, { itemIds });
  }

  async setCoverPhoto(muaId: string, itemId: string): Promise<void> {
    await api.put(`/mua/portfolio/${itemId}/cover`);
  }
}
