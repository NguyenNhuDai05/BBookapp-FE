import { api } from '../services/api';
import { IBookingRepository } from './IBookingRepository';
import { BookingDto, BookingPaymentDto, TimeSlotDto, CreateBookingRequest, CancelBookingRequest, SelectedServiceDto, BookingStatus, ReviewCreateRequest } from '../types/booking';
import { mapBookingPaymentStatus, mapBookingStatus, mapPaymentStatus, mapRefundSummary } from '../utils/bookingStatus';

export class ApiBookingRepository implements IBookingRepository {
  async getAvailableTimeSlots(muaId: string, date: string, durationMinutes: number): Promise<TimeSlotDto[]> {
    const { data } = await api.get<unknown>(`/Mua/${muaId}/availability`, {
      params: { date, duration: durationMinutes },
    });

    if (!Array.isArray(data)) throw new Error('Dữ liệu giờ trống không hợp lệ.');

    return data.map((value) => {
      const time = String(value).slice(0, 5);
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new Error('Dữ liệu giờ trống không hợp lệ.');
      }
      return { time, available: true };
    });
  }

  async createBooking(request: CreateBookingRequest): Promise<BookingDto> {
    try {
      const { data } = await api.post('/Booking/create', {
        idempotencyKey: request.idempotencyKey,
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
      return this.mapToBookingDto(data.booking || data.Booking || data);
    } catch (e: any) {
      const errorCode = e.response?.data?.code || e.response?.data?.Code;
      // Insufficient balance is an expected business response handled by the
      // checkout screen, not an application error that should flood the log.
      if (errorCode !== 'INSUFFICIENT_BALANCE') {
        console.error('API Error creating booking:', e.response?.data || e.message);
      }
      throw e;
    }
  }

  async createDepositPayment(bookingId: string): Promise<BookingPaymentDto> {
    const { data } = await api.post(`/Booking/${bookingId}/deposit-payment`);
    return {
      paymentId: data.paymentId,
      bookingId: data.bookingId,
      orderCode: data.orderCode,
      amount: data.amount,
      status: this.mapPaymentAttemptStatus(data.status),
      checkoutUrl: data.checkoutUrl,
      qrCode: data.qrCode,
      expiresAt: data.expiresAt,
      paidAt: data.paidAt,
    };
  }

  async disputeBooking(bookingId: string, reason: string): Promise<BookingDto> {
    const { data } = await api.put(`/Booking/${bookingId}/status`, { status: 9, reason });
    return this.mapToBookingDto(data);
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
    const { data } = await api.put(`/Booking/${request.bookingId}/status`, {
      status: 3, // 3 corresponds to BookingStatus.Cancelled in C#
      reason: request.note?.trim()
        ? `${request.reason}: ${request.note.trim()}`
        : request.reason
    });
    return this.mapToBookingDto(data);
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
      status: mapBookingStatus(b.status),
      paymentStatus: mapPaymentStatus(b.paymentStatus),
      note: b.notes,
      
      serviceTotal: b.totalAmount ?? 0, // Backend currently exposes the aggregate service total here
      travelFee: 0,
      totalAmount: b.totalAmount ?? 0,
      depositRate: b.depositRate ?? 0,
      depositAmount: b.depositAmount ?? 0,
      platformFeeAmount: b.platformFeeAmount ?? 0,
      muaPayoutAmount: b.muaPayoutAmount ?? 0,
      remainingAmount: b.remainingAmount ?? 0,
      
      paymentMethod: 'payOS',
      createdAt: b.createdAt ?? '',
      updatedAt: b.updatedAt ?? '',
      isReviewed: b.hasReview || false,
      depositPaidAt: b.depositPaidAt,
      confirmedAt: b.confirmedAt,
      startedAt: b.startedAt,
      waitingCustomerAt: b.waitingCustomerAt,
      customerConfirmationDeadline: b.customerConfirmationDeadline,
      completedAt: b.completedAt,
      rejectedAt: b.rejectedAt,
      cancelledAt: b.cancelledAt,
      disputedAt: b.disputedAt,
      disputeReason: b.disputeReason,
      paymentExpiresAt: b.paymentExpiresAt,
      rejectReason: b.rejectReason,
      cancellationReason: b.cancellationReason,
      cancellationPolicyRule: b.cancellationPolicyRule,
      cancellationRefundPercentage: b.cancellationRefundPercentage,
      cancellationRefundAmount: b.cancellationRefundAmount,
      cancellationAppointmentAtUtc: b.cancellationAppointmentAtUtc,
      refund: mapRefundSummary(b.refund),
    };
  }

  private mapPaymentAttemptStatus(status: number | string): BookingPaymentDto['status'] {
    return mapBookingPaymentStatus(status);
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
