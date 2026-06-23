import type { HomeData, ExploreData, UpcomingBooking } from '../types/home';

export interface IHomeRepository {
  getHomeData(): Promise<HomeData>;
  getExploreData(): Promise<ExploreData>;
  getUpcomingBooking(): Promise<UpcomingBooking | null>;
}
