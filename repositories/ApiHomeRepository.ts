import { api } from '../services/api';
import { IHomeRepository } from './IHomeRepository';
import type { HomeData, ExploreData, UpcomingBooking } from '../types/home';

export class ApiHomeRepository implements IHomeRepository {
  async getHomeData(): Promise<HomeData> {
    try {
      const { data } = await api.get('/Home/data');
      return data;
    } catch (e) {
      console.error('Failed to get HomeData', e);
      throw e;
    }
  }

  async getExploreData(): Promise<ExploreData> {
    try {
      const { data } = await api.get('/Home/explore');
      return data;
    } catch (e) {
      console.error('Failed to get ExploreData', e);
      throw e;
    }
  }

  async getUpcomingBooking(): Promise<UpcomingBooking | null> {
    try {
      const { data } = await api.get('/Booking/upcoming');
      return data;
    } catch (e) {
      // If no upcoming booking exists, return null
      return null;
    }
  }
}
