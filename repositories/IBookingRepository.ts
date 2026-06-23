import { BookingDto, TimeSlotDto, CreateBookingRequest, CancelBookingRequest, ReviewCreateRequest } from '../types/booking';

export interface IBookingRepository {
  getAvailableTimeSlots(muaId: string, date: string): Promise<TimeSlotDto[]>;
  createBooking(request: CreateBookingRequest): Promise<BookingDto>;
  getUserBookings(): Promise<BookingDto[]>;
  getBookingDetail(bookingId: string): Promise<BookingDto>;
  cancelBooking(request: CancelBookingRequest): Promise<BookingDto>;
  confirmBookingCompletion(bookingId: string): Promise<BookingDto>;
  submitReview(request: ReviewCreateRequest): Promise<void>;
  replyToReview(reviewId: string, replyContent: string): Promise<void>;
}
