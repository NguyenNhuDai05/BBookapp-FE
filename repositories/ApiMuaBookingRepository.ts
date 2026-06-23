import { api } from '../services/api';
import type { IMuaBookingRepository } from './IMuaBookingRepository';
import type { BookingDto, BookingStatus, SelectedServiceDto } from '../types/booking';

export class ApiMuaBookingRepository implements IMuaBookingRepository {
  
  async getPendingBookings(muaId: string): Promise<BookingDto[]> {
    const allBookings = await this.getAllBookings(muaId);
    return allBookings.filter(b => b.status === 'PENDING');
  }

  async getAllBookings(muaId: string): Promise<BookingDto[]> {
    try {
      // The backend returns all bookings for the currently authenticated MUA
      const { data } = await api.get('/Booking?viewAs=mua');
      return data.map((b: any) => this.mapToBookingDto(b));
    } catch (e) {
      console.error('Error fetching MUA bookings:', e);
      return [];
    }
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus, reason?: string): Promise<BookingDto> {
    const statusEnumValues: Record<BookingStatus, number> = {
      'PENDING': 0,
      'CONFIRMED': 1, // Approved
      'IN_PROGRESS': 1, // Map to Approved for now since C# doesn't have InProgress
      'COMPLETED': 2, // Completed
      'CANCELLED': 3, // Cancelled
      'REJECTED': 3, // Map to Cancelled
      'WAITING_CUSTOMER': 4 // WaitingCustomer
    };

    const { data } = await api.put(`/Booking/${bookingId}/status`, {
      status: statusEnumValues[status],
      reason: reason
    });

    return this.mapToBookingDto(data);
  }

  async getEarningsSnapshot(muaId: string): Promise<{ today: number; month: number; pending: number }> {
    try {
      const allBookings = await this.getAllBookings(muaId);
      
      const now = new Date();
      const todayStr = now.toISOString().substring(0, 10);
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let todayEarned = 0;
      let monthEarned = 0;
      let pendingEarned = 0;

      for (const b of allBookings) {
        if (b.status === 'COMPLETED') {
          const bDate = new Date(b.date); // b.date is YYYY-MM-DD
          
          if (b.date === todayStr) {
            todayEarned += b.totalAmount;
          }
          if (bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
            monthEarned += b.totalAmount;
          }
        } else if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
          pendingEarned += b.totalAmount;
        }
      }

      return {
        today: todayEarned,
        month: monthEarned,
        pending: pendingEarned
      };
    } catch (e) {
      return { today: 0, month: 0, pending: 0 };
    }
  }

  private mapToBookingDto(b: any): BookingDto {
    const timeStr = b.startTime ? String(b.startTime).substring(0, 5) : "00:00";
    const dateStr = b.bookingDate ? String(b.bookingDate).substring(0, 10) : "";

    const services: SelectedServiceDto[] = (b.services || []).map((s: any) => ({
      id: s.serviceId,
      name: s.serviceName,
      durationMinutes: s.durationMinutes,
      price: s.price,
      participantsCount: s.participantsCount
    }));

    return {
      id: b.bookingId,
      mua: {
        id: b.muaId,
        name: b.muaName || 'MUA',
        avatarUrl: 'https://via.placeholder.com/150', // Backend BookingDto doesn't include MUA avatar, fallback
        rating: 5.0,
        reviewCount: 0,
        location: '',
        yearsOfExp: 0
      },
      customer: {
        id: b.customerId,
        name: b.customerName || 'Khách hàng',
        phone: '',
        avatarUrl: 'https://via.placeholder.com/150' // Placeholder for customer
      },
      services,
      date: dateStr,
      time: timeStr,
      address: b.address || '',
      locationType: 'HOME_SERVICE', // Default fallback
      status: this.mapStatus(b.status),
      note: b.notes,
      
      serviceTotal: b.totalAmount || 0,
      travelFee: 0,
      totalAmount: b.totalAmount || 0,
      depositAmount: (b.totalAmount || 0) * 0.3,
      remainingAmount: (b.totalAmount || 0) * 0.7,
      
      paymentMethod: 'CASH',
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.createdAt || new Date().toISOString()
    };
  }

  private mapStatus(statusRaw: any): BookingStatus {
    const statusMap: Record<number | string, BookingStatus> = {
      0: 'PENDING',
      1: 'CONFIRMED', // Approved in C#
      2: 'COMPLETED', // Completed in C#
      3: 'CANCELLED', // Cancelled in C#
      4: 'WAITING_CUSTOMER', // WaitingCustomer in C#
      'Pending': 'PENDING',
      'Approved': 'CONFIRMED',
      'Completed': 'COMPLETED',
      'Cancelled': 'CANCELLED',
      'WaitingCustomer': 'WAITING_CUSTOMER'
    };
    return statusMap[statusRaw] || 'PENDING';
  }
}
