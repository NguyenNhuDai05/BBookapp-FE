export type ServiceStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface ServiceDto {
  id: string;
  serviceId?: string;
  name: string;
  serviceName?: string;
  description?: string;
  durationMinutes: number;
  price: number;
  category?: string;
  travelAvailable?: boolean;
  visibility?: boolean;
  status?: ServiceStatus;
  isPopular?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  tags?: string[];
}

export interface CreateServiceRequest {
  imageUrls?: string[];
  isActive?: boolean;
  serviceName: string;
  description?: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
  tags: string[];
}

export type UpdateServiceRequest = CreateServiceRequest;
