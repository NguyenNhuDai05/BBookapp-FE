import { api } from '../services/api';
import { IReviewRepository } from './IReviewRepository';
import type { ReviewDto } from '../types/ReviewDto';

export class ApiReviewRepository implements IReviewRepository {
  async getByMua(muaId: string): Promise<ReviewDto[]> {
    try {
      const { data } = await api.get(`/Review/mua/${muaId}`);
      return data;
    } catch (e) {
      console.error('Failed to get reviews', e);
      return [];
    }
  }

  async getRecentReviews(): Promise<ReviewDto[]> {
    try {
      const { data } = await api.get('/Reviews/recent');
      return data;
    } catch (e) {
      console.error('Failed to get recent reviews', e);
      return [];
    }
  }

  async createForBooking(request: { bookingId: string; rating: number; comment?: string }): Promise<void> {
    try {
      await api.post(`/Review/booking/${request.bookingId}`, {
        rating: request.rating,
        comment: request.comment
      });
    } catch (e) {
      console.error('Failed to create review', e);
      throw e;
    }
  }

  async replyToReview(reviewId: string, replyContent: string): Promise<void> {
    try {
      await api.post(`/Review/${reviewId}/reply`, { replyContent });
    } catch (e: any) {
      console.error('Failed to reply to review', e.response?.data || e.message);
      if (e.response?.data) {
        const data = e.response.data;
        throw new Error(data.message || data.title || JSON.stringify(data));
      }
      throw e;
    }
  }
}
