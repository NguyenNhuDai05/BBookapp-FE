import { ServiceDto } from './ServiceDto';

export interface PortfolioImageDto {
  id: string;
  url: string;
  imageUrl?: string;
  image?: string;
  imageUrls?: string[];
  title?: string;
  description?: string;
  tags?: string[];
}

export interface ArtistDto {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  city: string;
  bio: string;
  specialties: string[];
  portfolioImages: PortfolioImageDto[];
  services: ServiceDto[];
}
