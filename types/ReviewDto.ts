export interface ReviewDto {
  reviewId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  muaId: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
  muaReply?: string;
  muaReplyAt?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}
