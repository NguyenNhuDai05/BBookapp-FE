import { ServiceDto, CreateServiceRequest, UpdateServiceRequest } from '../types/ServiceDto';

export interface IMuaServicesRepository {
  getServices(muaId: string): Promise<ServiceDto[]>;
  createService(muaId: string, service: CreateServiceRequest): Promise<ServiceDto>;
  updateService(serviceId: string, updates: UpdateServiceRequest): Promise<ServiceDto>;
  deleteService(serviceId: string): Promise<void>;
}
