import { api } from "./api";

export interface ReviewItem {
  reviewId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  muaId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface BackendReview {
  reviewId: string;
  bookingId: string;
  customerId: string;
  customerName?: string;
  muaId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

const toReviewItem = (review: BackendReview): ReviewItem => ({
  reviewId: review.reviewId,
  bookingId: review.bookingId,
  customerId: review.customerId,
  customerName: review.customerName || "Khách hàng",
  muaId: review.muaId,
  rating: Number(review.rating || 0),
  comment: review.comment,
  createdAt: review.createdAt,
});

export const formatReviewDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const reviewService = {
  getByMua: async (muaId: string): Promise<ReviewItem[]> => {
    const response = await api.get(`/Review/mua/${muaId}`);
    const reviews: BackendReview[] = response.data;
    return reviews.map(toReviewItem);
  },

  createForBooking: async (
    bookingId: string,
    rating: number,
    comment?: string,
  ): Promise<void> => {
    await api.post("/Review", {
      bookingId,
      rating,
      comment,
    });
  },
};
