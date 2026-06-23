import { ApiHomeRepository } from '../repositories/ApiHomeRepository';
import type { IHomeRepository } from '../repositories/IHomeRepository';
import type { HomeData, ExploreData, UpcomingBooking } from '../types/home';

class HomeService {
  private repository: IHomeRepository;

  constructor(repository: IHomeRepository) {
    this.repository = repository;
  }

  async getUpcomingBooking(): Promise<UpcomingBooking | null> {
    return this.repository.getUpcomingBooking();
  }

  async getHomeData(): Promise<HomeData> {
    return this.repository.getHomeData();
  }

  async getExploreData(): Promise<ExploreData> {
    return this.repository.getExploreData();
  }
}

export const homeService = new HomeService(new ApiHomeRepository());
