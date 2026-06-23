import { api } from '../services/api';
import { IBookingRepository } from './IBookingRepository';
import { BookingDto, TimeSlotDto, CreateBookingRequest, CancelBookingRequest, SelectedServiceDto, BookingStatus } from '../types/booking';

export class ApiBookingRepository implements IBookingRepository {
  async getAvailableTimeSlots(muaId: string, date: string): Promise<TimeSlotDto[]> {
    // For MVP: Allow selecting any time between 08:00 and 20:00
    const slots: TimeSlotDto[] = [];
    for (let i = 8; i <= 20; i++) {
      slots.push({ time: `${i.toString().padStart(2, '0')}:00`, available: true });
      if (i < 20) {
        slots.push({ time: `${i.toString().padStart(2, '0')}:30`, available: true });
      }
    }
    // Simulate a slight network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return slots;
  }

  async createBooking(request: CreateBookingRequest): Promise<BookingDto> {
    try {
      const { data } = await api.post('/Booking/create', {
        muaId: request.muaId,
        bookingDate: request.date,
        startTime: `${request.time}:00`,
        address: request.address,
        notes: request.note,
        services: request.services.map(s => ({
          serviceId: s.serviceId,
          participantsCount: s.participantsCount
        }))
      });
      return this.mapToBookingDto(data);
    } catch (e: any) {
      console.error('API Error creating booking:', e.response?.data || e.message);
      throw e;
    }
  }

  async getUserBookings(): Promise<BookingDto[]> {
    const { data } = await api.get('/Booking?viewAs=customer');
    return data.map((b: any) => this.mapToBookingDto(b));
  }

  async getBookingDetail(bookingId: string): Promise<BookingDto> {
    const { data } = await api.get(`/Booking/${bookingId}`);
    return this.mapToBookingDto(data);
  }

  async cancelBooking(request: CancelBookingRequest): Promise<BookingDto> {
    try {
      const { data } = await api.put(`/Booking/${request.bookingId}/status`, {
        status: 3, // 3 corresponds to BookingStatus.Cancelled in C#
        reason: request.reason
      });
      return this.mapToBookingDto(data);
    } catch (e: any) {
      console.error('API Error cancelling booking:', e.response?.data || e.message);
      throw e;
    }
  }

  async confirmBookingCompletion(bookingId: string): Promise<BookingDto> {
    try {
      const { data } = await api.put(`/Booking/${bookingId}/status`, {
        status: 2 // 2 corresponds to BookingStatus.Completed in C# enum
      });
      return this.mapToBookingDto(data);
    } catch (e: any) {
      console.error('API Error confirming completion:', e.response?.data || e.message);
      throw e;
    }
  }

  private mapToBookingDto(b: any): BookingDto {
    // Format StartTime (e.g., "08:00:00" -> "08:00")
    const timeStr = b.startTime ? String(b.startTime).substring(0, 5) : "00:00";
    
    // Format Date (e.g., "2026-06-21T00:00:00" -> "2026-06-21")
    const dateStr = b.bookingDate ? String(b.bookingDate).substring(0, 10) : "";

    const services: SelectedServiceDto[] = (b.services || []).map((s: any) => ({
      id: s.serviceId,
      name: s.serviceName,
      durationMinutes: s.durationMinutes,
      price: s.price,
      participantsCount: s.participantsCount,
      description: s.description || s.serviceDescription || undefined,
      imageUrl: s.imageUrl || s.image || undefined
    }));

    return {
      id: b.bookingId,
      mua: {
        id: b.muaId,
        name: b.muaName || 'MUA',
        avatarUrl: b.muaAvatarUrl || 'https://via.placeholder.com/150',
        rating: 5.0,
        reviewCount: 0,
        location: '',
        yearsOfExp: 0
      },
      customer: {
        id: b.customerId,
        name: b.customerName || 'Khách hàng',
        phone: '',
        avatarUrl: b.customerAvatarUrl || 'https://via.placeholder.com/150'
      },
      services,
      date: dateStr,
      time: timeStr,
      address: b.address || '',
      locationType: 'HOME_SERVICE', // Default fallback
      status: this.mapStatus(b.status),
      note: b.notes,
      
      serviceTotal: b.totalAmount || 0, // Simplified for now
      travelFee: 0,
      totalAmount: b.totalAmount || 0,
      depositAmount: (b.totalAmount || 0) * 0.3,
      remainingAmount: (b.totalAmount || 0) * 0.7,
      
      paymentMethod: 'CASH', // Fallback
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.createdAt || new Date().toISOString(),
      isReviewed: b.hasReview || false
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

  async submitReview(request: ReviewCreateRequest): Promise<void> {
    try {
      const response = await api.post(`/Review/booking/${request.bookingId}`, {
        rating: request.rating,
        comment: request.comment,
        imageUrl: request.imageUrl,
      });
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi gửi đánh giá:', error.response?.data || error.message);
      if (error.response?.data) {
        const data = error.response.data;
        const msg = data.message || data.title || JSON.stringify(data);
        throw new Error(msg);
      }
      throw error;
    }
  }

  async replyToReview(reviewId: string, replyContent: string): Promise<void> {
    try {
      const response = await api.post(`/Review/${reviewId}/reply`, {
        replyContent
      });
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi phản hồi đánh giá:', error.response?.data || error.message);
      if (error.response?.data) {
        const data = error.response.data;
        const msg = data.message || data.title || JSON.stringify(data);
        throw new Error(msg);
      }
      throw error;
    }
  }
}
