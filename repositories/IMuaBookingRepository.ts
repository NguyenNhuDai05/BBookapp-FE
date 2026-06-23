import type { BookingDto, BookingStatus } from '../types/booking';

export interface IMuaBookingRepository {
  getPendingBookings(muaId: string): Promise<BookingDto[]>;
  getAllBookings(muaId: string): Promise<BookingDto[]>;
  updateBookingStatus(bookingId: string, status: BookingStatus, reason?: string): Promise<BookingDto>;
  getEarningsSnapshot(muaId: string): Promise<{ today: number; month: number; pending: number }>;
}
