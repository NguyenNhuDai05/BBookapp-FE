import { BookingDto, PaymentStatus } from '../types/booking';

export function isCalendarBooking(booking: BookingDto, viewAs: 'customer' | 'mua') {
  if (['CONFIRMED', 'IN_PROGRESS', 'WAITING_CUSTOMER'].includes(booking.status)) return true;
  return viewAs === 'customer' && booking.status === 'PENDING_CONFIRMATION'
    && (Boolean(booking.depositPaidAt) || [PaymentStatus.DEPOSIT_HELD, PaymentStatus.PAID_LEGACY].includes(booking.paymentStatus));
}
