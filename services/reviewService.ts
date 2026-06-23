import { ApiReviewRepository } from '../repositories/ApiReviewRepository';
import type { IReviewRepository } from '../repositories/IReviewRepository';
import type { ReviewDto, CreateReviewRequest } from '../types/ReviewDto';

class ReviewService {
  private repository: IReviewRepository;

  constructor(repository: IReviewRepository) {
    this.repository = repository;
  }

  async getByMua(muaId: string): Promise<ReviewDto[]> {
    return this.repository.getByMua(muaId);
  }

  async createForBooking(bookingId: string, rating: number, comment?: string): Promise<void> {
    return this.repository.createForBooking({ bookingId, rating, comment });
  }

  async replyToReview(reviewId: string, replyContent: string): Promise<void> {
    return this.repository.replyToReview(reviewId, replyContent);
  }
}

export const reviewService = new ReviewService(new ApiReviewRepository());

export const formatReviewDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
