import { IMuaRepository } from '../repositories/IMuaRepository';
import { ApiMuaRepository } from '../repositories/ApiMuaRepository';
import { ArtistDto, PortfolioImageDto } from '../types/ArtistDto';
import { ServiceDto } from '../types/ServiceDto';

export class MuaService {
  private repository: IMuaRepository;

  constructor(repository: IMuaRepository) {
    this.repository = repository;
  }

  async getArtists(): Promise<ArtistDto[]> {
    return this.repository.getArtists();
  }

  async getArtistById(id: string): Promise<ArtistDto | null> {
    return this.repository.getArtistById(id);
  }

  async getArtistServices(id: string): Promise<ServiceDto[]> {
    return this.repository.getArtistServices(id);
  }

  async getArtistPortfolio(id: string): Promise<PortfolioImageDto[]> {
    return this.repository.getArtistPortfolio(id);
  }
}

// Instantiate with Api for now
export const muaService = new MuaService(new ApiMuaRepository());
