import { api } from '../services/api';
import type { IMuaBookingRepository } from './IMuaBookingRepository';
import type { BookingDto, BookingStatus, SelectedServiceDto } from '../types/booking';
import { mapBookingStatus, mapPaymentStatus, mapRefundSummary } from '../utils/bookingStatus';
import type { MuaEarningsDto, MuaReceivableDto } from '../types/earnings';

export class ApiMuaBookingRepository implements IMuaBookingRepository {
  
  async getPendingBookings(muaId: string): Promise<BookingDto[]> {
    const allBookings = await this.getAllBookings(muaId);
    return allBookings.filter(b => b.status === 'PENDING_CONFIRMATION');
  }

  async getAllBookings(muaId: string): Promise<BookingDto[]> {
    // The backend returns all bookings for the currently authenticated MUA.
    // Let React Query receive failures instead of presenting 401/network errors
    // as a legitimate empty booking list.
    const { data } = await api.get('/Booking?viewAs=mua');
    return data.map((b: any) => this.mapToBookingDto(b));
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus, reason?: string): Promise<BookingDto> {
    const statusEnumValues: Record<BookingStatus, number> = {
      'PENDING_PAYMENT': 5,
      'PENDING_CONFIRMATION': 6,
      'CONFIRMED': 1, // Approved
      'IN_PROGRESS': 8,
      'COMPLETED': 2, // Completed
      'CANCELLED': 3, // Cancelled
      'REJECTED': 7,
      'WAITING_CUSTOMER': 4,
      'DISPUTED': 9,
      'AUTO_COMPLETED': 10,
      'UNKNOWN': -1,
    };

    if (statusEnumValues[status] < 0) throw new Error('Không thể cập nhật trạng thái booking không xác định.');

    const { data } = await api.put(`/Booking/${bookingId}/status`, {
      status: statusEnumValues[status],
      reason: reason
    });

    return this.mapToBookingDto(data);
  }

  async getEarningsSnapshot(): Promise<MuaEarningsDto> {
    const { data } = await api.get<MuaEarningsDto>('/mua/earnings');
    const totals = [data.onHoldTotal, data.availableTotal, data.frozenTotal, data.payoutPendingTotal, data.paidOutTotal];
    if (totals.some(value => typeof value !== 'number') || !Array.isArray(data.receivables)) {
      throw new Error('Dữ liệu doanh thu không hợp lệ.');
    }

    const receivables: MuaReceivableDto[] = data.receivables.map((item) => ({
      ...item,
      grossAmount: Number(item.grossAmount),
      platformFeeAmount: Number(item.platformFeeAmount),
      netAmount: Number(item.netAmount),
    }));

    if (receivables.some(item => !Number.isFinite(item.grossAmount) || !Number.isFinite(item.platformFeeAmount) || !Number.isFinite(item.netAmount))) {
      throw new Error('Dữ liệu khoản thu không hợp lệ.');
    }

    return { ...data, receivables };
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
      status: mapBookingStatus(b.status),
      paymentStatus: mapPaymentStatus(b.paymentStatus),
      note: b.notes,
      
      serviceTotal: b.totalAmount ?? 0,
      travelFee: 0,
      totalAmount: b.totalAmount ?? 0,
      depositRate: b.depositRate ?? 0,
      depositAmount: b.depositAmount ?? 0,
      remainingAmount: b.remainingAmount ?? 0,
      platformFeeAmount: b.platformFeeAmount ?? 0,
      muaPayoutAmount: b.muaPayoutAmount ?? 0,
      
      paymentMethod: 'CASH',
      createdAt: b.createdAt ?? '',
      updatedAt: b.updatedAt ?? '',
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
      rejectReason: b.rejectReason,
      cancellationReason: b.cancellationReason,
      cancellationPolicyRule: b.cancellationPolicyRule,
      cancellationRefundPercentage: b.cancellationRefundPercentage,
      cancellationRefundAmount: b.cancellationRefundAmount,
      cancellationAppointmentAtUtc: b.cancellationAppointmentAtUtc,
      refund: mapRefundSummary(b.refund),
    };
  }

}
