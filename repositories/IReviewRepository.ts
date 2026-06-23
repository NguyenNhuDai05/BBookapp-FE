import type { ReviewDto, CreateReviewRequest } from '../types/ReviewDto';

export interface IReviewRepository {
  getByMua(muaId: string): Promise<ReviewDto[]>;
  createForBooking(request: CreateReviewRequest): Promise<void>;
  replyToReview(reviewId: string, replyContent: string): Promise<void>;
}
