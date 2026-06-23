import { api } from '../services/api';
import { IMuaRepository } from './IMuaRepository';
import { ArtistDto, PortfolioImageDto } from '../types/ArtistDto';
import { ServiceDto } from '../types/ServiceDto';

export class ApiMuaRepository implements IMuaRepository {
  async getArtists(): Promise<ArtistDto[]> {
    try {
      const { data } = await api.get('/Mua/search');
      return data.map((m: any) => ({
        id: m.muaId,
        name: m.fullName || 'Chuyên gia',
        avatar: m.avatarUrl || '',
        coverImage: m.portfolioCoverUrl || '',
        rating: m.averageRating || 0,
        reviewCount: m.totalBookings || 0,
        yearsExperience: m.experienceYears || 0,
        city: m.city || '',
        bio: m.bio || '',
        specialties: m.styles || [],
        portfolioImages: [],
        services: []
      }));
    } catch (e) {
      return [];
    }
  }

  async getArtistById(id: string): Promise<ArtistDto | null> {
    try {
      const { data } = await api.get(`/Mua/${id}`);
      if (!data) return null;

      return {
        id: data.muaId,
        name: data.fullName || 'Chuyên gia',
        avatar: data.avatarUrl || '',
        coverImage: data.portfolioCoverUrl || '',
        rating: data.averageRating || 0,
        reviewCount: data.totalBookings || 0,
        yearsExperience: data.experienceYears || 0,
        city: data.city || '',
        bio: data.bio || '',
        specialties: data.styles || [],
        portfolioImages: [],
        services: []
      };
    } catch (e) {
      return null;
    }
  }

  async getArtistServices(id: string): Promise<ServiceDto[]> {
    try {
      const { data } = await api.get(`/Mua/${id}/service`);
      if (!Array.isArray(data)) return [];
      
      return data.map((s: any) => ({
        id: s.serviceId,
        name: s.serviceName || s.name,
        serviceName: s.serviceName,
        description: s.description,
        durationMinutes: s.durationMinutes,
        price: s.price,
        categoryId: s.categoryId,
        imageUrl: s.imageUrl
      }));
    } catch (e) {
      return [];
    }
  }

  async getArtistPortfolio(id: string): Promise<PortfolioImageDto[]> {
    try {
      const { data } = await api.get(`/Mua/${id}/portfolio`);
      if (!Array.isArray(data)) return [];

      return data.map((p: any) => ({
        ...p,
        id: p.portfolioId,
        url: p.imageUrls?.[0] || '',
        imageUrl: p.imageUrls?.[0] || '', // Provide both mappings just in case
        imageUrls: p.imageUrls || [],
        title: p.title,
        description: p.description,
        tags: p.tags || []
      }));
    } catch (e) {
      return [];
    }
  }
}
