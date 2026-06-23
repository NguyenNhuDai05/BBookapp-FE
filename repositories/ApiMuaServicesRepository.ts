import { api } from '../services/api';
import { IMuaServicesRepository } from './IMuaServicesRepository';
import { ServiceDto, CreateServiceRequest, UpdateServiceRequest } from '../types/ServiceDto';
import { useAuthStore } from '../store/useAuthStore';

export class ApiMuaServicesRepository implements IMuaServicesRepository {
  async getServices(muaId: string): Promise<ServiceDto[]> {
    try {
      let id = muaId;
      if (id === 'me') {
        const user = useAuthStore.getState().user;
        if (!user) return [];
        id = user.id;
      }
      const response = await api.get(`/Mua/${id}/service`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async createService(muaId: string, data: CreateServiceRequest): Promise<ServiceDto> {
    const response = await api.post(`/Mua/${muaId}/service`, data);
    return response.data?.Service || response.data;
  }

  async updateService(id: string, data: UpdateServiceRequest): Promise<ServiceDto> {
    const response = await api.put(`/Mua/service/${id}`, data);
    return response.data?.Service || response.data;
  }

  async deleteService(id: string): Promise<void> {
    await api.delete(`/Mua/service/${id}`);
  }
}

