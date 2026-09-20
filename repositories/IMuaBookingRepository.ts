import type { BookingDto, BookingStatus } from '../types/booking';
import type { MuaEarningsDto } from '../types/earnings';

export interface IMuaBookingRepository {
  getPendingBookings(muaId: string): Promise<BookingDto[]>;
  getAllBookings(muaId: string): Promise<BookingDto[]>;
  updateBookingStatus(bookingId: string, status: BookingStatus, reason?: string): Promise<BookingDto>;
  getEarningsSnapshot(): Promise<MuaEarningsDto>;
}
