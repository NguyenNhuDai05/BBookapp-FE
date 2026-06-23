import { ArtistDto, PortfolioImageDto } from '../types/ArtistDto';
import { ServiceDto } from '../types/ServiceDto';

export interface IMuaRepository {
  getArtists(): Promise<ArtistDto[]>;
  getArtistById(id: string): Promise<ArtistDto | null>;
  getArtistServices(id: string): Promise<ServiceDto[]>;
  getArtistPortfolio(id: string): Promise<PortfolioImageDto[]>;
}
