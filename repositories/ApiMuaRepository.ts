import { api } from '../services/api';
import { IMuaRepository } from './IMuaRepository';
import { ArtistDto, PortfolioImageDto } from '../types/ArtistDto';
import { ServiceDto } from '../types/ServiceDto';

export class ApiMuaRepository implements IMuaRepository {
  async getArtists(): Promise<ArtistDto[]> {
    const { data } = await api.get<MuaProfileResponse[]>('/Mua');
    return data.map(mapMuaProfile);
  }

  async getArtistById(id: string): Promise<ArtistDto | null> {
    const { data } = await api.get<MuaProfileResponse | null>(`/Mua/${id}`);
    return data ? mapMuaProfile(data) : null;
  }

  async getArtistServices(id: string): Promise<ServiceDto[]> {
    const { data } = await api.get<ServiceResponse[]>(`/Mua/${id}/service`);
    return data.map((s) => ({
      id: s.serviceId,
      serviceId: s.serviceId,
      name: s.serviceName || '',
      serviceName: s.serviceName ?? undefined,
      description: s.description,
      durationMinutes: s.durationMinutes,
      price: s.price,
      category: s.category || '',
      travelAvailable: Boolean(s.travelAvailable),
      visibility: s.visibility !== false,
      status: s.status || 'ACTIVE',
      imageUrl: s.imageUrl,
    }));
  }

  async getArtistPortfolio(id: string): Promise<PortfolioImageDto[]> {
    const { data } = await api.get<PortfolioResponse[]>(`/Mua/${id}/portfolio`);
    return data.map((p) => ({
      ...p,
      id: p.portfolioId,
      url: p.imageUrls?.[0] || '',
      imageUrl: p.imageUrls?.[0] || '',
      imageUrls: p.imageUrls || [],
      tags: p.tags || [],
    }));
  }
}

type MuaProfileResponse = {
  muaId: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  portfolioCoverUrl?: string | null;
  averageRating: number;
  reviewCount: number;
  totalBookings: number;
  minPrice?: number | null;
  experienceYears: number;
  city?: string | null;
  bio?: string | null;
  styles?: string[] | null;
};

type ServiceResponse = {
  serviceId: string;
  serviceName?: string | null;
  description?: string;
  durationMinutes: number;
  price: number;
  category?: string;
  travelAvailable?: boolean;
  visibility?: boolean;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  imageUrl?: string;
};

type PortfolioResponse = {
  portfolioId: string;
  url?: string;
  imageUrl?: string;
  imageUrls?: string[];
  title?: string;
  description?: string;
  tags?: string[];
};

const mapMuaProfile = (m: MuaProfileResponse): ArtistDto => ({
        id: m.muaId,
        name: m.fullName || 'Chuyên gia',
        avatar: m.avatarUrl || '',
        coverImage: m.portfolioCoverUrl || '',
        rating: m.averageRating,
        reviewCount: m.reviewCount,
        completedBookingsCount: m.totalBookings,
        minPrice: m.minPrice ?? null,
        yearsExperience: m.experienceYears || 0,
        city: m.city || '',
        bio: m.bio || '',
        specialties: m.styles || [],
        portfolioImages: [],
        services: []
});
