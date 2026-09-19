import { api } from '../services/api';
import { IMuaServicesRepository } from './IMuaServicesRepository';
import { ServiceDto, CreateServiceRequest, UpdateServiceRequest } from '../types/ServiceDto';
import { useAuthStore } from '../store/useAuthStore';

interface BackendServiceDto {
  serviceId: string;
  serviceName?: string;
  description?: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
  tags?: string[];
}

const mapService = (service: BackendServiceDto): ServiceDto => ({
  id: service.serviceId,
  serviceId: service.serviceId,
  name: service.serviceName || '',
  serviceName: service.serviceName,
  description: service.description,
  durationMinutes: service.durationMinutes,
  price: service.price,
  imageUrl: service.imageUrl,
  tags: service.tags || [],
});

export class ApiMuaServicesRepository implements IMuaServicesRepository {
  async getServices(muaId: string): Promise<ServiceDto[]> {
    try {
      let id = muaId;
      if (id === 'me') {
        const user = useAuthStore.getState().user;
        if (!user) return [];
        id = user.id;
      }
      const response = await api.get<BackendServiceDto[]>(`/Mua/${id}/service`);
      return (response.data || []).map(mapService);
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async createService(muaId: string, data: CreateServiceRequest): Promise<ServiceDto> {
    const response = await api.post<{ service: BackendServiceDto }>(`/Mua/${muaId}/service`, data);
    return mapService(response.data.service);
  }

  async updateService(id: string, data: UpdateServiceRequest): Promise<ServiceDto> {
    await api.put(`/Mua/service/${id}`, data);
    return { id, serviceId: id, name: data.serviceName, ...data };
  }

  async deleteService(id: string): Promise<void> {
    await api.delete(`/Mua/service/${id}`);
  }
}

