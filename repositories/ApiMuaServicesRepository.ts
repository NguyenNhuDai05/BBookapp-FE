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
  isActive?: boolean;
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
  status: service.isActive === false ? 'INACTIVE' : 'ACTIVE',
  visibility: service.isActive !== false,
});

export class ApiMuaServicesRepository implements IMuaServicesRepository {
  async getServices(muaId: string): Promise<ServiceDto[]> {
    const endpoint = muaId === 'me' ? '/Mua/service/me' : `/Mua/${muaId}/service`;
    const response = await api.get<BackendServiceDto[]>(endpoint);
    return (response.data || []).map(mapService);
  }

  async createService(muaId: string, data: CreateServiceRequest): Promise<ServiceDto> {
    const id = muaId === 'me' ? useAuthStore.getState().user?.id : muaId;
    if (!id) throw new Error('Not authenticated');
    const response = await api.post<{ service: BackendServiceDto }>(`/Mua/${id}/service`, data);
    return mapService(response.data.service);
  }

  async updateService(id: string, data: UpdateServiceRequest): Promise<ServiceDto> {
    await api.put(`/Mua/service/${id}`, data);
    return { id, serviceId: id, name: data.serviceName, ...data };
  }

  async deleteService(id: string): Promise<void> {
    await api.delete(`/Mua/service/${id}`);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await api.patch(`/Mua/service/${id}/active`, { isActive });
  }
}

