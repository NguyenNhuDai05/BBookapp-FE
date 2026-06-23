import { IBookingRepository } from '../repositories/IBookingRepository';
import { ApiBookingRepository } from '../repositories/ApiBookingRepository';
import { BookingDto, TimeSlotDto, CreateBookingRequest, CancelBookingRequest, ReviewCreateRequest } from '../types/booking';

class BookingService {
  private repository: IBookingRepository;

  constructor(repository: IBookingRepository) {
    this.repository = repository;
  }

  async getAvailableTimeSlots(muaId: string, date: string): Promise<TimeSlotDto[]> {
    return this.repository.getAvailableTimeSlots(muaId, date);
  }

  async createBooking(request: CreateBookingRequest): Promise<BookingDto> {
    return this.repository.createBooking(request);
  }

  async getUserBookings(): Promise<BookingDto[]> {
    return this.repository.getUserBookings();
  }

  async getBookingDetail(bookingId: string): Promise<BookingDto> {
    return this.repository.getBookingDetail(bookingId);
  }

  async cancelBooking(request: CancelBookingRequest): Promise<BookingDto> {
    return this.repository.cancelBooking(request);
  }

  async confirmBookingCompletion(bookingId: string): Promise<BookingDto> {
    return this.repository.confirmBookingCompletion(bookingId);
  }

  async submitReview(request: ReviewCreateRequest): Promise<void> {
    return this.repository.submitReview(request);
  }

  async replyToReview(reviewId: string, replyContent: string): Promise<void> {
    return this.repository.replyToReview(reviewId, replyContent);
  }
}

// Instantiate with Real API instead of Mock
export const bookingService = new BookingService(new ApiBookingRepository());
