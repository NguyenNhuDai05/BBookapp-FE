export type ServiceStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface ServiceDto {
  id: string;
  name: string;
  serviceName?: string;
  description?: string;
  durationMinutes: number;
  price: number;
  category: string;
  travelAvailable: boolean;
  visibility: boolean;
  status: ServiceStatus;
  isPopular?: boolean;
  imageUrl?: string;
}

export type CreateServiceRequest = Omit<ServiceDto, 'id' | 'status'>;
export type UpdateServiceRequest = Partial<CreateServiceRequest> & { id: string; status?: ServiceStatus };
